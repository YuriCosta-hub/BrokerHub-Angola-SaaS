import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export function anonymizedNif(clientId: string): string {
  return createHash("sha256")
    .update(clientId)
    .digest("hex")
    .replace(/[a-f]/g, (ch) => String((ch.charCodeAt(0) % 10)))
    .slice(0, 10);
}
