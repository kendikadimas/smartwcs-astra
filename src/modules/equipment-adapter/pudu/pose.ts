import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";

// Lampiran PUDU_INTEGRATION.md #19 notifyRobotPose. Tolerant: field tak
// dikenal diabaikan (passthrough), field opsional tidak menggagalkan parse.
export const notifyRobotPoseSchema = z
  .object({
    sn: z.string().min(1),
    x: z.coerce.number(),
    y: z.coerce.number(),
    z: z.coerce.number().optional(),
    yaw: z.coerce.number().optional(),
    nearest_point: z.string().optional(),
    // notify_timestamp dari PUDU dalam milidetik (lihat komentar
    // PuduRobotStatusLog.recordedAt di schema.prisma).
    notify_timestamp: z.union([z.string(), z.number()]).optional(),
  })
  .passthrough();

export type NotifyRobotPoseData = z.infer<typeof notifyRobotPoseSchema>;

/**
 * Upsert langsung PuduRobotState + insert PuduPoseLog, tanpa lewat antrean
 * IntegrationLog (frekuensi terlalu tinggi -- lihat PUDU_INTEGRATION.md
 * bagian 4 poin 5). Robot yang `sn`-nya belum dikenal diabaikan (bukan
 * dibuat di sini): pose report baru aktif setelah robotBinding/robotActivate,
 * jadi robotnya seharusnya sudah ada; auto-provisioning di hot path callback
 * dianggap terlalu berat untuk kasus yang seharusnya tidak terjadi.
 */
export async function handleNotifyRobotPose(prisma: Prisma.TransactionClient, data: NotifyRobotPoseData) {
  const puduRobot = await prisma.puduRobot.findUnique({ where: { sn: data.sn } });
  if (!puduRobot) {
    return { stored: false as const };
  }

  const recordedAt = data.notify_timestamp
    ? new Date(Number(data.notify_timestamp))
    : new Date();

  // Sequential, bukan $transaction: fungsi ini bisa dipanggil dari dalam
  // transaksi worker yang sudah terbuka (nested transaction tidak didukung
  // baik). Atomicitas bukan kritis untuk pose report frekuensi tinggi --
  // paling buruk satu dari dua tulisan ini gagal sendiri-sendiri.
  await prisma.puduRobotState.upsert({
    where: { puduRobotId: puduRobot.puduRobotId },
    create: {
      puduRobotId: puduRobot.puduRobotId,
      x: data.x,
      y: data.y,
      yaw: data.yaw,
      nearestPoint: data.nearest_point,
      lastPoseAt: recordedAt,
    },
    update: {
      x: data.x,
      y: data.y,
      yaw: data.yaw,
      nearestPoint: data.nearest_point,
      lastPoseAt: recordedAt,
    },
  });
  await prisma.puduPoseLog.create({
    data: {
      puduRobotId: puduRobot.puduRobotId,
      x: data.x,
      y: data.y,
      z: data.z,
      yaw: data.yaw,
      nearestPoint: data.nearest_point,
      source: "CALLBACK",
      recordedAt,
    },
  });

  return { stored: true as const };
}
