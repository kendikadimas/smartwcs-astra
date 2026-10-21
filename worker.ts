import { env } from "./src/lib/env";
import { logger } from "./src/lib/logger";
import { db } from "./src/lib/db";
import { getPuduIntegration } from "./src/modules/equipment-adapter/pudu/integration";
import { processPendingLogs } from "./src/modules/equipment-adapter/pudu/worker-core";

// Proses terpisah dari server.ts (ADR Section 9.2): mengurai antrean
// callback PUDU (IntegrationLog PENDING/FAILED) secara berkala. Dari image
// Docker yang sama dengan server.ts, command berbeda di docker-compose.
let shuttingDown = false;

async function tick() {
  const integration = await getPuduIntegration(db);
  if (!integration) {
    logger.warn("worker: baris Integration PUDU belum ada, skip tick (jalankan prisma/seed.ts)");
    return;
  }

  const result = await processPendingLogs(db, {
    integrationId: integration.integrationId,
    maxAttempts: env.PUDU_WORKER_MAX_ATTEMPTS,
  });
  if (result.processed > 0) {
    logger.info(result, "worker: selesai satu batch");
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

logger.info("Smart WCS worker PUDU dimulai");
loop();
