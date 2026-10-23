import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/rbac";
import { overviewQuerySchema } from "@/modules/monitoring/monitoring-schemas";

/**
 * GET /api/monitoring/overview?warehouseId=...
 *
 * Bentuk respons persis openapi-smart-wcs.yaml. Keputusan pemetaan (tidak
 * ada di spesifikasi, status Task/Equipment yang benar-benar dipakai kode
 * beda dari nama field di sini -- lihat TASK_STATE_MACHINE.md):
 * - `activeTasks` = Task berstatus DISPATCHED atau RUNNING (satu-satunya
 *   status "sedang berjalan" yang diproduksi kode).
 * - `queuedTasks` = Task berstatus CREATED (status QUEUED di enum
 *   TaskStatus OpenAPI tidak pernah diproduksi kode mana pun).
 * - `equipmentOnline`/`equipmentOffline` = Equipment.status "ONLINE" vs
 *   selain itu (OFFLINE/ERROR/MAINTENANCE digabung "offline" karena
 *   skema respons cuma punya 2 kolom biner).
 * - `activeAlarms` = Alarm status ACTIVE yang Event-nya terhubung ke
 *   equipment/robot di lokasi warehouse ini, atau ke Task yang
 *   sourceLocation-nya di warehouse ini (Event.sourceId polimorfik, tidak
 *   punya FK langsung ke warehouse -- ini best-effort, lihat laporan akhir).
 */
// RBAC.md Section 2 "Monitoring": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const parsed = overviewQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { warehouseId } = parsed.data;

  const zones = await db.zone.findMany({ where: { warehouseId }, select: { zoneId: true } });
  const zoneIds = zones.map((z) => z.zoneId);
  const locations = await db.location.findMany({ where: { zoneId: { in: zoneIds } }, select: { locationId: true } });
  const locationIds = locations.map((l) => l.locationId);

  const [activeTasks, queuedTasks, equipmentOnline, equipmentTotal, equipmentList, taskList] = await Promise.all([
    db.task.count({ where: { sourceLocationId: { in: locationIds }, status: { in: ["DISPATCHED", "RUNNING"] } } }),
    db.task.count({ where: { sourceLocationId: { in: locationIds }, status: "CREATED" } }),
    db.equipment.count({ where: { locationId: { in: locationIds }, status: "ONLINE" } }),
    db.equipment.count({ where: { locationId: { in: locationIds } } }),
    db.equipment.findMany({ where: { locationId: { in: locationIds } }, select: { equipmentId: true } }),
    db.task.findMany({ where: { sourceLocationId: { in: locationIds } }, select: { taskId: true } }),
  ]);

  const equipmentIds = equipmentList.map((e) => e.equipmentId);
  const robotList = await db.robot.findMany({ where: { equipmentId: { in: equipmentIds } }, select: { robotId: true } });
  const robotIds = robotList.map((r) => r.robotId);
  const taskIds = taskList.map((t) => t.taskId);

  const activeAlarms = await db.alarm.count({
    where: {
      status: "ACTIVE",
      event: {
        OR: [
          { sourceId: { in: [...equipmentIds, ...robotIds] } },
          ...(taskIds.length > 0 ? [{ taskId: { in: taskIds } }] : []),
        ],
      },
    },
  });

  return NextResponse.json({
    activeTasks,
    queuedTasks,
    equipmentOnline,
    equipmentOffline: equipmentTotal - equipmentOnline,
    activeAlarms,
  });
}
