import { NextResponse } from "next/server";
import { auth, requireAuth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { passwordChangeSchema } from "@/modules/security/security-schemas";
import { writeAuditLog } from "@/modules/security/audit-log";
import { db } from "@/lib/db";

// PATCH /users/me/password (docs/openapi-smart-wcs.yaml, RBAC.md Section 4
// "Self-service"): semua role login boleh ubah password sendiri. Pakai
// endpoint bawaan Better Auth (`auth.api.changePassword`) -- itu sudah
// memverifikasi oldPassword lewat Account.password, tidak perlu ditulis ulang.
export async function PATCH(request: Request) {
  const authResult = await requireAuth(request);
  if (!authResult.ok) return authResult.response;
  const { auth: authCtx } = authResult;

  const result = await parseJsonBody(request, passwordChangeSchema);
  if ("error" in result) return result.error;
  const { oldPassword, newPassword } = result.data;

  try {
    await auth.api.changePassword({
      body: { currentPassword: oldPassword, newPassword },
      headers: request.headers,
    });
  } catch {
    return apiError(401, "UNAUTHORIZED", "Password lama salah");
  }

  await writeAuditLog(db, {
    userId: authCtx.userId,
    action: "PASSWORD_CHANGED",
    targetType: "USER",
    targetId: authCtx.userId,
  });
  return NextResponse.json({ status: "ok" });
}
