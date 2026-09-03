import type { NextFunction, Request, Response } from "express";
import { errorBody } from "../lib/errors";
import {
  findMember,
  requireClerkUserId,
  roleRequiresMfa,
  sessionHasMfa,
} from "../lib/auth";

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
  next();
}
