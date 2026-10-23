import "dotenv/config";
import { PgBoss } from "pg-boss";
import { env } from "./src/lib/env";
import { logger } from "./src/lib/logger";
import { db } from "./src/lib/db";
import "./src/modules/equipment-adapter/adapters";
import { registerJobs, kickOffJobs } from "./src/worker/jobs";

// Proses terpisah dari server.ts (ADR Section 9.2): job latar belakang
// (antrean callback vendor, syncResources per integrasi, partisi bulanan
// PuduPoseLog, retensi log) dijadwalkan lewat pg-boss (job queue di atas
// PostgreSQL yang sudah ada -- tidak ada komponen infra baru). Logika
// setiap job ada di src/worker/jobs.ts supaya bisa dites langsung,
// skrip ini cuma menyalakan pg-boss dan menanganinya.
async function main() {
  const boss = new PgBoss(env.DATABASE_URL);
  boss.on("error", (err) => logger.error({ err }, "worker: pg-boss error"));
  await boss.start();

  await registerJobs(boss, db, {
    maxAttempts: env.PUDU_WORKER_MAX_ATTEMPTS,
    poseLogRetentionDays: env.POSE_LOG_RETENTION_DAYS,
    integrationLogRetentionDays: env.INTEGRATION_LOG_RETENTION_DAYS,
    intervalsMs: {
      processIntegrationLogs: env.PUDU_WORKER_POLL_INTERVAL_MS,
      syncResources: env.PUDU_SYNC_INTERVAL_MS,
      partitionCheck: env.WORKER_PARTITION_CHECK_INTERVAL_MS,
      retentionCheck: env.WORKER_RETENTION_CHECK_INTERVAL_MS,
    },
  });
  await kickOffJobs(boss);

  logger.info("Smart WCS worker dimulai (pg-boss)");

  const shutdown = (signal: string) => {
    logger.info(`worker: menerima ${signal}, berhenti setelah job berjalan selesai`);
    boss.stop({ graceful: true }).finally(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "worker: gagal start");
  process.exit(1);
});
