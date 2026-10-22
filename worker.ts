import { env } from "./src/lib/env";
import { logger } from "./src/lib/logger";
import { db } from "./src/lib/db";
import "./src/modules/equipment-adapter/adapters";
import { getAdapter, findIntegrationForAdapterKey } from "./src/modules/equipment-adapter/registry";
import { processPendingLogs } from "./src/modules/equipment-adapter/worker-core";

// Proses terpisah dari server.ts (ADR Section 9.2): mengurai antrean
// callback vendor (IntegrationLog PENDING/FAILED) secara berkala. Netral
// vendor -- adapter mana yang dipanggil ditentukan lewat registri, bukan
// impor langsung ke folder vendor tertentu.
let shuttingDown = false;
// Fase E: syncResources() (sync shop/robot/peta + refresh pose-report +
// rekonsiliasi task CALL, lihat pudu/index.ts) jauh lebih berat daripada
// tick IntegrationLog (HTTP ke PUDU berkali-kali) -- dijalankan di siklus
// terpisah, digerbang waktu, bukan tiap tick ~2 detik.
let lastSyncAt = 0;

const ADAPTER_KEY = "pudu";

async function tick() {
  const adapter = getAdapter(ADAPTER_KEY);
  if (!adapter) {
    logger.warn({ adapterKey: ADAPTER_KEY }, "worker: adapter belum terdaftar, skip tick");
    return;
  }

  const integration = await findIntegrationForAdapterKey(db, adapter.key);
  if (!integration) {
    logger.warn({ adapterKey: ADAPTER_KEY }, "worker: baris Integration belum ada, skip tick (jalankan prisma/seed.ts)");
    return;
  }

  const result = await processPendingLogs(db, {
    integrationId: integration.integrationId,
    adapter,
    maxAttempts: env.PUDU_WORKER_MAX_ATTEMPTS,
  });
  if (result.processed > 0) {
    logger.info(result, "worker: selesai satu batch");
  }

  if (Date.now() - lastSyncAt >= env.PUDU_SYNC_INTERVAL_MS) {
    lastSyncAt = Date.now();
    try {
      const syncResult = await adapter.syncResources();
      logger.info(syncResult, "worker: syncResources selesai");
    } catch (err) {
      logger.warn({ err }, "worker: syncResources gagal");
    }
  }
}

async function loop() {
  while (!shuttingDown) {
    try {
      await tick();
    } catch (err) {
      logger.error({ err }, "worker: tick gagal");
    }
    await new Promise((resolve) => setTimeout(resolve, env.PUDU_WORKER_POLL_INTERVAL_MS));
  }
}

function shutdown(signal: string) {
  logger.info(`worker: menerima ${signal}, berhenti setelah tick berjalan selesai`);
  shuttingDown = true;
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

logger.info("Smart WCS worker dimulai");
loop();
