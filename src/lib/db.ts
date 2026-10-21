import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// ponytail: satu instance per proses. `tsx watch` me-reload modul saat file
// berubah, jadi global dipakai supaya hot-reload dev tidak membuka koneksi
// baru tiap reload (pola standar Prisma + Next.js dev).
declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalThis.__prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
