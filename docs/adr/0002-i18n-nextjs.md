# ADR 0002 — i18n PT/EN sem reescrita Next.js neste passo

- Status: Aceite
- Data: 2026-09-03
- Relacionado: ADR 0001 (frontend no mesmo ingress; Next.js mais tarde)

## Contexto

O PDF pede Next.js App Router com i18n. O CRM em produção neste repositório é Vite + React 19 + Wouter. Uma migração completa no P2 bloquearia consentimento, RBAC, portal, workers e facturação.

## Decisão

1. **Agora:** dicionários PT/EN em `artifacts/brokerhub-angola/src/i18n`, comutador na shell do CRM. Contrato documentado em `lib/i18n` para um futuro `app/[locale]`.
2. **Depois:** App Router no mesmo cluster Clouds2Africa, a importar os mesmos dicionários. Sem Vercel Edge a tratar PII.
3. Default `pt`. `en` é segunda língua, não um produto separado.

## Consequências

- URLs do CRM continuam sem prefixo `/en`. Persistência em `localStorage` (`bh-locale`).
- O portal do tomador e o ecrã de consentimento usam o mesmo provider.
- CI não instala `next` neste passo.
