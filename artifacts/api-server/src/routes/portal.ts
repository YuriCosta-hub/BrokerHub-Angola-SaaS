import { Router, type Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  claimsTable,
  clientsTable,
  documentsTable,
  policiesTable,
  withRequestContext,
} from "@workspace/db";
import { errorBody } from "../lib/errors";
import { requirePolicyholder } from "../middlewares/access";

const router = Router();
router.use(requirePolicyholder);

function clientScope(res: Response) {
  const clientId = res.locals.clientId;
  const tenantId = res.locals.tenantId as string;
  return { clientId, tenantId };
}

router.get("/portal/policies", async (_req, res) => {
  const { clientId, tenantId } = clientScope(res);
  if (!clientId) {
    res.status(403).json(errorBody("FORBIDDEN", "Portal sem tomador associado"));
    return;
  }
  const rows = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) =>
      tx
        .select({ policy: policiesTable, clientName: clientsTable.name })
        .from(policiesTable)
        .innerJoin(clientsTable, eq(policiesTable.clientId, clientsTable.id))
        .where(
          and(
            eq(policiesTable.tenantId, tenantId),
            eq(policiesTable.clientId, clientId),
          ),
        ),
  );
  res.json(
    rows.map(({ policy, clientName }) => ({
      ...policy,
      clientName,
      premium: Number(policy.premium),
      commission: Number(policy.commission),
    })),
  );
});

router.get("/portal/claims", async (_req, res) => {
  const { clientId, tenantId } = clientScope(res);
  if (!clientId) {
    res.status(403).json(errorBody("FORBIDDEN", "Portal sem tomador associado"));
    return;
  }
  const rows = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) =>
      tx
        .select({
          claim: claimsTable,
          policyNumber: policiesTable.number,
          insurer: policiesTable.insurer,
        })
        .from(claimsTable)
        .innerJoin(policiesTable, eq(claimsTable.policyId, policiesTable.id))
        .where(
          and(
            eq(claimsTable.tenantId, tenantId),
            eq(policiesTable.clientId, clientId),
          ),
        ),
  );
  res.json(
    rows.map(({ claim, policyNumber, insurer }) => ({
      ...claim,
      policyNumber,
      insurer,
      amount: Number(claim.amount),
      createdAt: claim.createdAt.toISOString(),
    })),
  );
});

router.get("/portal/documents", async (_req, res) => {
  const { clientId, tenantId } = clientScope(res);
  if (!clientId) {
    res.status(403).json(errorBody("FORBIDDEN", "Portal sem tomador associado"));
    return;
  }
  const rows = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) =>
      tx
        .select()
        .from(documentsTable)
        .where(
          and(
            eq(documentsTable.tenantId, tenantId),
            eq(documentsTable.clientId, clientId),
          ),
        ),
  );
  res.json(
    rows.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      contentType: doc.contentType,
      sizeBytes: doc.sizeBytes,
      createdAt: doc.createdAt.toISOString(),
    })),
  );
});

export default router;
