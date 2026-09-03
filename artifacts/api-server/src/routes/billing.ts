import { Router } from "express";
import { eq } from "drizzle-orm";
import { subscriptionsTable, withRequestContext } from "@workspace/db";
import { errorBody } from "../lib/errors";
import { requireAdmin, requireCrm } from "../middlewares/access";
import { ensureSubscription } from "../lib/subscription";

const router = Router();

function planPeriodMs(plan: "monthly" | "semiannual" | "annual"): number {
  if (plan === "annual") return 365 * 86_400_000;
  if (plan === "semiannual") return 182 * 86_400_000;
  return 30 * 86_400_000;
}

router.get("/billing", requireCrm, async (_req, res) => {
  const tenantId = res.locals.tenantId as string;
  const subscription = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => ensureSubscription(tx, tenantId),
  );
  res.json({
    status: subscription.status,
    plan: subscription.plan,
    currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
    currency: "AOA",
    stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
    multicaixaReference: subscription.multicaixaReference,
  });
});

router.post("/billing/multicaixa", requireAdmin, async (req, res) => {
  const plan =
    req.body?.plan === "annual" || req.body?.plan === "semiannual"
      ? req.body.plan
      : "monthly";
  const tenantId = res.locals.tenantId as string;
  const reference = `BH${Date.now().toString().slice(-9)}`;
  await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      const current = await ensureSubscription(tx, tenantId);
      await tx
        .update(subscriptionsTable)
        .set({
          plan,
          multicaixaReference: reference,
          status: current.status === "suspended" ? "past_due" : current.status,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.tenantId, tenantId));
    },
  );
  res.status(201).json({
    provider: "multicaixa",
    reference,
    entity: process.env.MULTICAIXA_ENTITY ?? "00000",
    currency: "AOA",
    instructions:
      "Pague a referência Multicaixa Express. A activação é confirmada pelo operador da corretora ou pelo webhook bancário.",
  });
});

router.post("/billing/multicaixa/confirm", requireAdmin, async (_req, res) => {
  const tenantId = res.locals.tenantId as string;
  const plan = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      const current = await ensureSubscription(tx, tenantId);
      await tx
        .update(subscriptionsTable)
        .set({
          status: "active",
          currentPeriodEnd: new Date(Date.now() + planPeriodMs(current.plan)),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.tenantId, tenantId));
      return current.plan;
    },
  );
  res.json({ status: "active", plan });
});

router.post("/billing/stripe/checkout", requireAdmin, async (req, res) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "Stripe não configurado. Use Multicaixa ou defina STRIPE_SECRET_KEY.",
      ),
    );
    return;
  }
  const plan =
    req.body?.plan === "annual" || req.body?.plan === "semiannual"
      ? req.body.plan
      : "monthly";
  const origin = req.get("origin") ?? "http://localhost:5000";
  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${origin}/facturacao?stripe=success&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}/facturacao?stripe=cancel`);
  params.set("client_reference_id", res.locals.tenantId as string);
  params.set("metadata[tenantId]", res.locals.tenantId as string);
  params.set("metadata[plan]", plan);
  const price = process.env.STRIPE_PRICE_ID;
  if (price) {
    params.set("line_items[0][price]", price);
    params.set("line_items[0][quantity]", "1");
  } else {
    params.set("line_items[0][price_data][currency]", "usd");
    params.set("line_items[0][price_data][product_data][name]", `BrokerHub ${plan}`);
    params.set("line_items[0][price_data][unit_amount]", "4900");
    params.set("line_items[0][price_data][recurring][interval]", "month");
    params.set("line_items[0][quantity]", "1");
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = (await stripeRes.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };
  if (!stripeRes.ok || !payload.url || !payload.id) {
    res.status(502).json(
      errorBody(
        "VALIDATION_ERROR",
        payload.error?.message ?? "Stripe recusou a sessão de checkout",
      ),
    );
    return;
  }
  const tenantId = res.locals.tenantId as string;
  await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      await tx
        .update(subscriptionsTable)
        .set({
          plan,
          stripeCheckoutId: payload.id,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.tenantId, tenantId));
    },
  );
  res.json({ url: payload.url, sessionId: payload.id });
});

router.post("/billing/stripe/confirm", requireAdmin, async (req, res) => {
  const secret = process.env.STRIPE_SECRET_KEY;
  const sessionId =
    typeof req.body?.sessionId === "string" ? req.body.sessionId : "";
  if (!secret || !sessionId) {
    res.status(400).json(errorBody("VALIDATION_ERROR", "Sessão Stripe inválida"));
    return;
  }
  const stripeRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const session = (await stripeRes.json()) as {
    payment_status?: string;
    status?: string;
    client_reference_id?: string;
  };
  if (session.client_reference_id !== res.locals.tenantId) {
    res.status(403).json(errorBody("FORBIDDEN", "Sessão não pertence a esta corretora"));
    return;
  }
  if (session.payment_status !== "paid" && session.status !== "complete") {
    res.status(409).json(errorBody("CONFLICT", "Pagamento Stripe ainda não confirmado"));
    return;
  }
  const tenantId = res.locals.tenantId as string;
  await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      const current = await ensureSubscription(tx, tenantId);
      await tx
        .update(subscriptionsTable)
        .set({
          status: "active",
          stripeCheckoutId: sessionId,
          currentPeriodEnd: new Date(Date.now() + planPeriodMs(current.plan)),
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.tenantId, tenantId));
    },
  );
  res.json({ status: "active" });
});

export default router;
