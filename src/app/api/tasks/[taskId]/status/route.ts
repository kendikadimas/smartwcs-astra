import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { taskStatusPatchSchema } from "@/modules/task/task-schemas";

/**
 * PATCH /tasks/{taskId}/status (docs/openapi-smart-wcs.yaml). RBAC.md
 * Section 3: "Sistem internal (WCS Core), RCS, PLC lewat Integration
 * Config | Tidak dipanggil langsung oleh role manusia" -- belum ada
 * mekanisme auth Integration Config (token per koneksi RCS/PLC) di
 * Bagian 1 ini. Sementara digerbang ke role System Integrator (role
 * manusia yang paling dekat dengan "mengoperasikan integrasi"), BUKAN
 * keputusan final -- flag untuk didiskusikan ulang saat Integration
 * Config auth sungguhan dibangun. Lihat laporan akhir.
 *
 * Tidak ada validasi transisi (TASK_STATE_MACHINE.md bagian 5: "transisi
 * sah belum ditegakkan kode apa pun", dan task ini tidak menambah
 * penegakan baru) -- status apa pun di enum diterima begitu saja.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireRole(request, [ROLE.SYSTEM_INTEGRATOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { taskId } = await params;

  const parsed = await parseJsonBody(request, taskStatusPatchSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const outcome = await db.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { taskId } });
    if (!task) return { kind: "not_found" as const };

    if (task.status !== body.status) {
      await tx.taskStatusHistory.create({
        data: {
          taskId,
          fromStatus: task.status,
          toStatus: body.status,
          changedBy: auth.userId,
          changedAt: new Date(),
        },
      });
    }

    const updated = await tx.task.update({
      where: { taskId },
      data: {
        status: body.status,
        failureCode: body.failureCode ?? null,
        ...(body.assignedResourceId !== undefined ? { assignedResourceId: body.assignedResourceId } : {}),
        ...(body.resourceType !== undefined ? { resourceType: body.resourceType } : {}),
      },
    });
    return { kind: "ok" as const, task: updated };
  });

  switch (outcome.kind) {
    case "not_found":
      return apiError(404, "NOT_FOUND", "Task tidak ditemukan");
    case "ok":
      return NextResponse.json(outcome.task);
  }
}
