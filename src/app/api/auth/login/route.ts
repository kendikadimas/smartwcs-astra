import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { loginSchema } from "@/modules/security/security-schemas";
import { writeAuditLog } from "@/modules/security/audit-log";
import { db } from "@/lib/db";

// POST /auth/login (docs/openapi-smart-wcs.yaml): {username, password} ->
// {accessToken, expiresIn}. Better Auth sendiri mengembalikan {token, user}
// + Set-Cookie session -- dibungkus ulang ke bentuk spec di sini, cookie
// tetap diteruskan supaya requireAuth() (yang baca sesi dari cookie) jalan.
export async function POST(request: Request) {
  const result = await parseJsonBody(request, loginSchema);
  if ("error" in result) return result.error;
  const { username, password } = result.data;

  const signInResponse = await auth.api.signInUsername({
    body: { username, password },
    asResponse: true,
  });

  if (signInResponse.status !== 200) {
    await writeAuditLog(db, {
      userId: null,
      username,
      action: "LOGIN_FAILED",
      result: "FAILED",
    });
    return apiError(401, "UNAUTHORIZED", "Username atau password salah");
  }

  const setCookie = signInResponse.headers.get("set-cookie");
  const body = (await signInResponse.json()) as { user: { id: string } };

  const session = await auth.api.getSession({
    headers: new Headers(setCookie ? { cookie: setCookie.split(";")[0] } : {}),
  });
  const expiresIn = session
    ? Math.max(0, Math.round((new Date(session.session.expiresAt).getTime() - Date.now()) / 1000))
    : 0;

  await writeAuditLog(db, {
    userId: body.user.id,
    username,
    action: "LOGIN_SUCCESS",
  });

  const response = NextResponse.json({ accessToken: session?.session.token ?? "", expiresIn });
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}
