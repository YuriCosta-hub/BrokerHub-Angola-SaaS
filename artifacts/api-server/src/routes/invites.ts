import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, eq } from "drizzle-orm";
import {
  clientsTable,
  invitesTable,
  membersTable,
  withRequestContext,
} from "@workspace/db";
import { errorBody } from "../lib/errors";
import { findMember, type MemberRole } from "../lib/auth";
import { primaryEmailForUser } from "../lib/clerk-email";
import { INVITE_TTL_MS } from "../lib/privacy";
import { hashToken, newInviteToken } from "../lib/tokens";
import { requireAdmin, requireAuth } from "../middlewares/access";

const inviteRoles = ["broker_master", "agent", "client"] as const;

function isInviteRole(value: unknown): value is (typeof inviteRoles)[number] {
  return (
    typeof value === "string" &&
    (inviteRoles as readonly string[]).includes(value)
  );
}

export const invitesAdminRouter = Router();
invitesAdminRouter.use(requireAdmin);

invitesAdminRouter.get("/invites", async (_req, res) => {
  const tenantId = res.locals.tenantId as string;
  const rows = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) =>
      tx
        .select()
        .from(invitesTable)
        .where(eq(invitesTable.tenantId, tenantId)),
  );
  res.json(
    rows.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      clientId: invite.clientId,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
    })),
  );
});

invitesAdminRouter.get("/members", async (_req, res) => {
  const tenantId = res.locals.tenantId as string;
  const rows = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, tenantId },
    async (tx) =>
      tx.select().from(membersTable).where(eq(membersTable.tenantId, tenantId)),
  );
  res.json(
    rows.map((member) => ({
      id: member.id,
      email: member.email,
      role: member.role,
      clientId: member.clientId,
      clerkUserId: member.clerkUserId,
      createdAt: member.createdAt.toISOString(),
    })),
  );
});

invitesAdminRouter.post("/invites", async (req, res) => {
  const body = req.body as {
    email?: unknown;
    role?: unknown;
    clientId?: unknown;
  };
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email.includes("@") || !isInviteRole(body.role)) {
    res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Email e papel válidos são obrigatórios"));
    return;
  }
  const role = body.role;
  if (role === "client" && typeof body.clientId !== "string") {
    res.status(400).json(
      errorBody(
        "VALIDATION_ERROR",
        "Convites de tomador exigem o cliente associado",
      ),
    );
    return;
  }
  const tenantId = res.locals.tenantId as string;
  const token = newInviteToken();
  const invite = await withRequestContext(
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
      const [created] = await tx
        .insert(invitesTable)
        .values({
          id: randomUUID(),
          tenantId,
          email,
          role,
          clientId: typeof body.clientId === "string" ? body.clientId : null,
          tokenHash: hashToken(token),
          invitedBy: res.locals.clerkUserId,
          expiresAt: new Date(Date.now() + INVITE_TTL_MS),
        })
        .returning();
      if (!created) throw new Error("Falha ao criar convite");
      return { created };
    },
  );
  if ("error" in invite) {
    res.status(400).json(errorBody("VALIDATION_ERROR", "Cliente inválido"));
    return;
  }
  res.status(201).json({
    id: invite.created.id,
    email: invite.created.email,
    role: invite.created.role,
    expiresAt: invite.created.expiresAt.toISOString(),
    token,
  });
});

export const invitesAcceptRouter = Router();
invitesAcceptRouter.use(requireAuth);

invitesAcceptRouter.post("/invites/accept", async (req, res) => {
  const token =
    typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (token.length < 16) {
    res.status(400).json(errorBody("VALIDATION_ERROR", "Token inválido"));
    return;
  }
  const existing = await findMember(res.locals.clerkUserId);
  if (existing) {
    res
      .status(409)
      .json(errorBody("CONFLICT", "Esta conta já pertence a uma corretora"));
    return;
  }
  const email = await primaryEmailForUser(res.locals.clerkUserId);
  if (!email) {
    res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "A conta não tem email verificado"));
    return;
  }
  const tokenHash = hashToken(token);
  const result = await withRequestContext(
    { clerkUserId: res.locals.clerkUserId, rlsBypass: true },
    async (tx) => {
      const invite = await tx.query.invitesTable.findFirst({
        where: eq(invitesTable.tokenHash, tokenHash),
      });
      if (!invite) return { error: "not_found" as const };
      if (invite.status !== "pending" || invite.expiresAt.getTime() < Date.now()) {
        if (invite.status === "pending") {
          await tx
            .update(invitesTable)
            .set({ status: "expired" })
            .where(eq(invitesTable.id, invite.id));
        }
        return { error: "expired" as const };
      }
      if (invite.email !== email) {
        return { error: "email" as const };
      }
      await tx.insert(membersTable).values({
        id: randomUUID(),
        tenantId: invite.tenantId,
        clerkUserId: res.locals.clerkUserId,
        role: invite.role as MemberRole,
        clientId: invite.clientId,
        email,
      });
      await tx
        .update(invitesTable)
        .set({ status: "accepted", acceptedAt: new Date() })
        .where(eq(invitesTable.id, invite.id));
      return { tenantId: invite.tenantId, role: invite.role };
    },
  );
  if ("error" in result) {
    if (result.error === "not_found") {
      res.status(404).json(errorBody("NOT_FOUND", "Convite não encontrado"));
      return;
    }
    if (result.error === "email") {
      res.status(403).json(
        errorBody(
          "FORBIDDEN",
          "O email da sessão não corresponde ao convite",
        ),
      );
      return;
    }
    res.status(409).json(errorBody("CONFLICT", "Convite expirado ou já usado"));
    return;
  }
  res.json(result);
});
