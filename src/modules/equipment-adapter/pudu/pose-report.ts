import type { PrismaClient } from "../../../generated/prisma/client";
import type { PuduClient } from "./client";
import { env } from "../../../lib/env";
import { logger } from "../../../lib/logger";

/**
 * PUDU_INTEGRATION.md bagian 5 langkah 6: pose report (callback
 * notifyRobotPose) cuma aktif kalau WCS memanggil NotifyRobotReportPosition
 * dan dikirim ULANG sebelum interval x times habis -- kalau tidak, PUDU
 * berhenti mengirim. Dipanggil berkala dari worker.ts lewat syncResources()
 * (bukan loop terpisah/pg-boss, belum disetujui).
 *
 * Robot yang di-refresh: PuduRobotState.online=true (robot yang WCS tahu
 * online) DAN belum pernah diminta lapor posisi atau sudah lewat
 * PUDU_POSE_REPORT_REFRESH_MS sejak terakhir diminta.
 */
export async function refreshPoseReporting(db: PrismaClient, client: PuduClient): Promise<{ refreshed: number }> {
  const refreshBefore = new Date(Date.now() - env.PUDU_POSE_REPORT_REFRESH_MS);
  const states = await db.puduRobotState.findMany({
    where: {
      online: true,
      OR: [{ poseReportStartedAt: null }, { poseReportStartedAt: { lt: refreshBefore } }],
    },
    include: { puduRobot: true },
  });

  let refreshed = 0;
  for (const state of states) {
    try {
      await client.notifyRobotReportPosition({
        sn: state.puduRobot.sn,
        interval: env.PUDU_POSE_REPORT_INTERVAL_SECONDS,
        times: env.PUDU_POSE_REPORT_TIMES,
      });
      await db.puduRobotState.update({
        where: { puduRobotId: state.puduRobotId },
        data: {
          poseReportInterval: env.PUDU_POSE_REPORT_INTERVAL_SECONDS,
          poseReportTimes: env.PUDU_POSE_REPORT_TIMES,
          poseReportStartedAt: new Date(),
        },
      });
      refreshed += 1;
    } catch (err) {
      logger.warn(
        { sn: state.puduRobot.sn, errMessage: err instanceof Error ? err.message : String(err) },
        "gagal NotifyRobotReportPosition",
      );
    }
  }
  return { refreshed };
}
