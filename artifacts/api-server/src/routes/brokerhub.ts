import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import {
  activitiesTable,
  claimsTable,
  clientsTable,
  policiesTable,
  withRequestContext,
} from "@workspace/db";
import {
  CreateClaimBody,
  CreateClientBody,
  CreatePolicyBody,
  ListActivitiesQueryParams,
  ListClaimsQueryParams,
  ListClientsQueryParams,
  ListPoliciesQueryParams,
  UpdateClientBody,
  UpdateClientParams,
} from "@workspace/api-zod";
import { errorBody } from "../lib/errors";
import { requireCrm } from "../middlewares/access";

const router = Router();

router.use(requireCrm);

function ctx(res: Response) {
  return {
    clerkUserId: res.locals.clerkUserId,
    tenantId: res.locals.tenantId as string,
  };
}

router.get("/dashboard/summary", async (_req, res) => {
  const tenantId = ctx(res).tenantId;
  const { clients, policies, claims } = await withRequestContext(
    ctx(res),
    async (tx) => {
      const [clientRows, policyRows, claimRows] = await Promise.all([
        tx.select().from(clientsTable).where(eq(clientsTable.tenantId, tenantId)),
        tx
          .select()
          .from(policiesTable)
          .where(eq(policiesTable.tenantId, tenantId)),
        tx.select().from(claimsTable).where(eq(claimsTable.tenantId, tenantId)),
      ]);
      return { clients: clientRows, policies: policyRows, claims: claimRows };
    },
  );
  const activePolicies = policies.filter((policy) => policy.status === "active");
  const renewals = policies.filter((policy) => policy.status === "renewal");
  const portfolioValue = policies.reduce(
    (sum, policy) => sum + Number(policy.premium),
    0,
  );
  const policyCounts = new Map<string, number>();
  for (const policy of policies) {
    policyCounts.set(policy.type, (policyCounts.get(policy.type) ?? 0) + 1);
  }
  const renewalRate =
    policies.length === 0
      ? 0
      : Math.round((activePolicies.length / policies.length) * 100);

  res.json({
    activeClients: clients.filter((client) => client.status === "active")
      .length,
    activePolicies: activePolicies.length,
    openClaims: claims.filter((claim) =>
      ["open", "in_review"].includes(claim.status),
    ).length,
    renewalsThisMonth: renewals.length,
    portfolioValue,
    commissionValue: policies.reduce(
      (sum, policy) => sum + Number(policy.commission),
      0,
    ),
    renewalRate,
    monthlyTrend: [
      { month: "Abr", value: portfolioValue * 0.74 },
      { month: "Mai", value: portfolioValue * 0.79 },
      { month: "Jun", value: portfolioValue * 0.84 },
      { month: "Jul", value: portfolioValue * 0.91 },
      { month: "Ago", value: portfolioValue * 0.95 },
      { month: "Set", value: portfolioValue },
    ],
    policyMix: Array.from(policyCounts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage:
        policies.length === 0
          ? 0
          : Math.round((count / policies.length) * 100),
    })),
  });
});

router.get("/activities", async (req, res) => {
  const parsed = ListActivitiesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Filtro inválido"));
  }
  const activities = await withRequestContext(ctx(res), async (tx) =>
    tx
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.tenantId, ctx(res).tenantId))
      .orderBy(desc(activitiesTable.createdAt))
      .limit(parsed.data.limit),
  );
  return res.json(
    activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: activity.createdAt.toISOString(),
      initials: "BH",
      tone: activity.tone,
    })),
  );
});

router.get("/clients", async (req, res) => {
  const parsed = ListClientsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Filtro inválido"));
  }
  const tenantId = ctx(res).tenantId;
  const { clients, policies } = await withRequestContext(ctx(res), async (tx) => {
    const [clientRows, policyRows] = await Promise.all([
      tx
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.tenantId, tenantId))
        .orderBy(desc(clientsTable.createdAt)),
      tx.select().from(policiesTable).where(eq(policiesTable.tenantId, tenantId)),
    ]);
    return { clients: clientRows, policies: policyRows };
  });
  const search = parsed.data.search?.toLocaleLowerCase("pt") ?? "";
  return res.json(
    clients
      .filter((client) =>
        `${client.name} ${client.nif} ${client.email}`
          .toLocaleLowerCase("pt")
          .includes(search),
      )
      .slice(0, parsed.data.limit)
      .map((client) => {
        const owned = policies.filter((policy) => policy.clientId === client.id);
        return {
          ...client,
          policiesCount: owned.length,
          totalPremium: owned.reduce(
            (sum, policy) => sum + Number(policy.premium),
            0,
          ),
          createdAt: client.createdAt.toISOString(),
        };
      }),
  );
});

router.post("/clients", async (req, res) => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Dados inválidos"));
  }
  const tenantId = ctx(res).tenantId;
  const id = randomUUID();
  const client = await withRequestContext(ctx(res), async (tx) => {
    const [created] = await tx
      .insert(clientsTable)
      .values({
        ...parsed.data,
        id,
        tenantId,
        status: "active",
      })
      .returning();
    if (!created) {
      throw new Error("Falha ao criar cliente");
    }
    await tx.insert(activitiesTable).values({
      id: randomUUID(),
      tenantId,
      actorUserId: getAuth(req).userId,
      type: "client",
      title: "Novo cliente registado",
      description: `${created.name} foi adicionado à carteira.`,
      tone: "blue",
    });
    return created;
  });
  return res.status(201).json({
    ...client,
    policiesCount: 0,
    totalPremium: 0,
    createdAt: client.createdAt.toISOString(),
  });
});

router.patch("/clients/:clientId", async (req, res) => {
  const params = UpdateClientParams.safeParse(req.params);
  const body = UpdateClientBody.safeParse(req.body);
  if (!params.success || !body.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Dados inválidos"));
  }
  const tenantId = ctx(res).tenantId;
  const result = await withRequestContext(ctx(res), async (tx) => {
    const [client] = await tx
      .update(clientsTable)
      .set(body.data)
      .where(
        and(
          eq(clientsTable.id, params.data.clientId),
          eq(clientsTable.tenantId, tenantId),
        ),
      )
      .returning();
    if (!client) return null;
    const policies = await tx
      .select()
      .from(policiesTable)
      .where(
        and(
          eq(policiesTable.clientId, client.id),
          eq(policiesTable.tenantId, tenantId),
        ),
      );
    return { client, policies };
  });
  if (!result) {
    return res
      .status(404)
      .json(errorBody("NOT_FOUND", "Cliente não encontrado"));
  }
  return res.json({
    ...result.client,
    policiesCount: result.policies.length,
    totalPremium: result.policies.reduce(
      (sum, policy) => sum + Number(policy.premium),
      0,
    ),
    createdAt: result.client.createdAt.toISOString(),
  });
});

router.get("/policies", async (req, res) => {
  const parsed = ListPoliciesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Filtro inválido"));
  }
  const rows = await withRequestContext(ctx(res), async (tx) =>
    tx
      .select({ policy: policiesTable, clientName: clientsTable.name })
      .from(policiesTable)
      .innerJoin(clientsTable, eq(policiesTable.clientId, clientsTable.id))
      .where(eq(policiesTable.tenantId, ctx(res).tenantId))
      .orderBy(desc(policiesTable.createdAt)),
  );
  const search = parsed.data.search?.toLocaleLowerCase("pt") ?? "";
  return res.json(
    rows
      .filter(
        ({ policy, clientName }) =>
          (!parsed.data.status || policy.status === parsed.data.status) &&
          `${policy.number} ${policy.insurer} ${clientName}`
            .toLocaleLowerCase("pt")
            .includes(search),
      )
      .slice(0, parsed.data.limit)
      .map(({ policy, clientName }) => ({
        ...policy,
        clientName,
        premium: Number(policy.premium),
        commission: Number(policy.commission),
      })),
  );
});

router.post("/policies", async (req, res) => {
  const parsed = CreatePolicyBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Dados inválidos"));
  }
  const tenantId = ctx(res).tenantId;
  const created = await withRequestContext(ctx(res), async (tx) => {
    const client = await tx.query.clientsTable.findFirst({
      where: and(
        eq(clientsTable.id, parsed.data.clientId),
        eq(clientsTable.tenantId, tenantId),
      ),
    });
    if (!client) return { error: "invalid-client" as const };
    const [policy] = await tx
      .insert(policiesTable)
      .values({
        ...parsed.data,
        premium: String(parsed.data.premium),
        commission: String(parsed.data.commission),
        id: randomUUID(),
        tenantId,
        number: `BH-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        status: "active",
      })
      .returning();
    if (!policy) {
      throw new Error("Falha ao criar apólice");
    }
    return { policy, clientName: client.name };
  });
  if ("error" in created) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Cliente inválido"));
  }
  return res.status(201).json({
    ...created.policy,
    clientName: created.clientName,
    premium: Number(created.policy.premium),
    commission: Number(created.policy.commission),
  });
});

router.get("/claims", async (req, res) => {
  const parsed = ListClaimsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Filtro inválido"));
  }
  const rows = await withRequestContext(ctx(res), async (tx) =>
    tx
      .select({
        claim: claimsTable,
        clientName: clientsTable.name,
        policyNumber: policiesTable.number,
        insurer: policiesTable.insurer,
      })
      .from(claimsTable)
      .innerJoin(policiesTable, eq(claimsTable.policyId, policiesTable.id))
      .innerJoin(clientsTable, eq(policiesTable.clientId, clientsTable.id))
      .where(eq(claimsTable.tenantId, ctx(res).tenantId))
      .orderBy(desc(claimsTable.createdAt)),
  );
  const search = parsed.data.search?.toLocaleLowerCase("pt") ?? "";
  return res.json(
    rows
      .filter(
        ({ claim, clientName, policyNumber }) =>
          (!parsed.data.status || claim.status === parsed.data.status) &&
          `${claim.reference} ${clientName} ${policyNumber}`
            .toLocaleLowerCase("pt")
            .includes(search),
      )
      .slice(0, parsed.data.limit)
      .map(({ claim, ...row }) => ({
        ...claim,
        ...row,
        amount: Number(claim.amount),
        createdAt: claim.createdAt.toISOString(),
        daysOpen: Math.max(
          0,
          Math.floor((Date.now() - claim.createdAt.getTime()) / 86_400_000),
        ),
      })),
  );
});

router.post("/claims", async (req, res) => {
  const parsed = CreateClaimBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Dados inválidos"));
  }
  const tenantId = ctx(res).tenantId;
  const created = await withRequestContext(ctx(res), async (tx) => {
    const policy = await tx.query.policiesTable.findFirst({
      where: and(
        eq(policiesTable.id, parsed.data.policyId),
        eq(policiesTable.tenantId, tenantId),
      ),
    });
    if (!policy) return { error: "invalid-policy" as const };
    const client = await tx.query.clientsTable.findFirst({
      where: eq(clientsTable.id, policy.clientId),
    });
    const [claim] = await tx
      .insert(claimsTable)
      .values({
        ...parsed.data,
        amount: String(parsed.data.amount),
        id: randomUUID(),
        tenantId,
        reference: `SIN-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
        status: "open",
      })
      .returning();
    if (!claim) {
      throw new Error("Falha ao criar sinistro");
    }
    return { claim, policy, clientName: client?.name ?? "" };
  });
  if ("error" in created) {
    return res
      .status(400)
      .json(errorBody("VALIDATION_ERROR", "Apólice inválida"));
  }
  return res.status(201).json({
    ...created.claim,
    clientName: created.clientName,
    policyNumber: created.policy.number,
    insurer: created.policy.insurer,
    amount: Number(created.claim.amount),
    createdAt: created.claim.createdAt.toISOString(),
    daysOpen: 0,
  });
});

export default router;
