# i18n (contrato Next.js App Router)

Fonte actual: `artifacts/brokerhub-angola/src/i18n/dictionaries.ts`.

Quando o CRM migrar para App Router no cluster (ADR 0002):

```ts
// app/[locale]/layout.tsx
import { dictionaries, type Locale } from "../../artifacts/brokerhub-angola/src/i18n/dictionaries";

export const locales = ["pt", "en"] as const;
export const defaultLocale: Locale = "pt";

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
```

Middleware típico: cookie `NEXT_LOCALE` ou prefixo `/pt|/en`. Não colocar este frontend na Vercel (ADR 0001).
