import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PgBoss } from "pg-boss";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { JOB, registerJobs, kickOffJobs } from "./jobs";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function hasPgBoss() {
  return hasTestDatabase();
}

async function poll(check: () => Promise<boolean>, timeoutMs = 10_000, stepMs = 100): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  throw new Error("poll() timeout");
}

describe.skipIf(!hasPgBoss())("Bagian 1 Fase E -- worker pg-boss", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it(
    "registerJobs mendaftarkan 4 queue dan menjadwalkan ulang dirinya sendiri (self-rescheduling)",
    async () => {
      const boss = new PgBoss(process.env.TEST_DATABASE_URL!);
      await boss.start();
      try {
        // Interval sangat pendek supaya siklus kedua terjadi di dalam
        // batas waktu test, membuktikan handler benar-benar menjadwalkan
        // ulang dirinya sendiri lewat sendAfter (bukan cuma jalan sekali).
        await registerJobs(boss, testDb!, {
          maxAttempts: 5,
          poseLogRetentionDays: 90,
          integrationLogRetentionDays: 30,
          intervalsMs: { processIntegrationLogs: 1000, syncResources: 1000, partitionCheck: 1000, retentionCheck: 1000 },
        });

        const queues = await boss.getQueues();
        const names = queues.map((q) => q.name);
        for (const jobName of Object.values(JOB)) {
          expect(names).toContain(jobName);
        }

        await kickOffJobs(boss);

        // Siklus pertama selesai (queue kosong lagi untuk job ini) DAN ada
        // job berikutnya yang sudah terjadwal (sendAfter dari finally).
        await poll(async () => {
          const stats = await boss.getQueueStats(JOB.CREATE_POSE_LOG_PARTITION);
          const total = stats.reduce((sum, s) => sum + s.totalCount, 0);
          return total >= 1;
        });
      } finally {
        await boss.stop({ graceful: false, close: true });
      }
    },
    20_000,
  );

  it(
    "job pg-boss gagal di percobaan pertama -> di-retry otomatis (default retryLimit pg-boss) -> akhirnya completed",
    async () => {
      const boss = new PgBoss(process.env.TEST_DATABASE_URL!);
      await boss.start();
      const queueName = `test-retry-${Date.now()}`;
      try {
        await boss.createQueue(queueName);
        let attempts = 0;
        await boss.work(queueName, async () => {
          attempts += 1;
          if (attempts < 2) throw new Error("gagal sengaja, percobaan pertama");
        });

        const jobId = await boss.send(queueName, {});
        await poll(async () => {
          const job = await boss.getJobById(queueName, jobId!);
          return job?.state === "completed";
        });
        expect(attempts).toBe(2);
      } finally {
        await boss.deleteQueue(queueName);
        await boss.stop({ graceful: false, close: true });
      }
    },
    20_000,
  );

  it(
    "dua instance pg-boss (dua 'worker') bekerja di queue yang sama -> satu job cuma diproses sekali, tidak dobel",
    async () => {
      const bossA = new PgBoss(process.env.TEST_DATABASE_URL!);
      const bossB = new PgBoss(process.env.TEST_DATABASE_URL!);
      await bossA.start();
      await bossB.start();
      const queueName = `test-no-double-process-${Date.now()}`;
      try {
        await bossA.createQueue(queueName);
        // Dicatat sebagai job.id POLOS (bukan dibedakan A/B) -- kalau dua
        // worker sama-sama mengklaim job yang sama, id yang sama akan
        // muncul dua kali di array ini walau diproses instance berbeda.
        const processedJobIds: string[] = [];
        await bossA.work(queueName, async ([job]) => {
          processedJobIds.push(job.id);
        });
        await bossB.work(queueName, async ([job]) => {
          processedJobIds.push(job.id);
        });

        const jobIds: string[] = [];
        for (let i = 0; i < 5; i++) {
          const id = await bossA.send(queueName, { i });
          if (id) jobIds.push(id);
        }

        await poll(async () => processedJobIds.length >= jobIds.length, 15_000);
        // Tunggu sedikit lebih lama -- kalau ada double-processing, baris
        // ekstra akan muncul di jendela ini.
        await new Promise((r) => setTimeout(r, 1000));

        expect(processedJobIds).toHaveLength(jobIds.length);
        expect(new Set(processedJobIds).size).toBe(jobIds.length); // tidak ada job.id yang diproses dua kali
      } finally {
        await bossA.deleteQueue(queueName).catch(() => {});
        await bossA.stop({ graceful: false, close: true });
        await bossB.stop({ graceful: false, close: true });
      }
    },
    20_000,
  );
});
