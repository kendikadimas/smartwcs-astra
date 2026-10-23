import type { PrismaClient } from "../generated/prisma/client";

/**
 * Hapus baris IntegrationLog yang sudah final (SUCCESS/IGNORED saja --
 * FAILED/PENDING TIDAK PERNAH dihapus otomatis, masih mungkin perlu
 * diinvestigasi/di-retry) dan lebih tua dari retentionDays. FK
 * integrationLogId di TaskStatusHistory/Event/PuduRobotStatusLog semuanya
 * `onDelete: SetNull` (lihat prisma/schema.prisma) -- aman dihapus massal.
 */
export async function pruneOldIntegrationLogs(prisma: PrismaClient, retentionDays: number): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60_000);
  const result = await prisma.integrationLog.deleteMany({
    where: { occurredAt: { lt: cutoff }, status: { in: ["SUCCESS", "IGNORED"] } },
  });
  return result.count;
}
