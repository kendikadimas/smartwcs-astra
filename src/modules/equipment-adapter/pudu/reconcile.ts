import type { PrismaClient } from "../../../generated/prisma/client";
import type { PuduClient } from "./client";
import { applyPuduTaskStatus } from "./task-status";
import { applyTaskStatusChange } from "../../task/apply-status-change";
import { env } from "../../../lib/env";
import { logger } from "../../../lib/logger";

// Status CALL final (lihat status-map.ts CALL_STATUS_MAP) -- task dengan
// status ini tidak direkonsiliasi lagi.
const CALL_FINAL_STATUSES = new Set(["CALL_COMPLETE", "COMPLETE", "CALL_FAILED", "QUEUING_CANCEL", "TASK_CANCEL", "ROBOT_CANCEL"]);

/**
 * Rekonsiliasi task CALL yang belum dapat status final tapi sudah lama
 * sejak dibuat -- menutup celah kalau callback notifyCustomCall hilang
 * (jaringan, PUDU gagal kirim, dst.). Dua langkah:
 * 1. Lebih tua dari PUDU_TASK_RECONCILE_CHECK_AFTER_MS -> tanya status
 *    sebenarnya lewat GetCallList (katalog #4), terapkan lewat jalur yang
 *    SAMA dengan callback (applyPuduTaskStatus) supaya konsisten.
 * 2. Masih belum final DAN sudah lewat PUDU_TASK_RECONCILE_TIMEOUT_MS
 *    (PUDU_OFFICIAL_EXCERPT.md: PUDU sendiri menggagalkan otomatis 30
 *    menit) -> WCS menyerah, tandai FAILED/TASK_TIMEOUT sendiri (nilai
 *    yang sudah ada di TASK_STATE_MACHINE.md, bukan nilai baru).
 */
export async function reconcileStalledCallTasks(
  db: PrismaClient,
  client: PuduClient,
): Promise<{ checked: number; timedOut: number }> {
  const checkBefore = new Date(Date.now() - env.PUDU_TASK_RECONCILE_CHECK_AFTER_MS);
  const timeoutBefore = new Date(Date.now() - env.PUDU_TASK_RECONCILE_TIMEOUT_MS);

  const stalled = await db.puduTask.findMany({
    where: { taskKind: "CALL", createdAt: { lt: checkBefore }, status: { notIn: [...CALL_FINAL_STATUSES] } },
    include: { puduRobot: true },
  });

  let checked = 0;
  let timedOut = 0;

  for (const task of stalled) {
    checked += 1;
    let latestStatus = task.status;

    try {
      const res = await client.getCallList({ task_id: task.vendorTaskId });
      const match = res.data?.list.find((row) => row.task_id === task.vendorTaskId);
      if (match && match.status !== task.status) {
        await db.puduTask.update({ where: { puduTaskId: task.puduTaskId }, data: { status: match.status } });
        await applyPuduTaskStatus(db, {
          rawStatus: match.status,
          taskKind: "CALL",
          robotId: task.puduRobot.robotId,
          missionId: task.missionId,
          integrationLogId: null,
          occurredAt: new Date(),
        });
        latestStatus = match.status;
      }
    } catch (err) {
      logger.warn(
        { vendorTaskId: task.vendorTaskId, errMessage: err instanceof Error ? err.message : String(err) },
        "gagal rekonsiliasi GetCallList",
      );
    }

    if (!CALL_FINAL_STATUSES.has(latestStatus) && task.createdAt < timeoutBefore && task.missionId) {
      // PuduTask.status TIDAK diubah -- kolom itu "status mentah PUDU
      // terakhir" (lihat ERD.md), dan PUDU tidak pernah bilang apa-apa di
      // sini (itulah masalahnya). Task.status/Mission.status WCS yang
      // mencatat keputusan "menyerah menunggu" lewat applyTaskStatusChange.
      await applyTaskStatusChange(db, {
        missionId: task.missionId,
        missionStatus: "FAILED",
        taskStatus: "FAILED",
        failureCode: "TASK_TIMEOUT",
        occurredAt: new Date(),
      });
      timedOut += 1;
    }
  }

  return { checked, timedOut };
}
