import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Prisma } from "../../generated/prisma/client";

/**
 * Kolom `email`/`emailVerified`/`id` di `User` murni kebutuhan struktural
 * Better Auth (lihat src/lib/auth.ts) -- disintesis di sini, tidak pernah
 * dikirim/dibaca di luar fungsi ini. `id` HARUS sama persis dengan
 * `userId` (Better Auth meng-hardcode nama kolom "id" sebagai primary key,
 * padahal PK asli tabel ini `userId`).
 */
function syntheticEmail(username: string): string {
  return `${username.toLowerCase()}@users.smartwcs.internal`;
}

export interface CreateUserInput {
  username: string;
  fullName: string;
  password: string;
  roleId: string;
}

/**
 * Satu jalur pembuatan user (dipakai `POST /users` dan `prisma/seed.ts`) --
 * menulis User DAN Account (kredensial "credential", hash password format
 * Better Auth/scrypt lewat `hashPassword` resmi, BUKAN diimplementasikan
 * sendiri) dalam satu transaksi. `User.passwordHash` (kolom lama) diisi
 * placeholder tetap -- lihat komentar di schema.prisma, tidak lagi dibaca
 * jalur auth manapun.
 */
export async function createUserWithPassword(tx: Prisma.TransactionClient, input: CreateUserInput) {
  const id = randomUUID();
  const passwordHash = await hashPassword(input.password);

  const user = await tx.user.create({
    data: {
      userId: id,
      id,
      username: input.username,
      fullName: input.fullName,
      email: syntheticEmail(input.username),
      emailVerified: false,
      passwordHash: "managed-by-better-auth",
      roleId: input.roleId,
    },
  });

  await tx.account.create({
    data: {
      id: randomUUID(),
      accountId: user.userId,
      providerId: "credential",
      userId: user.userId,
      password: passwordHash,
    },
  });

  return user;
}

/** Dipakai PATCH /users/me/password -- ganti hash di Account (bukan User.passwordHash). */
export async function setUserPassword(tx: Prisma.TransactionClient, userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  const account = await tx.account.findFirst({ where: { userId, providerId: "credential" } });
  if (!account) {
    throw new Error(`Account credential untuk user ${userId} tidak ditemukan`);
  }
  await tx.account.update({ where: { id: account.id }, data: { password: passwordHash } });
}
