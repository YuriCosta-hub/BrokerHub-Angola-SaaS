-- P1/P2 tables + RLS. Idempotent. Re-run via apply-rls.

ALTER TABLE members ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

DO $$ BEGIN
  CREATE TYPE consent_purpose AS ENUM ('privacy_notice', 'marketing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('monthly', 'semiannual', 'annual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('sms', 'whatsapp', 'email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'failed', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS consents (
  id text PRIMARY KEY,
  tenant_id text REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_user_id text NOT NULL,
  purpose consent_purpose NOT NULL,
  policy_version text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  ip_hash text
);
CREATE INDEX IF NOT EXISTS consents_by_user_purpose ON consents (clerk_user_id, purpose);

CREATE TABLE IF NOT EXISTS invites (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  role member_role NOT NULL,
  client_id text REFERENCES clients(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  status invite_status NOT NULL DEFAULT 'pending',
  invited_by text,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invites_by_tenant ON invites (tenant_id);

CREATE TABLE IF NOT EXISTS documents (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id text REFERENCES clients(id) ON DELETE CASCADE,
  policy_id text REFERENCES policies(id) ON DELETE CASCADE,
  claim_id text REFERENCES claims(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL,
  storage_key text NOT NULL,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS documents_by_tenant ON documents (tenant_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY,
  tenant_id text NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL DEFAULT 'monthly',
  status subscription_status NOT NULL DEFAULT 'trialing',
  seats integer NOT NULL DEFAULT 1,
  currency text NOT NULL DEFAULT 'AOA',
  current_period_end timestamptz NOT NULL,
  stripe_customer_id text,
  stripe_checkout_id text,
  multicaixa_reference text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  policy_id text NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  offset_days integer NOT NULL,
  scheduled_for date NOT NULL,
  status notification_status NOT NULL DEFAULT 'queued',
  last_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS notification_jobs_unique
  ON notification_jobs (policy_id, channel, offset_days, scheduled_for);
CREATE INDEX IF NOT EXISTS notification_jobs_by_tenant ON notification_jobs (tenant_id);

-- RLS bypass for internal workers (never set from HTTP).
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents FORCE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites FORCE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consents_all ON consents;
CREATE POLICY consents_all ON consents FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR clerk_user_id = current_setting('app.clerk_user_id', true)
    OR tenant_id = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR clerk_user_id = current_setting('app.clerk_user_id', true)
    OR tenant_id = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS invites_all ON invites;
CREATE POLICY invites_all ON invites FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS documents_all ON documents;
CREATE POLICY documents_all ON documents FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS subscriptions_all ON subscriptions;
CREATE POLICY subscriptions_all ON subscriptions FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  );

DROP POLICY IF EXISTS notification_jobs_all ON notification_jobs;
CREATE POLICY notification_jobs_all ON notification_jobs FOR ALL
  USING (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.rls_bypass', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  );
