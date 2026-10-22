import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

// Transisi diizinkan: ACKNOWLEDGED -> CLEARED saja. ACTIVE -> CLEARED
// langsung ditolak (RBAC.md: harus acknowledge dulu; clear cuma Warehouse
// Supervisor/Maintenance Engineer -- belum ditegakkan, lihat laporan akhir).
export async function POST(request: Request, { params }: { params: Promise<{ alarmId: string }> }) {
  const auth = await requireAuth(request);
  const { alarmId } = await params;

  const alarm = await db.alarm.findUnique({ where: { alarmId } });
  if (!alarm) {
    return apiError(404, "NOT_FOUND", "Alarm tidak ditemukan");
  }
  if (alarm.status !== "ACKNOWLEDGED") {
    return apiError(
      409,
      "INVALID_TRANSITION",
      `Alarm berstatus ${alarm.status}, harus diacknowledge dulu sebelum clear`,
    );
  }

  const updated = await db.alarm.update({
    where: { alarmId },
    data: { status: "CLEARED", clearedBy: auth.userId, clearedAt: new Date() },
  });
  return NextResponse.json(updated);
}
