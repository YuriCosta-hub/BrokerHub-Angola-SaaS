# Checklist P1/P2 — APD, portal, workers, facturação, CI

Aplicar **depois** do [checklist P0](./p0-security-checklist.md).

## Schema e RLS

- [ ] `pnpm --filter @workspace/db run push`
- [ ] `pnpm --filter @workspace/db run apply-rls` (corre `0001` e `0002`)
- [ ] Tabelas `consents`, `invites`, `documents`, `subscriptions`, `notification_jobs` com FORCE RLS
- [ ] `app.rls_bypass` só no worker interno, nunca em headers HTTP

## Consentimento e esquecimento

- [ ] Primeiro acesso autenticado pede `/privacidade` (versão `PRIVACY_POLICY_VERSION`)
- [ ] CRM bloqueia com `403 CONSENT_REQUIRED` sem consentimento
- [ ] Master/admin: `POST /api/clients/:id/forget` anonimiza; `409 RETENTION_HOLD` se apólice ainda no prazo de `RETENTION_YEARS` ou sinistro aberto

## RBAC

- [ ] `client` só vê `/portal` e os seus dados
- [ ] `agent` CRM operacional, sem convites/equipa/forget/facturação mutável
- [ ] `broker_master` / `super_admin` convites + esquecimento + billing

## Portal e convites

- [ ] `POST /api/invites` devolve token uma vez; aceite em `/convite?token=`
- [ ] Email Clerk tem de coincidir com o convite
- [ ] Convite `client` exige `clientId`

## Workers 30/15/5

- [ ] `WORKERS_ENABLED=true` no processo API
- [ ] Sem gateways: jobs `skipped` (log sem PII extra)
- [ ] Com `SMS_GATEWAY_URL` / `WHATSAPP_WEBHOOK_URL`: POST JSON `{ channel, to, message, policyId, offsetDays }`

## Storage e facturação

- [ ] `STORAGE_DIR` no volume do cluster (não S3 fora de Angola)
- [ ] Trial `TRIAL_DAYS`; `403 SUBSCRIPTION_SUSPENDED` no CRM se expirado
- [ ] Multicaixa gera referência; Stripe só se `STRIPE_SECRET_KEY` (DPA no DPIA)

## CI/CD

- [ ] GitHub Actions `typecheck` em Ubuntu + `docker build`
- [ ] Imagem promovida para Clouds2Africa, não para Vercel
