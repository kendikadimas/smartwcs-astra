import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { createUserWithPassword } from "@/modules/security/users";
import { userCreateSchema, userListQuerySchema } from "@/modules/security/security-schemas";
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

// RBAC.md Section 3: "GET /users, /roles | WCS Administrator".
export async function GET(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const parsed = userListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { roleId } = parsed.data;

  const users = await db.user.findMany({
    where: roleId ? { roleId } : undefined,
    include: { role: true },
    orderBy: { username: "asc" },
  });
  return NextResponse.json(users.map(toUserResponse));
}

// RBAC.md Section 3: "POST /users | WCS Administrator".
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;

  const result = await parseJsonBody(request, userCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const role = await db.role.findUnique({ where: { name: body.role } });
  if (!role) return apiError(404, "NOT_FOUND", `Role ${body.role} tidak ditemukan`);

  const existing = await db.user.findUnique({ where: { username: body.username } });
  if (existing) return apiError(409, "CONFLICT", `Username ${body.username} sudah dipakai`);

  const user = await db.$transaction((tx) =>
    createUserWithPassword(tx, {
      username: body.username,
      fullName: body.fullName,
      password: body.password,
      roleId: role.roleId,
    }),
  );

  await writeAuditLog(db, {
    userId: auth.userId,
    action: "USER_CREATED",
    targetType: "USER",
    targetId: user.userId,
    afterValue: { username: user.username, role: body.role },
  });

  return NextResponse.json(toUserResponse({ ...user, role }), { status: 201 });
}
