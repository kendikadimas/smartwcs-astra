import type { Prisma } from "../../../generated/prisma/client";
import { mapPuduStatus, type StatusMapResult } from "./status-map";
import { applyTaskStatusChange } from "../../task/apply-status-change";
import { recordEvent } from "../../event/record-event";

/**
 * Menerjemahkan status mentah PUDU (mapPuduStatus, khas PUDU) lalu
 * mendelegasikan tulisan ke layanan netral applyTaskStatusChange/recordEvent
 * (src/modules/task, src/modules/event) -- supaya tulisan ke tabel
 * Mission/Task/TaskStatusHistory/Event tidak terikat ke PUDU.
 */
export async function applyPuduTaskStatus(
  tx: Prisma.TransactionClient,
  params: {
    rawStatus: string;
    robotId: string; // Robot.robotId (inti) -- target Event kalau status tak dikenal
    missionId: string | null;
    integrationLogId: string | null;
    occurredAt: Date;
  },
): Promise<StatusMapResult> {
  const mapped = mapPuduStatus(params.rawStatus);

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
