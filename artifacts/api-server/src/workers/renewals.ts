import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  clientsTable,
  notificationJobsTable,
  policiesTable,
  withRequestContext,
} from "@workspace/db";
import {
  addCalendarDays,
  luandaToday,
} from "../lib/privacy";

const OFFSETS = [30, 15, 5] as const;
const CHANNELS = ["sms", "whatsapp"] as const;

type GatewayChannel = (typeof CHANNELS)[number];

async function postGateway(
  channel: GatewayChannel,
  payload: {
    to: string;
    message: string;
    policyId: string;
    offsetDays: number;
  },
): Promise<"sent" | "skipped"> {
  const url =
    channel === "sms"
      ? process.env.SMS_GATEWAY_URL
      : process.env.WHATSAPP_WEBHOOK_URL;
  if (!url) {
    console.info(
      JSON.stringify({
        msg: "renewal_notification_skipped",
        channel,
        policyId: payload.policyId,
        offsetDays: payload.offsetDays,
      }),
    );
    return "skipped";
  }
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NOTIFICATION_WEBHOOK_TOKEN
        ? { Authorization: `Bearer ${process.env.NOTIFICATION_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      channel,
      to: payload.to,
      message: payload.message,
      policyId: payload.policyId,
      offsetDays: payload.offsetDays,
    }),
  });
  if (!response.ok) {
    throw new Error(`${channel} gateway ${response.status}`);
  }
  return "sent";
}

export async function runRenewalSweep(): Promise<{ queued: number; sent: number }> {
  const today = luandaToday();
  let queued = 0;
  let sent = 0;

  await withRequestContext(
    { clerkUserId: "system:renewals", rlsBypass: true },
    async (tx) => {
      for (const offset of OFFSETS) {
        const target = addCalendarDays(today, offset);
        const due = await tx
          .select({
            policy: policiesTable,
            phone: clientsTable.phone,
            clientName: clientsTable.name,
          })
          .from(policiesTable)
          .innerJoin(clientsTable, eq(policiesTable.clientId, clientsTable.id))
          .where(
            and(
              eq(policiesTable.endDate, target),
              eq(policiesTable.status, "active"),
            ),
          );

        for (const row of due) {
          for (const channel of CHANNELS) {
            const existing = await tx.query.notificationJobsTable.findFirst({
              where: and(
                eq(notificationJobsTable.policyId, row.policy.id),
                eq(notificationJobsTable.channel, channel),
                eq(notificationJobsTable.offsetDays, offset),
                eq(notificationJobsTable.scheduledFor, today),
              ),
            });
            if (existing) continue;

            const jobId = randomUUID();
            await tx.insert(notificationJobsTable).values({
              id: jobId,
              tenantId: row.policy.tenantId,
              policyId: row.policy.id,
              channel,
              offsetDays: offset,
              scheduledFor: today,
              status: "queued",
            });
            queued += 1;

            const message = `BrokerHub: a apólice ${row.policy.number} de ${row.clientName} renova em ${offset} dias (${row.policy.endDate}).`;
            try {
              const status = await postGateway(channel, {
                to: row.phone,
                message,
                policyId: row.policy.id,
                offsetDays: offset,
              });
              await tx
                .update(notificationJobsTable)
                .set({
                  status,
                  sentAt: status === "sent" ? new Date() : null,
                })
                .where(eq(notificationJobsTable.id, jobId));
              if (status === "sent") sent += 1;
            } catch (err) {
              await tx
                .update(notificationJobsTable)
                .set({
                  status: "failed",
                  lastError:
                    err instanceof Error ? err.message.slice(0, 300) : "gateway",
                })
                .where(eq(notificationJobsTable.id, jobId));
            }
          }
        }
      }
    },
  );

  return { queued, sent };
}

export function startRenewalWorker(): void {
  if (process.env.WORKERS_ENABLED === "false") return;
  const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? `${15 * 60 * 1000}`);
  const tick = (): void => {
    void runRenewalSweep()
      .then((stats) => {
        if (stats.queued > 0) {
          console.info(
            JSON.stringify({ msg: "renewal_sweep", ...stats }),
          );
        }
      })
      .catch((err: unknown) => {
        console.error("renewal_sweep_failed", err);
      });
  };
  tick();
  setInterval(tick, intervalMs);
}
