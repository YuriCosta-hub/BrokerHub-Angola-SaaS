import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";
import { and, desc, eq } from "drizzle-orm";
import {
  activitiesTable,
  claimsTable,
  clientsTable,
  db,
  membersTable,
  policiesTable,
  tenantsTable,
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

const router = Router();

function unauthorized(res: Response) {
  return res.status(401).json({ error: "Autenticação necessária" });
}

async function resolveTenant(req: Request): Promise<string | null> {
  const userId = getAuth(req).userId;
  if (!userId) return null;

  const existing = await db.query.membersTable.findFirst({
    where: eq(membersTable.clerkUserId, userId),
  });
  if (existing) return existing.tenantId;

  const tenantId = randomUUID();
  const now = new Date();
  const day = 86_400_000;
  const isoDate = (offset: number) =>
    new Date(now.getTime() + offset * day).toISOString().slice(0, 10);

  await db.transaction(async (tx) => {
    await tx.insert(tenantsTable).values({
      id: tenantId,
      name: "Kwanza Seguros & Mediação",
      nif: `NIF-${userId.slice(-8)}-${tenantId.slice(0, 6)}`,
    });
    await tx.insert(membersTable).values({
      id: randomUUID(),
      tenantId,
      clerkUserId: userId,
      role: "broker_master",
    });

    const clientIds = [randomUUID(), randomUUID(), randomUUID()];
    await tx.insert(clientsTable).values([
      {
        id: clientIds[0],
        tenantId,
        name: "Mário António",
        nif: "006541278LA041",
        email: "mario.antonio@example.ao",
        phone: "+244 923 451 870",
        type: "individual",
        status: "active",
      },
      {
        id: clientIds[1],
        tenantId,
        name: "Atlântico Logística, Lda.",
        nif: "5410098872",
        email: "financeiro@atlantico-logistica.ao",
        phone: "+244 222 315 440",
        type: "company",
        status: "active",
      },
      {
        id: clientIds[2],
        tenantId,
        name: "Teresa Manuel",
        nif: "004218753LA037",
        email: "teresa.manuel@example.ao",
        phone: "+244 933 820 114",
        type: "individual",
        status: "pending",
      },
    ]);

    const policyIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    await tx.insert(policiesTable).values([
      {
        id: policyIds[0],
        tenantId,
        clientId: clientIds[0],
        number: `AUTO-${now.getFullYear()}-1042`,
        insurer: "ENSA Seguros",
        type: "auto",
        status: "active",
        premium: "485000",
        commission: "72750",
        startDate: isoDate(-130),
        endDate: isoDate(235),
      },
      {
        id: policyIds[1],
        tenantId,
        clientId: clientIds[1],
        number: `PAT-${now.getFullYear()}-0881`,
        insurer: "Nossa Seguros",
        type: "property",
        status: "renewal",
        premium: "2450000",
        commission: "367500",
        startDate: isoDate(-345),
        endDate: isoDate(20),
      },
      {
        id: policyIds[2],
        tenantId,
        clientId: clientIds[2],
        number: `SAU-${now.getFullYear()}-0344`,
        insurer: "Fidelidade Angola",
        type: "health",
        status: "active",
        premium: "720000",
        commission: "108000",
        startDate: isoDate(-72),
        endDate: isoDate(293),
      },
      {
        id: policyIds[3],
        tenantId,
        clientId: clientIds[1],
        number: `AUTO-${now.getFullYear()}-1208`,
        insurer: "Global Seguros",
        type: "auto",
        status: "renewal",
        premium: "1180000",
        commission: "177000",
        startDate: isoDate(-351),
        endDate: isoDate(14),
      },
    ]);

    await tx.insert(claimsTable).values([
      {
        id: randomUUID(),
        tenantId,
        policyId: policyIds[0],
        reference: `SIN-${now.getFullYear()}-0188`,
        type: "Colisão automóvel",
        status: "in_review",
        amount: "1380000",
        description: "Colisão frontal com danos materiais, sem feridos.",
        createdAt: new Date(now.getTime() - 6 * day),
      },
      {
        id: randomUUID(),
        tenantId,
        policyId: policyIds[1],
        reference: `SIN-${now.getFullYear()}-0162`,
        type: "Danos por água",
        status: "open",
        amount: "960000",
        description: "Infiltração no armazém principal.",
        createdAt: new Date(now.getTime() - 11 * day),
      },
    ]);

    await tx.insert(activitiesTable).values([
      {
        id: randomUUID(),
        tenantId,
        actorUserId: userId,
        type: "renewal",
        title: "Renovação a aproximar-se",
        description: "Apólice AUTO-1208 vence dentro de 14 dias.",
        tone: "orange",
      },
      {
        id: randomUUID(),
        tenantId,
        actorUserId: userId,
        type: "claim",
        title: "Sinistro em análise",
        description: "Documentação do SIN-0188 recebida pela seguradora.",
        tone: "purple",
      },
      {
        id: randomUUID(),
        tenantId,
        actorUserId: userId,
        type: "payment",
        title: "Comissão confirmada",
        description: "Comissão de 108.000 Kz registada na carteira.",
        tone: "green",
      },
    ]);
  });

  return tenantId;
}

router.use(async (req, res, next) => {
  const tenantId = await resolveTenant(req);
  if (!tenantId) {
    unauthorized(res);
    return;
  }
  res.locals.tenantId = tenantId;
  next();
});

router.get("/dashboard/summary", async (_req, res) => {
  const tenantId = res.locals.tenantId as string;
  const [clients, policies, claims] = await Promise.all([
    db.select().from(clientsTable).where(eq(clientsTable.tenantId, tenantId)),
    db.select().from(policiesTable).where(eq(policiesTable.tenantId, tenantId)),
    db.select().from(claimsTable).where(eq(claimsTable.tenantId, tenantId)),
  ]);
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

  res.json({
    activeClients: clients.filter((client) => client.status === "active").length,
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
    renewalRate: 87.4,
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
      percentage: Math.round((count / policies.length) * 100),
    })),
  });
});

router.get("/activities", async (req, res) => {
  const parsed = ListActivitiesQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Filtro inválido" });
  const activities = await db
    .select()
    .from(activitiesTable)
    .where(eq(activitiesTable.tenantId, res.locals.tenantId as string))
    .orderBy(desc(activitiesTable.createdAt))
    .limit(parsed.data.limit);
  return res.json(
    activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      timestamp: activity.createdAt.toISOString(),
      initials: "KM",
      tone: activity.tone,
    })),
  );
});

router.get("/clients", async (req, res) => {
  const parsed = ListClientsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Filtro inválido" });
  const tenantId = res.locals.tenantId as string;
  const [clients, policies] = await Promise.all([
    db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.tenantId, tenantId))
      .orderBy(desc(clientsTable.createdAt)),
    db.select().from(policiesTable).where(eq(policiesTable.tenantId, tenantId)),
  ]);
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
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });
  const id = randomUUID();
  const [client] = await db
    .insert(clientsTable)
    .values({
      ...parsed.data,
      id,
      tenantId: res.locals.tenantId as string,
      status: "active",
    })
    .returning();
  await db.insert(activitiesTable).values({
    id: randomUUID(),
    tenantId: res.locals.tenantId as string,
    actorUserId: getAuth(req).userId,
    type: "client",
    title: "Novo cliente registado",
    description: `${client.name} foi adicionado à carteira.`,
    tone: "blue",
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
    return res.status(400).json({ error: "Dados inválidos" });
  }
  const [client] = await db
    .update(clientsTable)
    .set(body.data)
    .where(
      and(
        eq(clientsTable.id, params.data.clientId),
        eq(clientsTable.tenantId, res.locals.tenantId as string),
      ),
    )
    .returning();
  if (!client) return res.status(404).json({ error: "Cliente não encontrado" });
  const policies = await db
    .select()
    .from(policiesTable)
    .where(
      and(
        eq(policiesTable.clientId, client.id),
        eq(policiesTable.tenantId, res.locals.tenantId as string),
      ),
    );
  return res.json({
    ...client,
    policiesCount: policies.length,
    totalPremium: policies.reduce(
      (sum, policy) => sum + Number(policy.premium),
      0,
    ),
    createdAt: client.createdAt.toISOString(),
  });
});

router.get("/policies", async (req, res) => {
  const parsed = ListPoliciesQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Filtro inválido" });
  const rows = await db
    .select({ policy: policiesTable, clientName: clientsTable.name })
    .from(policiesTable)
    .innerJoin(clientsTable, eq(policiesTable.clientId, clientsTable.id))
    .where(eq(policiesTable.tenantId, res.locals.tenantId as string))
    .orderBy(desc(policiesTable.createdAt));
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
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });
  const tenantId = res.locals.tenantId as string;
  const client = await db.query.clientsTable.findFirst({
    where: and(
      eq(clientsTable.id, parsed.data.clientId),
      eq(clientsTable.tenantId, tenantId),
    ),
  });
  if (!client) return res.status(400).json({ error: "Cliente inválido" });
  const [policy] = await db
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
  return res.status(201).json({
    ...policy,
    clientName: client.name,
    premium: Number(policy.premium),
    commission: Number(policy.commission),
  });
});

router.get("/claims", async (req, res) => {
  const parsed = ListClaimsQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Filtro inválido" });
  const rows = await db
    .select({
      claim: claimsTable,
      clientName: clientsTable.name,
      policyNumber: policiesTable.number,
      insurer: policiesTable.insurer,
    })
    .from(claimsTable)
    .innerJoin(policiesTable, eq(claimsTable.policyId, policiesTable.id))
    .innerJoin(clientsTable, eq(policiesTable.clientId, clientsTable.id))
    .where(eq(claimsTable.tenantId, res.locals.tenantId as string))
    .orderBy(desc(claimsTable.createdAt));
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
  if (!parsed.success) return res.status(400).json({ error: "Dados inválidos" });
  const tenantId = res.locals.tenantId as string;
  const policy = await db.query.policiesTable.findFirst({
    where: and(
      eq(policiesTable.id, parsed.data.policyId),
      eq(policiesTable.tenantId, tenantId),
    ),
  });
  if (!policy) return res.status(400).json({ error: "Apólice inválida" });
  const client = await db.query.clientsTable.findFirst({
    where: eq(clientsTable.id, policy.clientId),
  });
  const [claim] = await db
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
  return res.status(201).json({
    ...claim,
    clientName: client?.name ?? "",
    policyNumber: policy.number,
    insurer: policy.insurer,
    amount: Number(claim.amount),
    createdAt: claim.createdAt.toISOString(),
    daysOpen: 0,
  });
});

export default router;