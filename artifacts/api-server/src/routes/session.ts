import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, isNull } from "drizzle-orm";
import {
  consentsTable,
  membersTable,
  tenantsTable,
  withRequestContext,
} from "@workspace/db";
import { errorBody } from "../lib/errors";
import {
  findMember,
  roleRequiresMfa,
  sessionHasMfa,
} from "../lib/auth";
import { isValidAngolaNif, normalizeNif } from "../lib/nif";
import { requireAuth } from "../middlewares/access";
import { PRIVACY_POLICY_VERSION } from "../lib/privacy";
import { hashIp } from "../lib/tokens";
import { ensureSubscription } from "../lib/subscription";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const clerkUserId = res.locals.clerkUserId;
  const member = await findMember(clerkUserId);
  const role = member?.role ?? null;
  const mfaRequired = roleRequiresMfa(role);
  const mfaSatisfied = sessionHasMfa(req);

  const consent = await withRequestContext({ clerkUserId }, async (tx) =>
    tx.query.consentsTable.findFirst({
      where: and(
        eq(consentsTable.clerkUserId, clerkUserId),
        eq(consentsTable.purpose, "privacy_notice"),
        eq(consentsTable.policyVersion, PRIVACY_POLICY_VERSION),
        isNull(consentsTable.withdrawnAt),
      ),
    }),
  );

  if (!member) {
    res.json({
      userId: clerkUserId,
      tenant: null,
      role: null,
      clientId: null,
      consentGranted: Boolean(consent),
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      subscriptionStatus: null,
      mfa: { required: mfaRequired, satisfied: mfaSatisfied },
    });
    return;
  }

  const { tenant, subscription } = await withRequestContext(
    { clerkUserId, tenantId: member.tenantId },
    async (tx) => {
      const tenantRow = await tx.query.tenantsTable.findFirst({
        where: eq(tenantsTable.id, member.tenantId),
      });
      const subscriptionRow = await ensureSubscription(tx, member.tenantId);
      return { tenant: tenantRow, subscription: subscriptionRow };
    },
  );

  res.json({
    userId: clerkUserId,
    role: member.role,
    clientId: member.clientId,
    consentGranted: Boolean(consent),
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    subscriptionStatus: subscription.status,
    tenant: tenant
      ? {
          id: tenant.id,
          name: tenant.name,
          nif: tenant.nif,
          timezone: tenant.timezone,
          currency: tenant.currency,
        }
      : null,
    mfa: { required: mfaRequired, satisfied: mfaSatisfied },
  });
});

router.get("/consents/status", async (_req, res) => {
  const clerkUserId = res.locals.clerkUserId;
  const rows = await withRequestContext({ clerkUserId }, async (tx) =>
    tx
      .select()
      .from(consentsTable)
      .where(
        and(
          eq(consentsTable.clerkUserId, clerkUserId),
          isNull(consentsTable.withdrawnAt),
        ),
      ),
  );
  res.json({
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    privacyNotice: rows.some(
      (row) =>
        row.purpose === "privacy_notice" &&
        row.policyVersion === PRIVACY_POLICY_VERSION,
    ),
    marketing: rows.some((row) => row.purpose === "marketing"),
  });
});

router.post("/consents", async (req, res) => {
  const body = req.body as { purpose?: unknown; granted?: unknown };
  const purpose =
    body.purpose === "marketing" ? "marketing" : "privacy_notice";
  if (body.granted === false) {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "O consentimento da política de privacidade é obrigatório",
      ),
    );
    return;
  }
  const clerkUserId = res.locals.clerkUserId;
  const member = await findMember(clerkUserId);
  await withRequestContext(
    {
      clerkUserId,
      tenantId: member?.tenantId,
    },
    async (tx) => {
      await tx.insert(consentsTable).values({
        id: randomUUID(),
        tenantId: member?.tenantId,
        clerkUserId,
        purpose,
        policyVersion: PRIVACY_POLICY_VERSION,
        ipHash: hashIp(req.ip),
      });
    },
  );
  res.status(201).json({
    purpose,
    policyVersion: PRIVACY_POLICY_VERSION,
    granted: true,
  });
});

router.post("/tenants", async (req, res) => {
  if (roleRequiresMfa(null) && !sessionHasMfa(req)) {
    res.status(403).json(
      errorBody(
        "MFA_REQUIRED",
        "Configure a autenticação de dois factores antes de criar a corretora",
      ),
    );
    return;
  }

  const body = req.body as { name?: unknown; nif?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const nif =
    typeof body.nif === "string" ? normalizeNif(body.nif) : "";
  if (name.length < 2 || !isValidAngolaNif(nif)) {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "Nome da corretora e NIF angolano válido são obrigatórios",
      ),
    );
    return;
  }

  const existing = await findMember(res.locals.clerkUserId);
  if (existing) {
    res
      .status(409)
      .json(errorBody("CONFLICT", "Já existe uma corretora para esta conta"));
    return;
  }

  const tenantId = randomUUID();
  try {
    await withRequestContext(
      {
        clerkUserId: res.locals.clerkUserId,
        allowTenantCreate: true,
      },
      async (tx) => {
        await tx.insert(tenantsTable).values({
          id: tenantId,
          name,
          nif,
        });
        await tx.insert(membersTable).values({
          id: randomUUID(),
          tenantId,
          clerkUserId: res.locals.clerkUserId,
          role: "broker_master",
        });
        await ensureSubscription(tx, tenantId);
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("tenants_nif") || message.includes("unique")) {
      res
        .status(409)
        .json(errorBody("CONFLICT", "Já existe uma corretora com este NIF"));
      return;
    }
    throw err;
  }

  res.status(201).json({
    id: tenantId,
    name,
    nif,
    timezone: "Africa/Luanda",
    currency: "AOA",
  });
});

export default router;
