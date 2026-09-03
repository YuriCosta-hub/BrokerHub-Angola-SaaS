import type { NextFunction, Request, Response } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { consentsTable, withRequestContext } from "@workspace/db";
import { errorBody } from "../lib/errors";
import {
  crmRoles,
  findMember,
  privilegedRoles,
  requireClerkUserId,
  roleRequiresMfa,
  sessionHasMfa,
  type MemberRole,
} from "../lib/auth";
import { PRIVACY_POLICY_VERSION } from "../lib/privacy";
import { ensureSubscription } from "../lib/subscription";

const CONSENT_EXEMPT_PREFIXES = [
  "/me",
  "/consents",
  "/tenants",
  "/invites/accept",
  "/healthz",
];

const SUBSCRIPTION_EXEMPT_PREFIXES = [
  "/me",
  "/consents",
  "/tenants",
  "/billing",
  "/invites/accept",
];

function isExempt(path: string, prefixes: string[]): boolean {
  const relative = path.startsWith("/api") ? path.slice(4) : path;
  return prefixes.some(
    (prefix) => relative === prefix || relative.startsWith(`${prefix}/`),
  );
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = requireClerkUserId(req);
  if (!userId) {
    res
      .status(401)
      .json(errorBody("UNAUTHENTICATED", "Autenticação necessária"));
    return;
  }
  res.locals.clerkUserId = userId;
  next();
}

export async function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const member = await findMember(res.locals.clerkUserId);
  if (!member) {
    res
      .status(403)
      .json(errorBody("TENANT_REQUIRED", "Corretora não registada"));
    return;
  }
  if (roleRequiresMfa(member.role) && !sessionHasMfa(req)) {
    res.status(403).json(
      errorBody(
        "MFA_REQUIRED",
        "Autenticação de dois factores obrigatória para perfis administrativos",
      ),
    );
    return;
  }
  res.locals.tenantId = member.tenantId;
  res.locals.role = member.role;
  res.locals.clientId = member.clientId;
  next();
}

export async function requireConsent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (isExempt(req.path, CONSENT_EXEMPT_PREFIXES)) {
    next();
    return;
  }
  const clerkUserId = res.locals.clerkUserId;
  const granted = await withRequestContext({ clerkUserId }, async (tx) => {
    const row = await tx.query.consentsTable.findFirst({
      where: and(
        eq(consentsTable.clerkUserId, clerkUserId),
        eq(consentsTable.purpose, "privacy_notice"),
        eq(consentsTable.policyVersion, PRIVACY_POLICY_VERSION),
        isNull(consentsTable.withdrawnAt),
      ),
    });
    return Boolean(row);
  });
  if (!granted) {
    res.status(403).json(
      errorBody(
        "CONSENT_REQUIRED",
        "É necessário aceitar a política de privacidade",
      ),
    );
    return;
  }
  next();
}

export async function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (isExempt(req.path, SUBSCRIPTION_EXEMPT_PREFIXES)) {
    next();
    return;
  }
  const tenantId = res.locals.tenantId;
  if (!tenantId) {
    next();
    return;
  }
  const subscription = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => ensureSubscription(tx, tenantId),
  );
  if (subscription.status === "suspended") {
    res.status(403).json(
      errorBody(
        "SUBSCRIPTION_SUSPENDED",
        "Subscrição suspensa. Regularize o pagamento para continuar.",
      ),
    );
    return;
  }
  next();
}

export function requireRoles(...roles: MemberRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = res.locals.role;
    if (!role || !roles.includes(role)) {
      res
        .status(403)
        .json(errorBody("FORBIDDEN", "Sem permissão para esta operação"));
      return;
    }
    next();
  };
}

export const requireCrm = requireRoles(...crmRoles);
export const requireAdmin = requireRoles(...privilegedRoles);
export const requirePolicyholder = requireRoles("client");
