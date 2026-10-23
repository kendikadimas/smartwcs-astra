import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/rbac";
import { poseHistoryQuerySchema } from "@/modules/monitoring/monitoring-schemas";

/**
 * GET /api/robots/{robotId}/pose-history?from=...&to=...&limit=...
 *
 * Tidak ada di spesifikasi -- ditambah karena "riwayat posisi per robot
 * dengan batas waktu dan batas jumlah baris" diminta eksplisit. `from`/`to`
 * WAJIB (bukan opsional) karena PuduPoseLog dipartisi per bulan
 * (prisma/sql/pudu_pose_log_partition.sql) -- query tanpa rentang recordedAt
 * akan memindai semua partisi.
 */
// RBAC.md Section 2 "Equipment & Robot": Read untuk semua role login.
export async function GET(request: Request, { params }: { params: Promise<{ robotId: string }> }) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;
  const { robotId } = await params;

  const url = new URL(request.url);
  const parsed = poseHistoryQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { from, to, limit } = parsed.data;

  const robot = await db.robot.findUnique({ where: { robotId } });
  if (!robot) {
    return apiError(404, "NOT_FOUND", "Robot tidak ditemukan");
  }

  const puduRobot = await db.puduRobot.findUnique({ where: { robotId } });
  if (!puduRobot) {
    // Robot ada tapi bukan robot PUDU (atau belum ada profil vendornya) --
    // tidak ada riwayat posisi untuk dikembalikan.
    return NextResponse.json({ items: [] });
  }

  const rows = await db.puduPoseLog.findMany({
    where: { puduRobotId: puduRobot.puduRobotId, recordedAt: { gte: from, lte: to } },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
  // poseLogId BigInt tidak bisa diserialisasi JSON.stringify langsung.
  const items = rows.map((row) => ({ ...row, poseLogId: row.poseLogId.toString() }));

  return NextResponse.json({ items });
}
