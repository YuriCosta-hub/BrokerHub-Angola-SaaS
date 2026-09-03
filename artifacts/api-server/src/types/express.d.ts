export {};

declare global {
  namespace Express {
    interface Locals {
      clerkUserId: string;
      tenantId?: string;
      role?: "super_admin" | "broker_master" | "agent" | "client";
      clientId?: string | null;
    }
  }
}
