import type { Prisma } from "../../generated/prisma/client";

// Lokasi placeholder untuk Equipment robot yang auto-dibuat dari callback
// vendor manapun (lokasi fisik sebenarnya belum diketahui -- diisi admin
// nanti lewat master data). ID tetap supaya upsert idempoten lintas
// pemanggilan. Dipindah dari pudu/unknown-robot.ts karena tidak ada apa pun
// di sini yang khas PUDU.
const UNKNOWN_WAREHOUSE_ID = "00000000-0000-0000-0000-0000000000a1";
const UNKNOWN_ZONE_ID = "00000000-0000-0000-0000-0000000000a2";
const UNKNOWN_LOCATION_ID = "00000000-0000-0000-0000-0000000000a3";

export async function getOrCreateUnknownLocation(tx: Prisma.TransactionClient) {
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
