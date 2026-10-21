import type { Prisma } from "../../generated/prisma/client";

// Layanan netral: mencatat Event, dengan dedup opsional lewat
// externalErrorId (dua kanal error vendor untuk error yang sama -- lihat
// PUDU_INTEGRATION.md bagian 6). Dipindah dari
// src/modules/equipment-adapter/pudu/parsers.ts supaya bisa dipakai adapter
// vendor manapun.
export interface RecordEventInput {
  eventType: string;
  sourceType: string;
  sourceId: string;
  severity: string;
  message: string;
  errorCode?: string;
  externalErrorId?: string;
  externalLevel?: string;
  integrationLogId?: string | null;
  payload?: Prisma.InputJsonValue;
  taskId?: string | null;
  occurredAt: Date;
}

export async function recordEvent(tx: Prisma.TransactionClient, input: RecordEventInput) {
  if (input.externalErrorId) {
    const existing = await tx.event.findFirst({ where: { externalErrorId: input.externalErrorId } });
    if (existing) return existing;
  }
  return tx.event.create({ data: input });
}
