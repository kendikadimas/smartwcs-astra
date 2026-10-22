import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

// Transisi diizinkan: ACTIVE -> ACKNOWLEDGED saja (RBAC.md: Warehouse
// Operator/Supervisor/Maintenance Engineer -- belum ditegakkan di sini
// karena src/lib/auth.ts belum punya informasi role, lihat laporan akhir).
export async function POST(request: Request, { params }: { params: Promise<{ alarmId: string }> }) {
  const auth = await requireAuth(request);
  const { alarmId } = await params;

  const alarm = await db.alarm.findUnique({ where: { alarmId } });
  if (!alarm) {
    return apiError(404, "NOT_FOUND", "Alarm tidak ditemukan");
  }
  if (alarm.status !== "ACTIVE") {
    return apiError(
      409,
      "INVALID_TRANSITION",
      `Alarm berstatus ${alarm.status}, cuma alarm ACTIVE yang bisa diacknowledge`,
    );
  }

  const updated = await db.alarm.update({
    where: { alarmId },
    data: { status: "ACKNOWLEDGED", acknowledgedBy: auth.userId, acknowledgedAt: new Date() },
  });
  return NextResponse.json(updated);
}
