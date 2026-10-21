import type { Prisma } from "../../generated/prisma/client";

// Layanan netral: menerapkan perubahan status Mission/Task yang SUDAH
// diterjemahkan ke vocabulary WCS oleh adapter (bukan status mentah
// vendor). Dipindah dari src/modules/equipment-adapter/pudu/task-status.ts
// supaya bisa dipakai adapter vendor manapun, bukan cuma PUDU.
export interface TaskStatusChange {
  missionId: string;
  missionStatus: string;
  taskStatus: string;
  failureCode?: string;
  integrationLogId?: string | null;
  occurredAt: Date;
}

/**
 * Menulis TaskStatusHistory hanya kalau Task.status benar-benar berubah
 * (bukan setiap callback -- lihat ERD.md "Siapa menulis apa"). missionId
 * yang tidak ditemukan diabaikan dengan tenang (mis. task dibuat langsung
 * di vendor, tidak punya Mission/Task WCS).
 */
export async function applyTaskStatusChange(tx: Prisma.TransactionClient, change: TaskStatusChange): Promise<void> {
  const mission = await tx.mission.findUnique({
    where: { missionId: change.missionId },
    include: { task: true },
  });
  if (!mission) return;

  if (mission.status !== change.missionStatus) {
    await tx.mission.update({
      where: { missionId: mission.missionId },
      data: { status: change.missionStatus },
    });
  }

  if (mission.task.status !== change.taskStatus) {
    await tx.taskStatusHistory.create({
      data: {
        taskId: mission.task.taskId,
        fromStatus: mission.task.status,
        toStatus: change.taskStatus,
        integrationLogId: change.integrationLogId ?? null,
        changedAt: change.occurredAt,
      },
    });
    await tx.task.update({
      where: { taskId: mission.task.taskId },
      data: { status: change.taskStatus, failureCode: change.failureCode ?? null },
    });
  }
}
