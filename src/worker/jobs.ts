import type { PgBoss } from "pg-boss";
import type { PrismaClient } from "../generated/prisma/client";
import { logger } from "../lib/logger";
import { getAdapterForIntegration } from "../modules/equipment-adapter/registry";
import { processPendingLogs } from "../modules/equipment-adapter/worker-core";
import { createUpcomingPoseLogPartitions, pruneOldPoseLogPartitions } from "./partitions";
import { pruneOldIntegrationLogs } from "./log-retention";

/**
 * Nama job pg-boss (Bagian 1 Fase E, ADR Section 9.2). Penjadwalan sendiri
 * (BUKAN pg-boss `schedule()`/cron) -- setiap handler menjadwalkan ulang
 * dirinya sendiri lewat `sendAfter` di `finally`, supaya intervalnya persis
 * mengikuti env (detik/ms bebas), bukan dibatasi granularitas cron
 * (menit). Ini pola pg-boss yang didokumentasikan untuk job berulang
 * dengan interval non-cron.
 */
export const JOB = {
  PROCESS_INTEGRATION_LOGS: "process-integration-logs",
  SYNC_RESOURCES: "sync-resources",
  CREATE_POSE_LOG_PARTITION: "create-pose-log-partition",
  PRUNE_LOGS: "prune-logs",
} as const;

export interface JobIntervalsMs {
  processIntegrationLogs: number;
  syncResources: number;
  partitionCheck: number;
  retentionCheck: number;
}

export interface JobOptions {
  maxAttempts: number;
  poseLogRetentionDays: number;
  integrationLogRetentionDays: number;
  intervalsMs: JobIntervalsMs;
}

/**
 * Daftarkan queue + handler semua job worker ke instance pg-boss yang
 * sudah `start()`-ed. Dipisah dari worker.ts (skrip proses) supaya bisa
 * dites langsung terhadap pg-boss + database test sungguhan, tanpa perlu
 * menjalankan worker.ts sebagai proses terpisah.
 *
 * `(1) IntegrationLog PENDING/FAILED` TETAP lewat `processPendingLogs()`
 * (FOR UPDATE SKIP LOCKED yang sudah ada, tidak diubah) -- pg-boss di sini
 * cuma menjadwalkan KAPAN itu dijalankan, bukan menggantikan mekanisme
 * klaim barisnya. Iterasi SEMUA `Integration` terdaftar (bukan
 * `ADAPTER_KEY = "pudu"` hardcoded) -- adapter per integrasi diresolve
 * lewat `getAdapterForIntegration` (registry.ts), integrasi yang vendornya
 * belum punya adapter terdaftar dilewati diam-diam.
 */
export async function registerJobs(boss: PgBoss, prisma: PrismaClient, options: JobOptions): Promise<void> {
  for (const name of Object.values(JOB)) {
    await boss.createQueue(name);
  }

  await boss.work(JOB.PROCESS_INTEGRATION_LOGS, async () => {
    try {
      const integrations = await prisma.integration.findMany();
      for (const integration of integrations) {
        const adapter = getAdapterForIntegration(integration);
        if (!adapter) continue;
        const result = await processPendingLogs(prisma, {
          integrationId: integration.integrationId,
          adapter,
          maxAttempts: options.maxAttempts,
        });
        if (result.processed > 0) {
          logger.info({ integration: integration.name, ...result }, "worker: selesai satu batch IntegrationLog");
        }
      }
    } finally {
      await boss.sendAfter(JOB.PROCESS_INTEGRATION_LOGS, {}, {}, Math.ceil(options.intervalsMs.processIntegrationLogs / 1000));
    }
  });

  await boss.work(JOB.SYNC_RESOURCES, async () => {
    try {
      const integrations = await prisma.integration.findMany();
      for (const integration of integrations) {
        const adapter = getAdapterForIntegration(integration);
        if (!adapter) continue;
        try {
          const syncResult = await adapter.syncResources();
          logger.info({ integration: integration.name, ...syncResult }, "worker: syncResources selesai");
        } catch (err) {
          logger.warn({ integration: integration.name, err }, "worker: syncResources gagal");
        }
      }
    } finally {
      await boss.sendAfter(JOB.SYNC_RESOURCES, {}, {}, Math.ceil(options.intervalsMs.syncResources / 1000));
    }
  });

  await boss.work(JOB.CREATE_POSE_LOG_PARTITION, async () => {
    try {
      const created = await createUpcomingPoseLogPartitions(prisma);
      logger.info({ created }, "worker: partisi PuduPoseLog dipastikan ada");
      const dropped = await pruneOldPoseLogPartitions(prisma, options.poseLogRetentionDays);
      if (dropped.length > 0) logger.info({ dropped }, "worker: partisi PuduPoseLog lama dihapus");
    } finally {
      await boss.sendAfter(JOB.CREATE_POSE_LOG_PARTITION, {}, {}, Math.ceil(options.intervalsMs.partitionCheck / 1000));
    }
  });

  await boss.work(JOB.PRUNE_LOGS, async () => {
    try {
      const count = await pruneOldIntegrationLogs(prisma, options.integrationLogRetentionDays);
      if (count > 0) logger.info({ count }, "worker: baris IntegrationLog lama dihapus");
    } finally {
      await boss.sendAfter(JOB.PRUNE_LOGS, {}, {}, Math.ceil(options.intervalsMs.retentionCheck / 1000));
    }
  });
}

/** Picu siklus pertama tiap job segera -- tanpa ini, job pertama baru jalan setelah interval penuh berlalu. */
export async function kickOffJobs(boss: PgBoss): Promise<void> {
  for (const name of Object.values(JOB)) {
    await boss.send(name);
  }
}
