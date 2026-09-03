export type MemberRole = "super_admin" | "broker_master" | "agent" | "client";

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "suspended";

export type MeResponse = {
  userId: string;
  role: MemberRole | null;
  clientId: string | null;
  consentGranted: boolean;
  privacyPolicyVersion: string;
  subscriptionStatus: SubscriptionStatus | null;
  tenant: {
    id: string;
    name: string;
    nif: string;
    timezone: string;
    currency: string;
  } | null;
  mfa: {
    required: boolean;
    satisfied: boolean;
  };
};

export type ApiErrorPayload = {
  error: string;
  code?: string;
};

async function parseError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | null;
  return payload?.error ?? `HTTP ${response.status}`;
}

export async function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
  const response = await fetch("/api/me", {
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as MeResponse;
}

export async function createTenant(input: {
  name: string;
  nif: string;
}): Promise<void> {
  const response = await fetch("/api/tenants", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function grantConsent(input: {
  purpose: "privacy_notice" | "marketing";
}): Promise<void> {
  const response = await fetch("/api/consents", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, granted: true }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
