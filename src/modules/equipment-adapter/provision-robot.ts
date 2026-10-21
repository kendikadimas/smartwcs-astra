import type { Prisma } from "../../generated/prisma/client";
import { getOrCreateUnknownLocation } from "./unknown-location";

export interface ProvisionRobotParams {
  vendor: string;
  serialNumber: string;
  model: string;
  protocol: string;
  name?: string;
}

/**
 * Auto-provisioning Equipment + Robot generik untuk serial number vendor
 * yang belum dikenal WCS (dipanggil adapter saat callback masuk dari robot
 * yang belum pernah tercatat). Netral vendor -- tiap adapter memanggil ini
 * dengan model/protocol/vendor miliknya sendiri, lalu menulis tabel
 * miliknya sendiri (mis. PuduRobot) secara terpisah.
 */
export async function provisionGenericRobot(tx: Prisma.TransactionClient, params: ProvisionRobotParams) {
  const location = await getOrCreateUnknownLocation(tx);
  const displayName = params.name ?? `${params.vendor} ${params.serialNumber}`;
  const equipment = await tx.equipment.create({
    data: {
      locationId: location.locationId,
      name: displayName,
      equipmentType: "ROBOT",
      vendor: params.vendor,
      status: "OFFLINE",
      capabilities: {},
    },
  });
  return tx.robot.create({
    data: {
      equipmentId: equipment.equipmentId,
      name: displayName,
      serialNumber: params.serialNumber,
      vendor: params.vendor,
      model: params.model,
      protocol: params.protocol,
    },
  });
}
