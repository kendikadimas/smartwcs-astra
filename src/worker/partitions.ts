import type { PrismaClient } from "../generated/prisma/client";

function monthRange(date: Date): { key: string; from: Date; to: Date } {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const key = `${year}_${String(month + 1).padStart(2, "0")}`;
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 1));
  return { key, from, to };
}

/**
 * Bikin partisi PuduPoseLog untuk bulan ini DAN bulan depan kalau belum ada
 * (idempotent -- IF NOT EXISTS). Wajib ada sebelum bulan berjalan habis,
 * supaya INSERT tidak ditolak Postgres ("no partition of relation found
 * for row") -- lihat prisma/sql/pudu_pose_log_partition.sql. Dibuat dua
 * bulan ke depan (bukan cuma bulan depan) supaya tetap aman kalau job ini
 * sempat berhenti satu siklus (Bagian 1 Fase E).
 */
export async function createUpcomingPoseLogPartitions(prisma: PrismaClient): Promise<string[]> {
  const now = new Date();
  const created: string[] = [];
  for (const offset of [0, 1]) {
    const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
    const { key, from, to } = monthRange(target);
    const tableName = `PuduPoseLog_${key}`;
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "${tableName}" PARTITION OF "PuduPoseLog" FOR VALUES FROM ('${from.toISOString()}') TO ('${to.toISOString()}')`,
    );
    created.push(tableName);
  }
  return created;
}

/**
 * Hapus (DROP TABLE, bukan DELETE baris per baris -- jauh lebih cepat)
 * partisi PuduPoseLog yang seluruh isinya lebih tua dari retentionDays.
 */
export async function pruneOldPoseLogPartitions(prisma: PrismaClient, retentionDays: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60_000);
  const rows = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename ~ '^PuduPoseLog_[0-9]{4}_[0-9]{2}$'`,
  );

  const dropped: string[] = [];
  for (const { tablename } of rows) {
    const match = tablename.match(/^PuduPoseLog_(\d{4})_(\d{2})$/);
    if (!match) continue;
    const partitionEnd = new Date(Date.UTC(Number(match[1]), Number(match[2]), 1));
    if (partitionEnd <= cutoff) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tablename}"`);
      dropped.push(tablename);
    }
  }
  return dropped;
}
