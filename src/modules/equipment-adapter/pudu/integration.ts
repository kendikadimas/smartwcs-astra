import type { PrismaClient } from "../../../generated/prisma/client";

export const PUDU_INTEGRATION_NAME = "PUDU";
export const PUDU_INTEGRATION_ID = "00000000-0000-0000-0000-000000000001";

// Satu baris Integration dipakai sebagai FK semua IntegrationLog PUDU.
// Asumsi: cuma satu integrasi PUDU aktif per deployment (bukan multi-akun
// PUDU). Dibuat lewat seedPuduIntegration() (prisma/seed.ts untuk dev,
// test integrasi untuk fixture).
export async function getPuduIntegration(prisma: PrismaClient) {
  return prisma.integration.findFirst({ where: { name: PUDU_INTEGRATION_NAME } });
}

export async function seedPuduIntegration(prisma: PrismaClient) {
  return prisma.integration.upsert({
    where: { integrationId: PUDU_INTEGRATION_ID },
    update: {},
    create: {
      integrationId: PUDU_INTEGRATION_ID,
      systemType: "RCS",
      name: PUDU_INTEGRATION_NAME,
      protocol: "REST",
      endpointUrl: process.env.PUDU_BASE_URL ?? "https://css-open-platform.pudutech.com/pudu-entry",
      credentials: { region: "overseas" },
      status: "DISCONNECTED",
    },
  });
}
