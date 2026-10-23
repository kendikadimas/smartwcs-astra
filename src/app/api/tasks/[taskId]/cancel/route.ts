import { NextResponse } from "next/server";
import "@/modules/equipment-adapter/adapters";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole, ROLE } from "@/lib/rbac";
import { getAdapterForRobot } from "@/modules/equipment-adapter/registry";
import { applyTaskStatusChange } from "@/modules/task/apply-status-change";
import { getDispatchRejectionFailureCode } from "@/modules/task/dispatch-rejection";
import { recordEvent } from "@/modules/event/record-event";

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "FAILED"];

// POST /tasks/{taskId}/cancel (docs/openapi-smart-wcs.yaml). RBAC.md
// Section 3: Warehouse Operator, Warehouse Supervisor.
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WAREHOUSE_OPERATOR, ROLE.WAREHOUSE_SUPERVISOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { taskId } = await params;

  const outcome = await db.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { taskId } });
    if (!task) return { kind: "not_found" as const };

    // PRD: "status apa pun bisa pindah ke CANCELLED selama task belum
    // selesai" -- COMPLETED/CANCELLED/FAILED dianggap selesai.
    if (TERMINAL_STATUSES.includes(task.status)) {
      return { kind: "invalid_status" as const, status: task.status };
    }

    const mission = await tx.mission.findFirst({
      where: { taskId, status: { notIn: ["CANCELLED", "FAILED", "COMPLETED"] } },
      orderBy: { createdAt: "desc" },
      include: { robot: true },
    });

    if (mission) {
      const adapter = getAdapterForRobot(mission.robot);
      // Adapter tak terdaftar untuk robot ini dianggap tidak bisa dibatalkan
      // di sisi vendor -- status WCS tetap dipindah ke CANCELLED (task ini
      // tidak membangun jalur retry pembatalan, lihat laporan akhir).
      if (adapter) {
        try {
          await adapter.cancel(tx, { missionId: mission.missionId });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const failureCode = getDispatchRejectionFailureCode(err);
          await recordEvent(tx, {
            eventType: failureCode ? "CANCEL_REJECTED" : "CANCEL_ERROR",
            sourceType: "TASK",
            sourceId: taskId,
            severity: failureCode ? "WARNING" : "ERROR",
            message,
            taskId,
            occurredAt: new Date(),
          });
          return { kind: "cancel_rejected" as const, failureCode: failureCode ?? "RESOURCE_ERROR", message };
        }
      }
      await applyTaskStatusChange(tx, {
        missionId: mission.missionId,
        missionStatus: "CANCELLED",
        taskStatus: "CANCELLED",
        changedBy: auth.userId,
        occurredAt: new Date(),
      });
    } else {
      // Belum pernah di-dispatch (tidak ada Mission) -- tidak ada yang
      // perlu dibatalkan di sisi robot, cuma pindah status Task.
      await tx.taskStatusHistory.create({
        data: { taskId, fromStatus: task.status, toStatus: "CANCELLED", changedBy: auth.userId, changedAt: new Date() },
      });
      await tx.task.update({ where: { taskId }, data: { status: "CANCELLED" } });
    }

    const updatedTask = await tx.task.findUniqueOrThrow({ where: { taskId } });
    return { kind: "ok" as const, task: updatedTask };
  });

  switch (outcome.kind) {
    case "not_found":
      return apiError(404, "NOT_FOUND", "Task tidak ditemukan");
    case "invalid_status":
      return apiError(409, "INVALID_TRANSITION", `Task berstatus ${outcome.status}, sudah selesai dan tidak bisa dibatalkan`);
    case "cancel_rejected":
      return apiError(409, outcome.failureCode, outcome.message);
    case "ok":
      return NextResponse.json(outcome.task);
  }
}
