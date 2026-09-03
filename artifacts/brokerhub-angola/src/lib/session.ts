export type MemberRole = "super_admin" | "broker_master" | "agent" | "client";

export type MeResponse = {
  userId: string;
  role: MemberRole | null;
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

export async function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
  const response = await fetch("/api/me", {
    credentials: "include",
    signal,
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | ApiErrorPayload
      | null;
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
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
    const payload = (await response.json().catch(() => null)) as
      | ApiErrorPayload
      | null;
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }
}
