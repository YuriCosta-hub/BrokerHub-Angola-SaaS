# Checklist P0 — Segurança antes de dados reais

Executar por ordem. Nenhum item é opcional em `NODE_ENV=production`.

## 1. ADR e ambiente

- [ ] ADR 0001 lida e aceite pelo dono do produto
- [ ] `CORS_ORIGINS` = origens exactas do CRM (vírgula, com esquema), sem `*`
- [ ] `MFA_ENFORCE=true` em produção (o código recusa `false` se `NODE_ENV=production`)
- [ ] `DATABASE_URL` aponta para Postgres com `timezone` `Africa/Luanda`
- [ ] Clerk Dashboard: MFA (TOTP/SMS) activado para a instância

## 2. Auto-seed desligado

- [ ] Primeiro login **não** cria clientes/apólices/sinistros de demonstração
- [ ] Corretora nova só existe após `POST /api/tenants` com nome + NIF reais
- [ ] `GET /api/me` devolve `tenant: null` até ao onboarding

## 3. CORS

- [ ] Pedidos com `Origin` fora da allowlist recebem 403
- [ ] Credenciais (cookies Clerk) só nas origens listadas
- [ ] Healthcheck sem Origin continua a funcionar

## 4. RLS

- [ ] `pnpm --filter @workspace/db run push` (schema + índices)
- [ ] `pnpm --filter @workspace/db run apply-rls`
- [ ] `FORCE ROW LEVEL SECURITY` activo nas tabelas de negócio
- [ ] Sessão de pedido define `app.clerk_user_id` e `app.tenant_id` com `set_config(..., true)` dentro de transacção
- [ ] Teste manual: com dois tenants, o tenant A não lê clientes do tenant B mesmo que se passe um UUID alheio

## 5. MFA

- [ ] Papéis `super_admin` e `broker_master` exigem segundo factor Clerk (`fva[1] >= 0`)
- [ ] `GET /api/me` indica `mfa.required` / `mfa.satisfied`
- [ ] Rotas de CRM devolvem `403` `MFA_REQUIRED` se o factor não estiver satisfeito
- [ ] Agente de campo (`agent`) e tomador (`client`) não são bloqueados por MFA neste P0

## 6. Verificação rápida

```text
1. Sign-up novo → /seguranca-mfa se MFA em falta
2. MFA ok, sem corretora → /onboarding
3. POST /api/tenants { name, nif } → dashboard vazio (zeros, sem Mário António)
4. Origin http://evil.example → 403
5. apply-rls corrido; SELECT sem set_config não devolve linhas de clientes
```

## P1 (não bloqueia este P0, começa a seguir)

- Consentimento explícito, mascaramento PII nos logs, direito ao esquecimento
- RBAC nas rotas (já há `role` em `GET /api/me`)
- Convites de membros; portal do tomador
