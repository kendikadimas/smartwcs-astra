import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins/username";
import { NextResponse } from "next/server";
import { db } from "./db";
import { env } from "./env";
import { apiError } from "./api-response";

/**
 * Bagian 1 (ADR Section 9.1): Better Auth menggantikan stub. `User`/`Role`
 * TETAP satu tabel (tidak ada tabel user kedua) -- dipetakan lewat
 * `user.fields` (name -> fullName). Login pakai plugin `username` (bukan
 * `/sign-in/email`): OpenAPI `/auth/login` minta `{username, password}`,
 * sesuai kolom `User.username` yang sudah ada -- bukan email asli.
 *
 * `email`/`emailVerified`/`image`/`updatedAt`/`id` di `User` (lihat
 * schema.prisma) murni kebutuhan STRUKTURAL Better Auth: core-nya
 * mewajibkan field "email" unik apa pun plugin yang dipakai untuk login,
 * dan `getDefaultFieldName` di @better-auth/core HARDCODE nama kolom "id"
 * untuk primary key setiap model tanpa jalan remap -- karena primary key
 * User di schema ini sudah lama bernama `userId` (dipakai di puluhan
 * relasi), kolom `id` baru ditambah sebagai salinan nilai yang SAMA PERSIS
 * (lihat src/modules/security/users.ts `createUserWithPassword`), bukan
 * identitas kedua.
 */
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: env.AUTH_SECRET,
  baseURL: env.AUTH_BASE_URL ?? `http://localhost:${env.PORT}`,
  user: {
    modelName: "User",
    fields: { name: "fullName" },
  },
  session: { modelName: "Session" },
  account: { modelName: "Account" },
  verification: { modelName: "Verification" },
  // disableSignUp: user HANYA dibuat lewat POST /users (admin) atau
  // prisma/seed.ts -- tidak ada self-registration publik.
  emailAndPassword: { enabled: true, disableSignUp: true },
  plugins: [username({ displayUsername: false })],
});

export interface AuthContext {
  userId: string;
  roleName: string; // Role.name, mis. "WAREHOUSE_OPERATOR" (lihat RBAC.md)
}

export type AuthResult = { ok: true; auth: AuthContext } | { ok: false; response: NextResponse };

/**
 * Pengganti stub lama (dulu `{userId: string|null}`, selalu lolos). SEKARANG
 * mengecek sesi Better Auth (cookie) sungguhan -- tanpa sesi sah: 401.
 * Dipakai lewat `requireRole()` (src/lib/rbac.ts) di hampir semua route;
 * dipakai langsung hanya untuk endpoint yang cuma butuh "login apa saja"
 * tanpa syarat role spesifik.
 */
export async function requireAuth(request: Request): Promise<AuthResult> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "Sesi tidak valid atau tidak ada") };
  }
  // session.user.id == User.userId (dijaga sama persis saat user dibuat,
  // lihat komentar di atas) -- tetap query User+Role di sini (bukan dari
  // payload sesi) supaya role selalu terbaru kalau baru diubah admin,
  // dan supaya user yang baru dinonaktifkan (active=false) langsung ditolak.
  const user = await db.user.findUnique({
    where: { userId: session.user.id },
    include: { role: true },
  });
  if (!user || !user.active) {
    return { ok: false, response: apiError(401, "UNAUTHORIZED", "User tidak ditemukan atau tidak aktif") };
  }
  return { ok: true, auth: { userId: user.userId, roleName: user.role.name } };
}
