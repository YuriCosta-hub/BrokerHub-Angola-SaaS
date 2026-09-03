import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { subscriptionsTable, type TenantTx } from "@workspace/db";
import { trialEndsAt } from "./privacy";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended";

export async function ensureSubscription(
  tx: TenantTx,
  tenantId: string,
): Promise<{
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  plan: "monthly" | "semiannual" | "annual";
  multicaixaReference: string | null;
}> {
  const existing = await tx.query.subscriptionsTable.findFirst({
    where: eq(subscriptionsTable.tenantId, tenantId),
  });
  if (existing) {
    const expired = existing.currentPeriodEnd.getTime() < Date.now();
    if (expired && existing.status !== "suspended") {
      await tx
        .update(subscriptionsTable)
        .set({ status: "suspended", updatedAt: new Date() })
        .where(eq(subscriptionsTable.id, existing.id));
      return {
        status: "suspended",
        currentPeriodEnd: existing.currentPeriodEnd,
        plan: existing.plan,
        multicaixaReference: existing.multicaixaReference ?? null,
      };
    }
    return {
      status: existing.status,
      currentPeriodEnd: existing.currentPeriodEnd,
      plan: existing.plan,
      multicaixaReference: existing.multicaixaReference ?? null,
    };
  }

  const periodEnd = trialEndsAt();
  await tx.insert(subscriptionsTable).values({
    id: randomUUID(),
    tenantId,
    plan: "monthly",
    status: "trialing",
    currentPeriodEnd: periodEnd,
  });
  return {
    status: "trialing",
    currentPeriodEnd: periodEnd,
    plan: "monthly",
    multicaixaReference: null,
  };
}
