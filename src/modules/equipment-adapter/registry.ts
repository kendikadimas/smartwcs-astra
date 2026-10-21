import type { Prisma } from "../../generated/prisma/client";
import type { EquipmentAdapter } from "./contract";

/**
 * Registri adapter. Pemilihan adapter TIDAK mengubah skema database:
 * - Robot -> `Robot.vendor` (tidak peka huruf besar-kecil), kolom yang
 *   sudah ada dan bukan rahasia.
 * - Integration -> `Integration.name`, kolom yang sudah ada, bukan rahasia
 *   (beda dari `credentials`, yang terenkripsi/write-only). Nama integrasi
 *   sudah dipakai sebagai kunci (lihat PUDU_INTEGRATION_NAME di pudu/).
 */
const adapters = new Map<string, EquipmentAdapter>();

export function registerAdapter(adapter: EquipmentAdapter): void {
  adapters.set(adapter.key.toLowerCase(), adapter);
}

export function getAdapter(key: string): EquipmentAdapter | undefined {
  return adapters.get(key.toLowerCase());
}

export function getAdapterForRobot(robot: { vendor: string }): EquipmentAdapter | undefined {
  return getAdapter(robot.vendor);
}

export function getAdapterForIntegration(integration: { name: string }): EquipmentAdapter | undefined {
  return getAdapter(integration.name);
}

/**
 * Cari baris Integration milik adapter tertentu lewat `name` (bukan
 * rahasia -- beda dari `credentials`). Dipakai route callback supaya tidak
 * perlu mengimpor helper khas vendor (mis. getPuduIntegration) langsung.
 */
export async function findIntegrationForAdapterKey(tx: Prisma.TransactionClient, key: string) {
  return tx.integration.findFirst({ where: { name: { equals: key, mode: "insensitive" } } });
}

/** Dipakai test untuk reset registri antar kasus uji (mis. adapter fake). */
export function clearRegistry(): void {
  adapters.clear();
}
