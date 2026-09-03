import { Router } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  claimsTable,
  clientsTable,
  documentsTable,
  policiesTable,
  withRequestContext,
} from "@workspace/db";
import { errorBody } from "../lib/errors";
import {
  RETENTION_YEARS,
  OPEN_CLAIM_STATUSES,
  addCalendarYears,
  luandaToday,
} from "../lib/privacy";
import { anonymizedNif } from "../lib/tokens";
import { deleteStoredFile } from "../lib/storage";
import { requireAdmin } from "../middlewares/access";

const router = Router();
router.use(requireAdmin);

router.post("/clients/:clientId/forget", async (req, res) => {
  const clientId = req.params.clientId;
  if (!clientId) {
    res.status(400).json(errorBody("VALIDATION_ERROR", "Cliente inválido"));
    return;
  }
  const tenantId = res.locals.tenantId as string;
  const outcome = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      const client = await tx.query.clientsTable.findFirst({
        where: and(
          eq(clientsTable.id, clientId),
          eq(clientsTable.tenantId, tenantId),
        ),
      });
      if (!client) return { error: "not_found" as const };
      if (client.anonymizedAt) return { error: "already" as const };

      const policies = await tx
        .select()
        .from(policiesTable)
        .where(
          and(
            eq(policiesTable.clientId, clientId),
            eq(policiesTable.tenantId, tenantId),
          ),
        );
      const today = luandaToday();
      const heldByRetention = policies.some(
        (policy) => addCalendarYears(policy.endDate, RETENTION_YEARS) > today,
      );
      if (heldByRetention) return { error: "retention" as const };

      const policyIds = policies.map((policy) => policy.id);
      if (policyIds.length > 0) {
        const openClaims = await tx
          .select()
          .from(claimsTable)
          .where(
            and(
              eq(claimsTable.tenantId, tenantId),
              inArray(claimsTable.policyId, policyIds),
              inArray(claimsTable.status, [...OPEN_CLAIM_STATUSES]),
            ),
          );
        if (openClaims.length > 0) return { error: "claims" as const };
      }

      const docs = await tx
        .select()
        .from(documentsTable)
        .where(
          and(
            eq(documentsTable.tenantId, tenantId),
            eq(documentsTable.clientId, clientId),
          ),
        );
      for (const doc of docs) {
        await deleteStoredFile(doc.storageKey);
        await tx.delete(documentsTable).where(eq(documentsTable.id, doc.id));
      }

      await tx
        .update(clientsTable)
        .set({
          name: "Titular anonimizado",
          email: `anon-${clientId.slice(0, 8)}@forgotten.invalid`,
          phone: "000000000",
          nif: anonymizedNif(clientId),
          status: "inactive",
          anonymizedAt: new Date(),
        })
        .where(eq(clientsTable.id, clientId));
      return { ok: true as const };
    },
  );

  if ("error" in outcome) {
    if (outcome.error === "not_found") {
      res.status(404).json(errorBody("NOT_FOUND", "Cliente não encontrado"));
      return;
    }
    if (outcome.error === "already") {
      res.status(409).json(errorBody("CONFLICT", "Cliente já anonimizado"));
      return;
    }
    res.status(409).json(
      errorBody(
        "RETENTION_HOLD",
        outcome.error === "claims"
          ? "Existem sinistros abertos. Conclua o processo antes do esquecimento."
          : `A retenção legal de ${RETENTION_YEARS} anos após o fim da apólice ainda está em vigor.`,
      ),
    );
    return;
  }
  res.json({ forgotten: true });
});

export default router;
