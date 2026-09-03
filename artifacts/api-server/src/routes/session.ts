import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
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

const router: IRouter = Router();

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const clerkUserId = res.locals.clerkUserId;
  const member = await findMember(clerkUserId);
  const role = member?.role ?? null;
  const mfaRequired = roleRequiresMfa(role);
  const mfaSatisfied = sessionHasMfa(req);

  if (!member) {
    res.json({
      userId: clerkUserId,
      tenant: null,
      role: null,
      mfa: { required: mfaRequired, satisfied: mfaSatisfied },
    });
    return;
  }

  const tenant = await withRequestContext(
    { clerkUserId, tenantId: member.tenantId },
    async (tx) =>
      tx.query.tenantsTable.findFirst({
        where: eq(tenantsTable.id, member.tenantId),
      }),
  );

  res.json({
    userId: clerkUserId,
    role: member.role,
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
