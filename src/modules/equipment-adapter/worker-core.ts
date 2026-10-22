import type { PrismaClient } from "../../generated/prisma/client";
import type { EquipmentAdapter } from "./contract";

interface ClaimedLog {
  logId: string;
  messageType: string;
  payload: unknown;
  attempts: number;
  occurredAt: Date;
}

const BASE_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 10 * 60_000;

/**
 * Dilempar adapter dari `handleInbound({kind: "queued"})` untuk pesan yang
 * MEMANG sengaja tidak punya parser (bukan bug) -- mis. traffic control
 * area, atau callback_type lain yang belum didukung. BEDA dari `Error`
 * biasa: worker TIDAK menandai baris ini FAILED-dengan-retry (yang akan
 * gagal selamanya tanpa pernah SUCCESS kalau memang tidak akan pernah ada
 * parser), melainkan IGNORED sekali, tanpa retry (Fase F).
 */
export class IgnoredMessageTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IgnoredMessageTypeError";
  }
}

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
 *
 * Netral vendor: dispatch ke `adapter.handleInbound()` (bukan mengimpor
 * parser vendor tertentu) -- satu fungsi ini jalan untuk adapter manapun
 * yang diberi lewat `options.adapter`.
 */
export async function processPendingLogs(
  prisma: PrismaClient,
  options: { integrationId: string; adapter: EquipmentAdapter; maxAttempts: number; batchSize?: number },
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

      try {
        const payload = row.payload as { data?: unknown } | null;
        await options.adapter.handleInbound(tx, {
          kind: "queued",
          messageType: row.messageType,
          data: payload?.data,
          integrationLogId: row.logId,
          occurredAt: row.occurredAt,
        });
        await tx.integrationLog.update({
          where: { logId: row.logId },
          data: { status: "SUCCESS", processedAt: new Date() },
        });
        return { ok: true as const };
      } catch (err) {
        if (err instanceof IgnoredMessageTypeError) {
          await tx.integrationLog.update({
            where: { logId: row.logId },
            data: { status: "IGNORED", errorMessage: err.message, processedAt: new Date() },
          });
          return { ok: true as const }; // bukan kegagalan -- jangan dihitung "failed"
        }
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
