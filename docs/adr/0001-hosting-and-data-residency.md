# ADR 0001 — Hosting, residência de dados e identidade

- Status: Aceite
- Data: 2026-09-03
- Decisores: arquitectura BrokerHub Angola
- Contexto: auditoria vs PDF de arquitectura; APD (Agência de Proteção de Dados de Angola)

## Contexto

O PDF descreve duas estratégias incompatíveis:

1. Secção 5 — Clouds2Africa / Angola Cables (AngoAPI, SACS/WACS), Kubernetes, fuso `Africa/Luanda`, residência absoluta de dados.
2. Secção 6 — Vercel Enterprise, AWS EC2/ECS/Render, Cloudflare, ALB.

O código actual corre num workspace Replit com Clerk (SaaS de identidade) e PostgreSQL genérico. Não pode ser promovido a produção enquanto a residência e o IdP não estiverem decididos.

A Lei de Proteção de Dados de Angola e o discurso comercial de “soberania absoluta” exigem uma única linha de hosting para dados pessoais (NIF, contactos, apólices, sinistros, documentos de identidade).

## Decisão

**Produção (PII, apólices, sinistros, documentos, billing):** Clouds2Africa, datacenter AngoAPI / ecossistema Angola Cables.

| Componente | Produção | Não permitido em produção |
|---|---|---|
| Compute / API / workers | VMs Linux + Docker + Kubernetes em Clouds2Africa | Vercel, AWS, Render, Replit |
| PostgreSQL | Instância gerida ou self-hosted **em Luanda**, `timezone = Africa/Luanda` | Supabase / RDS fora de Angola “porque é mais fácil” |
| Object storage | Bucket cifrado na mesma região (S3-compatível local ou disco no cluster) | S3 eu-west / us-east para BI e apólices |
| Identidade (fase 1) | Clerk **apenas** com DPA escrito, região EU, e gap APD documentado no DPIA | Clerk US sem DPA |
| Identidade (fase 2, alvo APD) | IdP self-hosted no cluster (Keycloak ou equivalente) | — |
| Frontend CRM | Servido no mesmo ingress K8s (SPA ou Next.js mais tarde) | Vercel Edge a processar dados de clientes |
| CDN | Cloudflare só para marketing estático sem PII | CDN a cachear APIs autenticadas |
| Observabilidade | Self-hosted (Loki/Grafana) ou Sentry com DPA + PII scrubbing | Datadog sem DPA |

**Desenvolvimento:** Replit / máquina local / Postgres de dev podem continuar. Dados de dev são sintéticos. `NODE_ENV=production` exige `CORS_ORIGINS` e `MFA_ENFORCE=true`.

**O que o PDF secção 6 passa a ser:** referência de *capabilities* (CI/CD, testes, imagens Docker), não o mapa de clouds. GitHub Actions constrói a imagem e faz deploy para staging/produção na Clouds2Africa — não para Vercel/AWS.

## Consequências

- Não vender “conformidade absoluta APD” enquanto a fase 1 de identidade estiver no Clerk.
- Qualquer desvio (ex.: Clerk EU) entra no DPIA e no contrato com a corretora, não no marketing.
- P1 (consentimento, esquecimento) e P2 (workers, billing, Next.js) assumem esta topologia; não se desenham filas Redis na AWS “temporariamente”.
- Migração Replit → K8s é um projecto de infra, não um `vercel deploy`.

## Alternativas rejeitadas

- **Vercel + Supabase EU como produção:** time-to-market alto, mas contradiz a secção 5 e o argumento de soberania. Só aceitável como piloto interno sem dados reais de tomadores.
- **Híbrido eterno (UI na Vercel, DB em Luanda):** latência e superfície de PII no Edge; rejeitado para o CRM autenticado.
