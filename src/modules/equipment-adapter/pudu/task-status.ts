import type { PrismaClient } from "../../../generated/prisma/client";
import { mapPuduStatus, type StatusMapResult } from "./status-map";

/**
 * Menerapkan status mentah PUDU ke Mission.status/Task.status, menulis
 * TaskStatusHistory hanya kalau status WCS benar-benar berubah (bukan
 * setiap callback -- lihat ERD.md "Siapa menulis apa"). Status tak dikenal
 * tidak melempar error: dicatat sebagai Event peringatan terhadap robot
 * intinya (selalu ada), status mentah tetap tersimpan di PuduTask.status
 * oleh pemanggil.
 */
export async function applyPuduTaskStatus(
  tx: PrismaClient,
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
    await tx.event.create({
      data: {
        eventType: "PUDU_UNKNOWN_STATUS",
        sourceType: "ROBOT",
        sourceId: params.robotId,
        severity: "WARNING",
        message: `Status PUDU tidak dikenal: ${params.rawStatus}`,
        integrationLogId: params.integrationLogId,
        occurredAt: params.occurredAt,
      },
    });
    return mapped;
  }

  // Task yang dibuat langsung di PUDU (bukan dari Mission WCS) tidak punya
  // Task/Mission inti untuk diperbarui -- status mentahnya tetap tersimpan
  // di PuduTask oleh pemanggil.
  if (!params.missionId) {
    return mapped;
  }

  const mission = await tx.mission.findUnique({
    where: { missionId: params.missionId },
    include: { task: true },
  });
  if (!mission) return mapped;

  if (mission.status !== mapped.missionStatus) {
    await tx.mission.update({
      where: { missionId: mission.missionId },
      data: { status: mapped.missionStatus },
    });
  }

  if (mission.task.status !== mapped.taskStatus) {
    await tx.taskStatusHistory.create({
      data: {
        taskId: mission.task.taskId,
        fromStatus: mission.task.status,
        toStatus: mapped.taskStatus,
        integrationLogId: params.integrationLogId,
        changedAt: params.occurredAt,
      },
    });
    await tx.task.update({
      where: { taskId: mission.task.taskId },
      data: { status: mapped.taskStatus, failureCode: mapped.failureCode ?? null },
    });
  }

  return mapped;
}
