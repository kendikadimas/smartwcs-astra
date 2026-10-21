import type { PrismaClient } from "../../../generated/prisma/client";
import { parsers } from "./parsers";

interface ClaimedLog {
  logId: string;
  messageType: string;
  payload: unknown;
  attempts: number;
  occurredAt: Date;
}

const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 10 * 60_000;

export function computeBackoffMs(attempts: number): number {
  return Math.min(BASE_BACKOFF_MS * 2 ** Math.max(attempts - 1, 0), MAX_BACKOFF_MS);
}

export interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
}

/**
 * Ambil dan proses baris IntegrationLog PENDING (atau FAILED yang jatah
 * retry-nya belum habis) satu per satu, memakai `SELECT ... FOR UPDATE SKIP
 * LOCKED` di dalam transaksi supaya worker lain yang jalan bersamaan tidak
 * mengambil baris yang sama (ADR Section 9.2). Setiap baris diproses dalam
 * transaksinya sendiri (bukan satu transaksi untuk seluruh batch) supaya
 * lock-nya dilepas secepat baris itu selesai.
 */
export async function processPendingLogs(
  prisma: PrismaClient,
  options: { integrationId: string; maxAttempts: number; batchSize?: number },
): Promise<ProcessResult> {
  const batchSize = options.batchSize ?? 10;
  const result: ProcessResult = { processed: 0, succeeded: 0, failed: 0 };

  for (let i = 0; i < batchSize; i++) {
    const now = new Date();
    const outcome = await prisma.$transaction(async (tx) => {
      // Perbandingan nextAttemptAt pakai waktu dari aplikasi (bukan now()
      // Postgres) -- tidak bergantung pada jam server database tetap akurat.
      const rows = await tx.$queryRaw<ClaimedLog[]>`
        SELECT "logId", "messageType", "payload", "attempts", "occurredAt"
        FROM "IntegrationLog"
        WHERE "integrationId" = ${options.integrationId}::uuid
          AND direction = 'INBOUND'
          AND (
            status = 'PENDING'
            OR (status = 'FAILED' AND attempts < ${options.maxAttempts} AND "nextAttemptAt" <= ${now})
          )
        ORDER BY "occurredAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      const row = rows[0];
      if (!row) return null;

      const parser = parsers[row.messageType];
      try {
        if (!parser) {
          throw new Error(`Tidak ada parser untuk callback_type "${row.messageType}"`);
        }
        const payload = row.payload as { data?: unknown } | null;
        await parser({ tx, integrationLogId: row.logId, occurredAt: row.occurredAt, data: payload?.data });
        await tx.integrationLog.update({
          where: { logId: row.logId },
          data: { status: "SUCCESS", processedAt: new Date() },
        });
        return { ok: true as const };
      } catch (err) {
        const attempts = row.attempts + 1;
        await tx.integrationLog.update({
          where: { logId: row.logId },
          data: {
            status: "FAILED",
            attempts,
            errorMessage: err instanceof Error ? err.message : String(err),
            nextAttemptAt: new Date(Date.now() + computeBackoffMs(attempts)),
          },
        });
        return { ok: false as const };
      }
    });

    if (!outcome) break;
    result.processed += 1;
    if (outcome.ok) result.succeeded += 1;
    else result.failed += 1;
  }

  return result;
}
