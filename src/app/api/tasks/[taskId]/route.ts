import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole, ROLE } from "@/lib/rbac";

// RBAC.md Section 2 "Task Management": sama seperti GET /tasks.
export async function GET(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireRole(request, [
    ROLE.WAREHOUSE_OPERATOR,
    ROLE.WAREHOUSE_SUPERVISOR,
    ROLE.WCS_ADMINISTRATOR,
    ROLE.SYSTEM_INTEGRATOR,
  ]);
  if (!authResult.ok) return authResult.response;
  const { taskId } = await params;

  const task = await db.task.findUnique({ where: { taskId } });
  if (!task) {
    return apiError(404, "NOT_FOUND", "Task tidak ditemukan");
  }
  return NextResponse.json(task);
}
