import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const memberRole = pgEnum("member_role", [
  "super_admin",
  "broker_master",
  "agent",
  "client",
]);
export const clientType = pgEnum("client_type", ["individual", "company"]);
export const clientStatus = pgEnum("client_status", [
  "active",
  "pending",
  "inactive",
]);
export const policyType = pgEnum("policy_type", [
  "auto",
  "health",
  "accident",
  "property",
  "life",
]);
export const policyStatus = pgEnum("policy_status", [
  "active",
  "renewal",
  "expired",
  "cancelled",
]);
export const claimStatus = pgEnum("claim_status", [
  "open",
  "in_review",
  "approved",
  "rejected",
  "paid",
]);

export const tenantsTable = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nif: text("nif").notNull().unique(),
  timezone: text("timezone").notNull().default("Africa/Luanda"),
  currency: text("currency").notNull().default("AOA"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const membersTable = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    role: memberRole("role").notNull().default("broker_master"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenant: index("members_by_tenant").on(table.tenantId),
  }),
);

export const clientsTable = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nif: text("nif").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    type: clientType("type").notNull(),
    status: clientStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    byTenant: index("clients_by_tenant").on(table.tenantId),
    tenantNif: uniqueIndex("clients_tenant_nif_uidx").on(
      table.tenantId,
      table.nif,
    ),
  }),
);

export const policiesTable = pgTable(
  "policies",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clientsTable.id, { onDelete: "restrict" }),
    number: text("number").notNull().unique(),
    insurer: text("insurer").notNull(),
    type: policyType("type").notNull(),
    status: policyStatus("status").notNull().default("active"),
    premium: numeric("premium", { precision: 16, scale: 2 }).notNull(),
    commission: numeric("commission", { precision: 16, scale: 2 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenant: index("policies_by_tenant").on(table.tenantId),
    byTenantClient: index("policies_by_tenant_client").on(
      table.tenantId,
      table.clientId,
    ),
  }),
);

export const claimsTable = pgTable(
  "claims",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    policyId: text("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "restrict" }),
    reference: text("reference").notNull().unique(),
    type: text("type").notNull(),
    status: claimStatus("status").notNull().default("open"),
    amount: numeric("amount", { precision: 16, scale: 2 }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenant: index("claims_by_tenant").on(table.tenantId),
    byTenantPolicy: index("claims_by_tenant_policy").on(
      table.tenantId,
      table.policyId,
    ),
  }),
);

export const activitiesTable = pgTable(
  "activities",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id"),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    tone: text("tone").notNull().default("blue"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenantCreated: index("activities_by_tenant_created").on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);
