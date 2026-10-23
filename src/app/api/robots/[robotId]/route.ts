import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { robotCreateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request, { params }: { params: Promise<{ robotId: string }> }) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;
  const { robotId } = await params;

  const robot = await db.robot.findUnique({ where: { robotId } });
  if (!robot) return apiError(404, "NOT_FOUND", "Robot tidak ditemukan");
  return NextResponse.json(robot);
}

// RBAC.md Section 3: "PATCH /equipment/{id}, /robots/{id} | WCS Administrator,
// Maintenance/Engineer".
export async function PATCH(request: Request, { params }: { params: Promise<{ robotId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR, ROLE.MAINTENANCE_ENGINEER]);
  if (!authResult.ok) return authResult.response;
  const { robotId } = await params;

  const result = await parseJsonBody(request, robotCreateSchema.partial());
  if ("error" in result) return result.error;

  const existing = await db.robot.findUnique({ where: { robotId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Robot tidak ditemukan");

  const robot = await db.robot.update({ where: { robotId }, data: result.data });
  return NextResponse.json(robot);
}

// RBAC.md Section 3: "DELETE /equipment/{id}, /robots/{id} | WCS Administrator".
export async function DELETE(request: Request, { params }: { params: Promise<{ robotId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { robotId } = await params;

  const existing = await db.robot.findUnique({ where: { robotId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Robot tidak ditemukan");

  await db.robot.delete({ where: { robotId } });
  return new Response(null, { status: 204 });
}
