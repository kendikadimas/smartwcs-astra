import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { userUpdateSchema } from "@/modules/security/security-schemas";
import { writeAuditLog } from "@/modules/security/audit-log";

function toUserResponse(user: { userId: string; username: string; fullName: string; active: boolean; createdAt: Date; role: { name: string } }) {
  return {
    userId: user.userId,
    username: user.username,
    fullName: user.fullName,
    role: user.role.name,
    active: user.active,
    createdAt: user.createdAt,
  };
}

// RBAC.md Section 3: user & role management (detail) | WCS Administrator.
export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { userId } = await params;

  const user = await db.user.findUnique({ where: { userId }, include: { role: true } });
  if (!user) return apiError(404, "NOT_FOUND", "User tidak ditemukan");
  return NextResponse.json(toUserResponse(user));
}

// RBAC.md Section 3: "PATCH/DELETE /users/{id} | WCS Administrator --
// termasuk ubah role dan nonaktifkan akun".
export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { userId } = await params;

  const result = await parseJsonBody(request, userUpdateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const existing = await db.user.findUnique({ where: { userId } });
  if (!existing) return apiError(404, "NOT_FOUND", "User tidak ditemukan");

  let roleId: string | undefined;
  if (body.role) {
    const role = await db.role.findUnique({ where: { name: body.role } });
    if (!role) return apiError(404, "NOT_FOUND", `Role ${body.role} tidak ditemukan`);
    roleId = role.roleId;
  }

  const user = await db.user.update({
    where: { userId },
    data: { fullName: body.fullName, active: body.active, roleId },
    include: { role: true },
  });

  await writeAuditLog(db, {
    userId: auth.userId,
    action: "USER_UPDATED",
    targetType: "USER",
    targetId: userId,
    afterValue: { fullName: user.fullName, role: user.role.name, active: user.active },
  });

  return NextResponse.json(toUserResponse(user));
}

// DELETE = nonaktifkan (active=false), BUKAN hapus baris -- komentar
// schema.prisma User.active: "DELETE /users/{id} menonaktifkan, bukan
// menghapus baris".
export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { userId } = await params;

  const existing = await db.user.findUnique({ where: { userId } });
  if (!existing) return apiError(404, "NOT_FOUND", "User tidak ditemukan");

  await db.user.update({ where: { userId }, data: { active: false } });

  await writeAuditLog(db, {
    userId: auth.userId,
    action: "USER_DEACTIVATED",
    targetType: "USER",
    targetId: userId,
  });

  return new Response(null, { status: 204 });
}
