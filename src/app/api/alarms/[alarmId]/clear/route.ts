import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole, ROLE } from "@/lib/rbac";
import { writeAuditLog } from "@/modules/security/audit-log";

// Transisi diizinkan: ACKNOWLEDGED -> CLEARED saja. ACTIVE -> CLEARED
// langsung ditolak. RBAC.md Section 3: clear cuma Warehouse Supervisor/
// Maintenance Engineer (operator cuma boleh acknowledge).
export async function POST(request: Request, { params }: { params: Promise<{ alarmId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WAREHOUSE_SUPERVISOR, ROLE.MAINTENANCE_ENGINEER]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { alarmId } = await params;

  // Update atomik bersyarat -- lihat acknowledge/route.ts untuk alasan yang sama.
  const result = await db.alarm.updateMany({
    where: { alarmId, status: "ACKNOWLEDGED" },
    data: { status: "CLEARED", clearedBy: auth.userId, clearedAt: new Date() },
  });

  if (result.count === 0) {
    const alarm = await db.alarm.findUnique({ where: { alarmId } });
    if (!alarm) return apiError(404, "NOT_FOUND", "Alarm tidak ditemukan");
    return apiError(
      409,
      "INVALID_TRANSITION",
      `Alarm berstatus ${alarm.status}, harus diacknowledge dulu sebelum clear`,
    );
  }

  const updated = await db.alarm.findUniqueOrThrow({ where: { alarmId } });
  await writeAuditLog(db, {
    userId: auth.userId,
    action: "ALARM_CLEARED",
    targetType: "ALARM",
    targetId: alarmId,
    afterValue: { status: updated.status },
  });
  return NextResponse.json(updated);
}
