import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Test integrasi (Fase 1/2) butuh PostgreSQL nyata di TEST_DATABASE_URL
// (database terpisah dari dev, lihat .env.example). Kalau belum diset,
// test pemanggil men-skip diri sendiri lewat `describe.skipIf`.
export function hasTestDatabase() {
  return Boolean(process.env.TEST_DATABASE_URL);
}

export function createTestDb() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL belum diset");
  }
  const adapter = new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Mengosongkan semua tabel (kecuali _prisma_migrations) di antara test,
// termasuk partisi PuduPoseLog_* yang tidak ikut TRUNCATE lewat nama
// induknya (PostgreSQL men-TRUNCATE partisi otomatis saat induknya ikut).
export async function truncateAll(prisma: PrismaClient) {
  const tables: { tablename: string }[] = await prisma.$queryRawUnsafe(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
      AND tablename NOT LIKE 'PuduPoseLog\\_2%'
  `);
  if (tables.length === 0) return;
  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
}
