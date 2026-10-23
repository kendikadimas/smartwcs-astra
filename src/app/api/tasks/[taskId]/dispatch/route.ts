import { NextResponse } from "next/server";
import "@/modules/equipment-adapter/adapters";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { getAdapterForRobot } from "@/modules/equipment-adapter/registry";
import { taskDispatchSchema } from "@/modules/task/task-schemas";
import { applyTaskStatusChange } from "@/modules/task/apply-status-change";
import { getDispatchRejectionFailureCode } from "@/modules/task/dispatch-rejection";
import { recordEvent } from "@/modules/event/record-event";

/**
 * POST /tasks/{taskId}/dispatch -- endpoint TAMBAHAN (Bagian 1 Fase D),
 * TIDAK ADA di openapi-smart-wcs.yaml v0.4.0-proposed: spec tidak punya
 * jalur pemicu dispatch sama sekali (cuma PATCH status/cancel/retry, yang
 * menurut RBAC.md Section 3 dipanggil sistem internal, bukan role manusia).
 * Akan disinkronkan ke OpenAPI di Bagian 2 -- kontraknya BISA berubah.
 *
 * Robot dipilih pemanggil lewat `robotId` di body -- alokasi otomatis
 * BUKAN bagian task ini (lihat laporan akhir).
 */
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WAREHOUSE_OPERATOR, ROLE.WAREHOUSE_SUPERVISOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { taskId } = await params;

  const parsed = await parseJsonBody(request, taskDispatchSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const outcome = await db.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { taskId } });
    if (!task) return { kind: "not_found" as const };

    // Belum ada state machine tertegakkan (TASK_STATE_MACHINE.md bagian 5)
    // -- CREATED dipilih sebagai satu-satunya status awal yang boleh
    // di-dispatch (keputusan sendiri Fase D, task ini tidak menegakkan
    // transisi lain yang memang belum pernah diproduksi kode mana pun).
    if (task.status !== "CREATED") {
      return { kind: "invalid_status" as const, status: task.status };
    }

    const robot = await tx.robot.findUnique({ where: { robotId: body.robotId } });
    if (!robot) return { kind: "robot_not_found" as const };

    const adapter = getAdapterForRobot(robot);
    if (!adapter) return { kind: "no_adapter" as const, vendor: robot.vendor };

    const attemptCount = await tx.mission.count({ where: { taskId } });
    const mission = await tx.mission.create({
      data: { taskId, robotId: robot.robotId, attempt: attemptCount + 1, status: "PENDING" },
    });

    try {
      const result = await adapter.dispatch(tx, {
        robotId: robot.robotId,
        missionId: mission.missionId,
        kind: body.kind,
        targetPoint: body.targetPoint,
        destinations: body.destinations,
        priority: body.priority,
      });
      await applyTaskStatusChange(tx, {
        missionId: mission.missionId,
        missionStatus: "ACCEPTED",
        taskStatus: result.status,
        changedBy: auth.userId,
        occurredAt: new Date(),
      });
      const updatedTask = await tx.task.findUniqueOrThrow({ where: { taskId } });
      const updatedMission = await tx.mission.findUniqueOrThrow({ where: { missionId: mission.missionId } });
      return { kind: "ok" as const, task: updatedTask, mission: updatedMission, dispatch: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failureCode = getDispatchRejectionFailureCode(err);

      await recordEvent(tx, {
        eventType: failureCode ? "DISPATCH_REJECTED" : "DISPATCH_ERROR",
        sourceType: "TASK",
        sourceId: taskId,
        severity: failureCode ? "WARNING" : "ERROR",
        message,
        taskId,
        occurredAt: new Date(),
      });

      if (failureCode) {
        // Ditolak adapter (robot offline, titik/point_type tak dikenal,
        // dst) -- mission attempt ini gagal, TAPI Task TIDAK ditandai
        // FAILED (tetap CREATED, boleh dicoba dispatch lagi ke robot lain).
        await applyTaskStatusChange(tx, {
          missionId: mission.missionId,
          missionStatus: "FAILED",
          taskStatus: task.status,
          changedBy: auth.userId,
          occurredAt: new Date(),
        });
        return { kind: "rejected" as const, failureCode, message };
      }

      // Error tak terduga (bukan DispatchRejectedError) -- tandai Task
      // FAILED sungguhan, failureCode generik (satu-satunya yang sudah
      // dipakai kode untuk kasus ini, lihat TASK_STATE_MACHINE.md bagian 5).
      await applyTaskStatusChange(tx, {
        missionId: mission.missionId,
        missionStatus: "FAILED",
        taskStatus: "FAILED",
        failureCode: "RESOURCE_ERROR",
        changedBy: auth.userId,
        occurredAt: new Date(),
      });
      return { kind: "error" as const, message };
    }
  });

  switch (outcome.kind) {
    case "not_found":
      return apiError(404, "NOT_FOUND", "Task tidak ditemukan");
    case "invalid_status":
      return apiError(409, "INVALID_TRANSITION", `Task berstatus ${outcome.status}, cuma task CREATED yang bisa di-dispatch`);
    case "robot_not_found":
      return apiError(404, "NOT_FOUND", "Robot tidak ditemukan");
    case "no_adapter":
      return apiError(400, "NO_ADAPTER", `Tidak ada adapter terdaftar untuk vendor "${outcome.vendor}"`);
    case "rejected":
      return apiError(409, outcome.failureCode, outcome.message);
    case "error":
      return apiError(500, "DISPATCH_FAILED", outcome.message);
    case "ok":
      return NextResponse.json(
        { task: outcome.task, mission: outcome.mission, dispatch: outcome.dispatch },
        { status: 200 },
      );
  }
}
