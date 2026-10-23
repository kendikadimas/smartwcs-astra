import { requireAuth, type AuthResult } from "./auth";
import { apiError } from "./api-response";

/**
 * Satu helper guard dipakai konsisten di semua route (Bagian 1 Fase C) --
 * jangan sebar cek role manual. Daftar role di sini PERSIS enum `Role` di
 * openapi-smart-wcs.yaml / RBAC.md Section 1 (5 role tetap + 3 role usulan
 * end-to-end -- role usulan BOLEH dicek di sini walau modulnya FR-13..16
 * belum final, karena guard cuma soal "siapa boleh", bukan menetapkan
 * modulnya sendiri final).
 */
export const ROLE = {
  WAREHOUSE_OPERATOR: "WAREHOUSE_OPERATOR",
  WAREHOUSE_SUPERVISOR: "WAREHOUSE_SUPERVISOR",
  WCS_ADMINISTRATOR: "WCS_ADMINISTRATOR",
  MAINTENANCE_ENGINEER: "MAINTENANCE_ENGINEER",
  SYSTEM_INTEGRATOR: "SYSTEM_INTEGRATOR",
  PRODUCTION_OPERATOR: "PRODUCTION_OPERATOR",
  PACKAGING_OPERATOR: "PACKAGING_OPERATOR",
  DELIVERY_OPERATOR: "DELIVERY_OPERATOR",
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

/**
 * Cek sesi DAN role dalam satu panggilan. `allowedRoles` kosong berarti
 * "role apa pun boleh, cukup login" (dipakai modul Read-only yang semua
 * role tetap punya akses baca, lihat RBAC.md Section 2).
 */
export async function requireRole(request: Request, allowedRoles: readonly RoleName[]): Promise<AuthResult> {
  const result = await requireAuth(request);
  if (!result.ok) return result;
  if (allowedRoles.length > 0 && !allowedRoles.includes(result.auth.roleName as RoleName)) {
    return {
      ok: false,
      response: apiError(403, "FORBIDDEN", `Role ${result.auth.roleName} tidak diizinkan untuk operasi ini`),
    };
  }
  return result;
}
