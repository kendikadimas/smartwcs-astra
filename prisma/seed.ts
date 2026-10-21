// Seed dev: satu baris Integration untuk PUDU, dipakai endpoint callback dan
// worker buat tahu integrationId mana yang dipakai. Kredensial di `credentials`
// cuma placeholder -- isi asli nanti dari PUDU_* env saat akun PUDU ada.
// Jalankan: npx tsx prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedPuduIntegration } from "../src/modules/equipment-adapter/pudu/integration";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });
  const integration = await seedPuduIntegration(prisma);
  console.log("Seeded Integration PUDU:", integration.integrationId);
  await prisma.$disconnect();
}

if (require.main === module) {
  main();
}
