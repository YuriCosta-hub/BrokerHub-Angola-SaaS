-- BrokerHub P0: RLS por tenant. Idempotente. Aplicar com `pnpm --filter @workspace/db run apply-rls`.
-- Políticas usam set_config('app.tenant_id' | 'app.clerk_user_id' | 'app.allow_tenant_create', ..., true)
-- dentro de transacções da API (is_local = true). FORCE aplica-se também ao dono da tabela (o role da DATABASE_URL).

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE members FORCE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies FORCE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims FORCE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select ON tenants;
DROP POLICY IF EXISTS tenants_insert ON tenants;
DROP POLICY IF EXISTS tenants_update ON tenants;
DROP POLICY IF EXISTS tenants_delete ON tenants;
CREATE POLICY tenants_select ON tenants
  FOR SELECT
  USING (id = current_setting('app.tenant_id', true));
CREATE POLICY tenants_insert ON tenants
  FOR INSERT
  WITH CHECK (current_setting('app.allow_tenant_create', true) = 'on');
CREATE POLICY tenants_update ON tenants
  FOR UPDATE
  USING (id = current_setting('app.tenant_id', true))
  WITH CHECK (id = current_setting('app.tenant_id', true));
CREATE POLICY tenants_delete ON tenants
  FOR DELETE
  USING (id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS members_select ON members;
DROP POLICY IF EXISTS members_insert ON members;
DROP POLICY IF EXISTS members_update ON members;
DROP POLICY IF EXISTS members_delete ON members;
CREATE POLICY members_select ON members
  FOR SELECT
  USING (
    clerk_user_id = current_setting('app.clerk_user_id', true)
    OR tenant_id = current_setting('app.tenant_id', true)
  );
CREATE POLICY members_insert ON members
  FOR INSERT
  WITH CHECK (
    current_setting('app.allow_tenant_create', true) = 'on'
    OR tenant_id = current_setting('app.tenant_id', true)
  );
CREATE POLICY members_update ON members
  FOR UPDATE
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
CREATE POLICY members_delete ON members
  FOR DELETE
  USING (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS clients_all ON clients;
CREATE POLICY clients_all ON clients
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS policies_all ON policies;
CREATE POLICY policies_all ON policies
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS claims_all ON claims;
CREATE POLICY claims_all ON claims
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));

DROP POLICY IF EXISTS activities_all ON activities;
CREATE POLICY activities_all ON activities
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
