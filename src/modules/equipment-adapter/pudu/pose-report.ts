import type { PrismaClient } from "../../../generated/prisma/client";
import type { PuduClient } from "./client";
import { env } from "../../../lib/env";
import { logger } from "../../../lib/logger";

/**
 * PUDU_OFFICIAL_EXCERPT.md bagian D: pose report (callback notifyRobotPose)
 * cuma aktif kalau WCS memanggil NotifyRobotReportPosition dan dikirim
 * ULANG sebelum jatah `interval x times` (detik) habis -- kalau tidak,
 * PUDU berhenti mengirim. Dipanggil berkala dari worker.ts lewat
 * syncResources() (bukan loop terpisah/pg-boss, belum disetujui).
 *
 * Robot yang di-refresh: `PuduRobotState.online=true` DAN jatah
 * `interval x times` dari permintaan TERAKHIR (bukan env saat ini --
 * robot ini mungkin diminta dengan angka lama) sudah/akan habis dalam
 * `PUDU_POSE_REPORT_REFRESH_MS` ke depan (margin aman sebelum benar-benar
 * habis), atau belum pernah diminta sama sekali.
 */
export async function refreshPoseReporting(db: PrismaClient, client: PuduClient): Promise<{ refreshed: number }> {
  const states = await db.puduRobotState.findMany({
    where: { online: true },
    include: { puduRobot: true },
  });

  const now = Date.now();
  let refreshed = 0;

  for (const state of states) {
    const needsRefresh = !state.poseReportStartedAt
      ? true
      : (() => {
          const interval = state.poseReportInterval ?? env.PUDU_POSE_REPORT_INTERVAL_SECONDS;
          const times = state.poseReportTimes ?? env.PUDU_POSE_REPORT_TIMES;
          const budgetMs = interval * times * 1000;
          const expiresAt = state.poseReportStartedAt.getTime() + budgetMs;
          return now >= expiresAt - env.PUDU_POSE_REPORT_REFRESH_MS;
        })();
    if (!needsRefresh) continue;

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
      // Tidak ada retry-loop di sini -- satu kegagalan per robot per
      // siklus, lanjut ke robot berikutnya. Siklus berikutnya (worker.ts,
      // PUDU_SYNC_INTERVAL_MS) akan mencoba lagi karena poseReportStartedAt
      // tidak diperbarui.
      logger.warn(
        { sn: state.puduRobot.sn, errMessage: err instanceof Error ? err.message : String(err) },
        "gagal NotifyRobotReportPosition",
      );
    }
  }
  return { refreshed };
}
