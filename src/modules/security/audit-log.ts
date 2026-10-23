import type { Prisma } from "../../generated/prisma/client";

/**
 * Satu jalur pencatatan AuditLog (Bagian 1 Fase C, RBAC.md Section 4 --
 * "setiap aksi Write/Full wajib tercatat siapa pelakunya dan kapan").
 * `userId` null diizinkan (mis. login gagal oleh username tak dikenal,
 * lihat schema.prisma komentar AuditLog.userId) -- pemanggil yang
 * memutuskan kapan itu relevan, fungsi ini tidak memvalidasi.
 */
export interface AuditLogInput {
  userId: string | null;
  username?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  beforeValue?: Prisma.InputJsonValue;
  afterValue?: Prisma.InputJsonValue;
  result?: "SUCCESS" | "FAILED";
  ipAddress?: string | null;
}

export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: AuditLogInput,
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: input.userId,
      username: input.username ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      beforeValue: input.beforeValue,
      afterValue: input.afterValue,
      result: input.result ?? "SUCCESS",
      ipAddress: input.ipAddress ?? null,
      occurredAt: new Date(),
    },
  });
}

/** IP pemanggil dari header standar proxy -- null kalau tidak ada (dev lokal langsung). */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}
