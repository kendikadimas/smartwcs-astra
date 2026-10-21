import type { Prisma } from "../../../generated/prisma/client";
import { provisionGenericRobot } from "../provision-robot";

/**
 * Cari PuduRobot lewat `sn`; kalau belum ada, buat Robot+Equipment generik
 * (lewat provisionGenericRobot, netral vendor) lalu PuduRobot (tabel milik
 * PUDU). `name`/`mac` opsional, dari callback yang memicu (mis. nickname
 * di robotBinding).
 */
export async function resolveOrCreatePuduRobot(
  tx: Prisma.TransactionClient,
  sn: string,
  opts: { name?: string; mac?: string } = {},
) {
  const existing = await tx.puduRobot.findUnique({ where: { sn } });
  if (existing) return existing;

  const robot = await provisionGenericRobot(tx, {
    vendor: "Pudu",
    serialNumber: sn,
    model: "T600",
    protocol: "REST",
    name: opts.name,
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
