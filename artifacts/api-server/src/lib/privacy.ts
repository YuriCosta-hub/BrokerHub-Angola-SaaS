export const PRIVACY_POLICY_VERSION =
  process.env.PRIVACY_POLICY_VERSION ?? "2026-09-03";

export const RETENTION_YEARS = Number(process.env.RETENTION_YEARS ?? "5");

export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? "14");

export const INVITE_TTL_MS = Number(
  process.env.INVITE_TTL_HOURS ?? "72",
) * 60 * 60 * 1000;

export const OPEN_CLAIM_STATUSES = ["open", "in_review"] as const;

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utc = Date.UTC(year, (month ?? 1) - 1, (day ?? 1) + days);
  return new Date(utc).toISOString().slice(0, 10);
}

export function addCalendarYears(isoDate: string, years: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${(year ?? 1970) + years}-${String(month ?? 1).padStart(2, "0")}-${String(day ?? 1).padStart(2, "0")}`;
}

export function luandaToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Luanda",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function trialEndsAt(from = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * 86_400_000);
}
