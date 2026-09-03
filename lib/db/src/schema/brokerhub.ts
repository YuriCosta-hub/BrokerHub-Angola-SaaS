import {
  date,
  index,
  integer,
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
    clientId: text("client_id"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenant: index("members_by_tenant").on(table.tenantId),
    byTenantRole: index("members_by_tenant_role").on(table.tenantId, table.role),
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
    anonymizedAt: timestamp("anonymized_at", { withTimezone: true }),
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

export const consentPurpose = pgEnum("consent_purpose", [
  "privacy_notice",
  "marketing",
]);
export const inviteStatus = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);
export const subscriptionPlan = pgEnum("subscription_plan", [
  "monthly",
  "semiannual",
  "annual",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "suspended",
]);
export const notificationChannel = pgEnum("notification_channel", [
  "sms",
  "whatsapp",
  "email",
]);
export const notificationStatus = pgEnum("notification_status", [
  "queued",
  "sent",
  "failed",
  "skipped",
]);

export const consentsTable = pgTable(
  "consents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").references(() => tenantsTable.id, {
      onDelete: "cascade",
    }),
    clerkUserId: text("clerk_user_id").notNull(),
    purpose: consentPurpose("purpose").notNull(),
    policyVersion: text("policy_version").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
  },
  (table) => ({
    byUserPurpose: index("consents_by_user_purpose").on(
      table.clerkUserId,
      table.purpose,
    ),
  }),
);

export const invitesTable = pgTable(
  "invites",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRole("role").notNull(),
    clientId: text("client_id").references(() => clientsTable.id, {
      onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull().unique(),
    status: inviteStatus("status").notNull().default("pending"),
    invitedBy: text("invited_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenant: index("invites_by_tenant").on(table.tenantId),
  }),
);

export const documentsTable = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clientsTable.id, {
      onDelete: "cascade",
    }),
    policyId: text("policy_id").references(() => policiesTable.id, {
      onDelete: "cascade",
    }),
    claimId: text("claim_id").references(() => claimsTable.id, {
      onDelete: "cascade",
    }),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byTenant: index("documents_by_tenant").on(table.tenantId),
  }),
);

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" })
      .unique(),
    plan: subscriptionPlan("plan").notNull().default("monthly"),
    status: subscriptionStatus("status").notNull().default("trialing"),
    seats: integer("seats").notNull().default(1),
    currency: text("currency").notNull().default("AOA"),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
    }).notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeCheckoutId: text("stripe_checkout_id"),
    multicaixaReference: text("multicaixa_reference"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    byStatus: index("subscriptions_by_status").on(table.status),
  }),
);

export const notificationJobsTable = pgTable(
  "notification_jobs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenantsTable.id, { onDelete: "cascade" }),
    policyId: text("policy_id")
      .notNull()
      .references(() => policiesTable.id, { onDelete: "cascade" }),
    channel: notificationChannel("channel").notNull(),
    offsetDays: integer("offset_days").notNull(),
    scheduledFor: date("scheduled_for", { mode: "string" }).notNull(),
    status: notificationStatus("status").notNull().default("queued"),
    lastError: text("last_error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueSend: uniqueIndex("notification_jobs_unique").on(
      table.policyId,
      table.channel,
      table.offsetDays,
      table.scheduledFor,
    ),
    byTenant: index("notification_jobs_by_tenant").on(table.tenantId),
  }),
);
