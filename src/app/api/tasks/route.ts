import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { taskCreateSchema, taskListQuerySchema } from "@/modules/task/task-schemas";

// RBAC.md Section 3: "POST /tasks | Warehouse Operator (source=MANUAL), WMS
// (source=WMS, lewat Integration)" -- hanya Operator yang disebut eksplisit
// untuk role manusia (Supervisor punya Write di Section 2, tapi baris
// eksplisit ini lebih spesifik dan tidak menyebutnya; diikuti sebagai
// keputusan, lihat laporan akhir). Jalur WMS (source=WMS) lewat Integration
// Config, bukan endpoint ini, belum ada jalurnya -- di luar scope Bagian 1.
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WAREHOUSE_OPERATOR]);
  if (!authResult.ok) return authResult.response;

  const result = await parseJsonBody(request, taskCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  // Idempotensi (source, externalRef): request yang diulang (mis. retry
  // dari WMS) mengembalikan task yang sudah ada, bukan membuat duplikat.
  const existing = await db.task.findUnique({
    where: { source_externalRef: { source: body.source, externalRef: body.externalRef } },
  });
  if (existing) {
    return NextResponse.json(existing, { status: 201 });
  }

  const task = await db.task.create({
    data: {
      taskType: body.taskType,
      source: body.source,
      externalRef: body.externalRef,
      sourceLocationId: body.sourceLocationId,
      destinationLocationId: body.destinationLocationId,
      materialId: body.materialId,
      containerId: body.containerId,
      quantity: body.quantity,
      priority: body.priority,
      status: "CREATED",
    },
  });
  return NextResponse.json(task, { status: 201 });
}

// RBAC.md Section 2 "Task Management": Write (Operator/Supervisor, termasuk
// baca) + Read (Administrator/Integrator). Maintenance/Engineer = None.
export async function GET(request: Request) {
  const authResult = await requireRole(request, [
    ROLE.WAREHOUSE_OPERATOR,
    ROLE.WAREHOUSE_SUPERVISOR,
    ROLE.WCS_ADMINISTRATOR,
    ROLE.SYSTEM_INTEGRATOR,
  ]);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const parsed = taskListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { status, zoneId, priority, page, pageSize } = parsed.data;

  const where = {
    ...(status ? { status } : {}),
    ...(priority !== undefined ? { priority } : {}),
    ...(zoneId
      ? { OR: [{ sourceLocation: { zoneId } }, { destinationLocation: { zoneId } }] }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.task.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
