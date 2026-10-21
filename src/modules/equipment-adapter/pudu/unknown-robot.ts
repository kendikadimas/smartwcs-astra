import type { Prisma } from "../../../generated/prisma/client";

// Lokasi placeholder untuk Equipment robot yang auto-dibuat dari callback
// PUDU (lokasi fisik sebenarnya belum diketahui -- diisi admin nanti lewat
// master data). ID tetap supaya upsert idempoten lintas pemanggilan.
const UNKNOWN_WAREHOUSE_ID = "00000000-0000-0000-0000-0000000000a1";
const UNKNOWN_ZONE_ID = "00000000-0000-0000-0000-0000000000a2";
const UNKNOWN_LOCATION_ID = "00000000-0000-0000-0000-0000000000a3";

async function getOrCreateUnknownLocation(tx: Prisma.TransactionClient) {
  await tx.warehouse.upsert({
    where: { warehouseId: UNKNOWN_WAREHOUSE_ID },
    update: {},
    create: { warehouseId: UNKNOWN_WAREHOUSE_ID, name: "UNKNOWN", address: "-" },
  });
  await tx.zone.upsert({
    where: { zoneId: UNKNOWN_ZONE_ID },
    update: {},
    create: {
      zoneId: UNKNOWN_ZONE_ID,
      warehouseId: UNKNOWN_WAREHOUSE_ID,
      name: "UNKNOWN",
      zoneType: "UNKNOWN",
    },
  });
  return tx.location.upsert({
    where: { locationId: UNKNOWN_LOCATION_ID },
    update: {},
    create: {
      locationId: UNKNOWN_LOCATION_ID,
      zoneId: UNKNOWN_ZONE_ID,
      code: "UNKNOWN",
      locationType: "UNKNOWN",
    },
  });
}

/**
 * Cari PuduRobot lewat `sn`; kalau belum ada, buat rantai Equipment + Robot
 * generik (lokasi placeholder "UNKNOWN", lihat getOrCreateUnknownLocation)
 * lalu PuduRobot (Fase 2 poin 4). `name`/`mac` opsional, dari callback yang
 * memicu (mis. nickname di robotBinding).
 */
export async function resolveOrCreatePuduRobot(
  tx: Prisma.TransactionClient,
  sn: string,
  opts: { name?: string; mac?: string } = {},
) {
  const existing = await tx.puduRobot.findUnique({ where: { sn } });
  if (existing) return existing;

  const location = await getOrCreateUnknownLocation(tx);
  const equipment = await tx.equipment.create({
    data: {
      locationId: location.locationId,
      name: opts.name ?? `PUDU ${sn}`,
      equipmentType: "ROBOT",
      vendor: "Pudu",
      status: "OFFLINE",
      capabilities: {},
    },
  });
  const robot = await tx.robot.create({
    data: {
      equipmentId: equipment.equipmentId,
      name: opts.name ?? `PUDU ${sn}`,
      serialNumber: sn,
      vendor: "Pudu",
      model: "T600",
      protocol: "REST",
    },
  });
  return tx.puduRobot.create({
    data: {
      robotId: robot.robotId,
      sn,
      mac: opts.mac,
      name: opts.name,
      model: "T600",
      bindingStatus: "UNBOUND",
    },
  });
}
