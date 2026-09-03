import { getAuth } from "@clerk/express";
import type { Request } from "express";
import { eq } from "drizzle-orm";
import {
  membersTable,
  withRequestContext,
  type TenantTx,
} from "@workspace/db";

export const privilegedRoles = ["super_admin", "broker_master"] as const;

export type MemberRole =
  | "super_admin"
  | "broker_master"
  | "agent"
  | "client";

export type MemberRecord = {
  tenantId: string;
  role: MemberRole;
  clerkUserId: string;
};

export function isMfaEnforced(): boolean {
  if (process.env.NODE_ENV === "production") {
    if (process.env.MFA_ENFORCE === "false") {
      throw new Error("MFA_ENFORCE=false is not allowed in production");
    }
    return true;
  }
  return process.env.MFA_ENFORCE !== "false";
}

function isNumberPair(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
}

export function sessionHasMfa(req: Request): boolean {
  const auth = getAuth(req);
  if ("factorVerificationAge" in auth) {
    const fva = auth.factorVerificationAge;
    if (isNumberPair(fva)) {
      return fva[1] >= 0;
    }
  }
  if ("sessionClaims" in auth && auth.sessionClaims) {
    const claims: unknown = auth.sessionClaims;
    if (typeof claims === "object" && claims !== null && "fva" in claims) {
      const fva = (claims as { fva: unknown }).fva;
      if (isNumberPair(fva)) {
        return fva[1] >= 0;
      }
    }
  }
  return false;
}

export function roleRequiresMfa(role: MemberRole | null): boolean {
  if (!isMfaEnforced()) return false;
  if (role === null) return true;
  return (privilegedRoles as readonly string[]).includes(role);
}

export function requireClerkUserId(req: Request): string | null {
  return getAuth(req).userId ?? null;
}

export async function findMember(
  clerkUserId: string,
): Promise<MemberRecord | null> {
  return await withRequestContext({ clerkUserId }, async (tx: TenantTx) => {
    const row = await tx.query.membersTable.findFirst({
      where: eq(membersTable.clerkUserId, clerkUserId),
    });
    if (!row) return null;
    return {
      tenantId: row.tenantId,
      role: row.role,
      clerkUserId: row.clerkUserId,
    };
  });
}
