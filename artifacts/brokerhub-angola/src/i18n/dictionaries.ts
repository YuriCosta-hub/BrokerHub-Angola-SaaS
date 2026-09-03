export type Locale = "pt" | "en";

export const dictionaries = {
  pt: {
    appName: "BrokerHub",
    nav: {
      dashboard: "Dashboard",
      clients: "Clientes",
      policies: "Apólices",
      claims: "Sinistros",
      renewals: "Renovações",
      reports: "Relatórios",
      team: "Equipa",
      settings: "Configurações",
      billing: "Facturação",
      documents: "Documentos",
      signOut: "Terminar sessão",
    },
    consent: {
      title: "Consentimento e privacidade",
      body: "O tratamento de dados pessoais (NIF, contactos, apólices e sinistros) segue a Lei de Proteção de Dados de Angola. Sem este consentimento não acedemos à carteira.",
      accept: "Aceito a política de privacidade",
      marketing: "Aceito comunicações comerciais (opcional)",
    },
    portal: {
      title: "Portal do tomador",
      policies: "As minhas apólices",
      claims: "Os meus sinistros",
      documents: "Documentos",
      empty: "Ainda não há dados associados a esta conta.",
    },
    team: {
      invite: "Convidar membro",
      email: "Email",
      role: "Papel",
    },
    billing: {
      title: "Facturação",
      trial: "Período de avaliação",
      suspended: "Subscrição suspensa",
      multicaixa: "Gerar referência Multicaixa",
      stripe: "Pagar com Stripe",
    },
  },
  en: {
    appName: "BrokerHub",
    nav: {
      dashboard: "Dashboard",
      clients: "Clients",
      policies: "Policies",
      claims: "Claims",
      renewals: "Renewals",
      reports: "Reports",
      team: "Team",
      settings: "Settings",
      billing: "Billing",
      documents: "Documents",
      signOut: "Sign out",
    },
    consent: {
      title: "Consent and privacy",
      body: "Personal data (tax ID, contacts, policies and claims) is processed under Angola’s data protection law. We cannot open the book of business without this consent.",
      accept: "I accept the privacy notice",
      marketing: "I accept commercial messages (optional)",
    },
    portal: {
      title: "Policyholder portal",
      policies: "My policies",
      claims: "My claims",
      documents: "Documents",
      empty: "No records are linked to this account yet.",
    },
    team: {
      invite: "Invite member",
      email: "Email",
      role: "Role",
    },
    billing: {
      title: "Billing",
      trial: "Trial period",
      suspended: "Subscription suspended",
      multicaixa: "Generate Multicaixa reference",
      stripe: "Pay with Stripe",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];
