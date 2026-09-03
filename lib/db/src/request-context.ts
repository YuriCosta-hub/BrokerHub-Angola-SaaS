import { sql } from "drizzle-orm";
import { db } from "./index";

export type TenantTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type RequestDbContext = {
  clerkUserId: string;
  tenantId?: string;
  allowTenantCreate?: boolean;
};

export async function withRequestContext<T>(
  ctx: RequestDbContext,
  fn: (tx: TenantTx) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT set_config('app.clerk_user_id', ${ctx.clerkUserId}, true)`,
    );
    if (ctx.tenantId) {
      await tx.execute(
        sql`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`,
      );
    }
    if (ctx.allowTenantCreate) {
      await tx.execute(
        sql`SELECT set_config('app.allow_tenant_create', 'on', true)`,
      );
    }
    return await fn(tx);
  });
}
