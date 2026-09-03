import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  clientsTable,
  documentsTable,
  withRequestContext,
} from "@workspace/db";
import { errorBody } from "../lib/errors";
import { crmRoles } from "../lib/auth";
import {
  decodeBase64File,
  resolveStoragePath,
  storeDocument,
} from "../lib/storage";

const router = Router();

router.get("/documents", async (_req, res) => {
  const tenantId = res.locals.tenantId as string;
  const role = res.locals.role;
  const clientId = res.locals.clientId;
  const rows = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      if (role === "client") {
        if (!clientId) return [];
        return tx
          .select()
          .from(documentsTable)
          .where(
            and(
              eq(documentsTable.tenantId, tenantId),
              eq(documentsTable.clientId, clientId),
            ),
          );
      }
      return tx
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.tenantId, tenantId));
    },
  );
  res.json(
    rows.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      contentType: doc.contentType,
      sizeBytes: doc.sizeBytes,
      clientId: doc.clientId,
      policyId: doc.policyId,
      claimId: doc.claimId,
      createdAt: doc.createdAt.toISOString(),
    })),
  );
});

router.get("/documents/:documentId/file", async (req, res) => {
  const tenantId = res.locals.tenantId as string;
  const documentId = req.params.documentId;
  if (!documentId) {
    res.status(400).json(errorBody("VALIDATION_ERROR", "Documento inválido"));
    return;
  }
  const doc = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) =>
      tx.query.documentsTable.findFirst({
        where: and(
          eq(documentsTable.id, documentId),
          eq(documentsTable.tenantId, tenantId),
        ),
      }),
  );
  if (!doc) {
    res.status(404).json(errorBody("NOT_FOUND", "Documento não encontrado"));
    return;
  }
  if (
    res.locals.role === "client" &&
    doc.clientId !== res.locals.clientId
  ) {
    res.status(403).json(errorBody("FORBIDDEN", "Sem acesso a este documento"));
    return;
  }
  const fullPath = resolveStoragePath(doc.storageKey);
  if (!fullPath) {
    res.status(404).json(errorBody("NOT_FOUND", "Ficheiro indisponível"));
    return;
  }
  res.setHeader("Content-Type", doc.contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
  );
  createReadStream(fullPath).pipe(res);
});

router.post("/documents", async (req, res) => {
  if (!res.locals.role || !(crmRoles as readonly string[]).includes(res.locals.role)) {
    res.status(403).json(errorBody("FORBIDDEN", "Apenas a corretora pode carregar documentos"));
    return;
  }
  const body = req.body as {
    fileName?: unknown;
    contentType?: unknown;
    contentBase64?: unknown;
    clientId?: unknown;
    policyId?: unknown;
    claimId?: unknown;
  };
  const fileName =
    typeof body.fileName === "string" ? body.fileName.trim() : "";
  const contentType =
    typeof body.contentType === "string"
      ? body.contentType
      : "application/octet-stream";
  const contentBase64 =
    typeof body.contentBase64 === "string" ? body.contentBase64 : "";
  if (!fileName || !contentBase64) {
    res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Ficheiro e nome são obrigatórios"));
    return;
  }
  const tenantId = res.locals.tenantId as string;
  let stored: { storageKey: string; sizeBytes: number };
  try {
    stored = await storeDocument({
      tenantId,
      fileName,
      contentType,
      bytes: decodeBase64File(contentBase64),
    });
  } catch {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "Ficheiro inválido ou acima de 1,5 MB",
      ),
    );
    return;
  }

  const created = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) => {
      if (typeof body.clientId === "string") {
        const client = await tx.query.clientsTable.findFirst({
          where: and(
            eq(clientsTable.id, body.clientId),
            eq(clientsTable.tenantId, tenantId),
          ),
        });
        if (!client) return { error: "client" as const };
      }
      const [row] = await tx
        .insert(documentsTable)
        .values({
          id: randomUUID(),
          tenantId,
          fileName,
          contentType,
          sizeBytes: stored.sizeBytes,
          storageKey: stored.storageKey,
          clientId: typeof body.clientId === "string" ? body.clientId : null,
          policyId: typeof body.policyId === "string" ? body.policyId : null,
          claimId: typeof body.claimId === "string" ? body.claimId : null,
          createdBy: res.locals.clerkUserId,
        })
        .returning();
      if (!row) throw new Error("Falha ao guardar metadados do documento");
      return { row };
    },
  );
  if ("error" in created) {
    res.status(400).json(errorBody("VALIDATION_ERROR", "Cliente inválido"));
    return;
  }
  res.status(201).json({
    id: created.row.id,
    fileName: created.row.fileName,
    sizeBytes: created.row.sizeBytes,
  });
});

export default router;
