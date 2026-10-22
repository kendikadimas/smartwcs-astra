import type { Prisma } from "../../../generated/prisma/client";
import { mapCallStatus, mapDeliveryStatus, type StatusMapResult } from "./status-map";
import { applyTaskStatusChange } from "../../task/apply-status-change";
import { recordEvent } from "../../event/record-event";

/**
 * Menerjemahkan status mentah PUDU (mapCallStatus/mapDeliveryStatus, khas
 * PUDU) lalu mendelegasikan tulisan ke layanan netral
 * applyTaskStatusChange/recordEvent (src/modules/task, src/modules/event)
 * -- supaya tulisan ke tabel Mission/Task/TaskStatusHistory/Event tidak
 * terikat ke PUDU. `taskKind` menentukan tabel pemetaan yang dipakai --
 * kosakata status CALL dan DELIVERY berbeda (lihat status-map.ts).
 * `taskKind: "OTHER"` (mis. SWITCH_MAP, taskKind lain yang belum punya
 * kosakata status resmi) selalu dianggap recognized=false -- sebelum
 * dipisah per-jenis, task bukan-CALL/DELIVERY ini keliru dicocokkan ke
 * tabel status gabungan CALL+DELIVERY, yang bisa salah tafsir kode yang
 * kebetulan namanya sama (mis. "CANCEL" dipakai CALL _dan_ DELIVERY, tapi
 * mungkin beda makna untuk SWITCH_MAP) -- bug ini tidak ada di 8 poin
 * eksplisit, ditemukan saat memecah tabel, lihat laporan akhir.
 */
export async function applyPuduTaskStatus(
  tx: Prisma.TransactionClient,
  params: {
    rawStatus: string;
    taskKind: "CALL" | "DELIVERY" | "OTHER";
    robotId: string; // Robot.robotId (inti) -- target Event kalau status tak dikenal
    missionId: string | null;
    integrationLogId: string | null;
    occurredAt: Date;
  },
): Promise<StatusMapResult> {
  const mapped =
    params.taskKind === "CALL"
      ? mapCallStatus(params.rawStatus)
      : params.taskKind === "DELIVERY"
        ? mapDeliveryStatus(params.rawStatus)
        : { missionStatus: "", taskStatus: "", recognized: false as const };

  if (!mapped.recognized) {
    await recordEvent(tx, {
      eventType: "PUDU_UNKNOWN_STATUS",
      sourceType: "ROBOT",
      sourceId: params.robotId,
      severity: "WARNING",
      message: `Status PUDU tidak dikenal: ${params.rawStatus}`,
      integrationLogId: params.integrationLogId,
      occurredAt: params.occurredAt,
    });
    return mapped;
  }

  if (!params.missionId) {
    return mapped;
  }

  await applyTaskStatusChange(tx, {
    missionId: params.missionId,
    missionStatus: mapped.missionStatus,
    taskStatus: mapped.taskStatus,
    failureCode: mapped.failureCode,
    integrationLogId: params.integrationLogId,
    occurredAt: params.occurredAt,
  });

  return mapped;
}
