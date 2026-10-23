import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole, ROLE } from "@/lib/rbac";
import { writeAuditLog } from "@/modules/security/audit-log";

// Transisi diizinkan: ACTIVE -> ACKNOWLEDGED saja. RBAC.md Section 3:
// Warehouse Operator, Warehouse Supervisor, Maintenance/Engineer.
export async function POST(request: Request, { params }: { params: Promise<{ alarmId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WAREHOUSE_OPERATOR, ROLE.WAREHOUSE_SUPERVISOR, ROLE.MAINTENANCE_ENGINEER]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { alarmId } = await params;

  // Update atomik bersyarat (Bagian 1 Fase C) -- `updateMany` dengan status
  // asal di `where`, bukan findUnique+update terpisah, supaya dua request
  // bersamaan tidak keduanya lolos pengecekan status sebelum salah satu
  // menulis (race condition lama).
  const result = await db.alarm.updateMany({
    where: { alarmId, status: "ACTIVE" },
    data: { status: "ACKNOWLEDGED", acknowledgedBy: auth.userId, acknowledgedAt: new Date() },
  });

  if (result.count === 0) {
    const alarm = await db.alarm.findUnique({ where: { alarmId } });
    if (!alarm) return apiError(404, "NOT_FOUND", "Alarm tidak ditemukan");
    return apiError(
      409,
      "INVALID_TRANSITION",
      `Alarm berstatus ${alarm.status}, cuma alarm ACTIVE yang bisa diacknowledge`,
    );
  }

  const updated = await db.alarm.findUniqueOrThrow({ where: { alarmId } });
  await writeAuditLog(db, {
    userId: auth.userId,
    action: "ALARM_ACKNOWLEDGED",
    targetType: "ALARM",
    targetId: alarmId,
    afterValue: { status: updated.status },
  });
  return NextResponse.json(updated);
}
