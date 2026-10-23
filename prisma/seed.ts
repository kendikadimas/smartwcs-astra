// Seed dev: satu baris Integration untuk PUDU, dipakai endpoint callback dan
// worker buat tahu integrationId mana yang dipakai. Kredensial di `credentials`
// cuma placeholder -- isi asli nanti dari PUDU_* env saat akun PUDU ada.
// Bagian 1 Fase B: juga seed satu user WCS Administrator awal (ADMIN_USERNAME/
// ADMIN_PASSWORD dari env, lihat src/lib/env.ts -- TIDAK pernah hardcoded).
// Jalankan: npx tsx prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedPuduIntegration } from "../src/modules/equipment-adapter/pudu/integration";
import { createUserWithPassword } from "../src/modules/security/users";
import { env } from "../src/lib/env";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const integration = await seedPuduIntegration(prisma);
  console.log("Seeded Integration PUDU:", integration.integrationId);

  if (!env.ADMIN_PASSWORD) {
    console.log("ADMIN_PASSWORD tidak di-set -- lewati seed user admin.");
  } else {
    const existingAdmin = await prisma.user.findUnique({ where: { username: env.ADMIN_USERNAME } });
    if (existingAdmin) {
      console.log(`User admin "${env.ADMIN_USERNAME}" sudah ada, lewati.`);
    } else {
      const adminRole = await prisma.role.upsert({
        where: { name: "WCS_ADMINISTRATOR" },
        create: { name: "WCS_ADMINISTRATOR", permissions: {} },
        update: {},
      });
      const admin = await prisma.$transaction((tx) =>
        createUserWithPassword(tx, {
          username: env.ADMIN_USERNAME,
          fullName: "WCS Administrator",
          password: env.ADMIN_PASSWORD!,
          roleId: adminRole.roleId,
        }),
      );
      console.log(`Seeded user admin: ${admin.username}`);
    }
  }

  await prisma.$disconnect();
}

if (require.main === module) {
  main();
}
