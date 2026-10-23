import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { equipmentUpdateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;
  const { equipmentId } = await params;

  const equipment = await db.equipment.findUnique({ where: { equipmentId } });
  if (!equipment) return apiError(404, "NOT_FOUND", "Equipment tidak ditemukan");
  return NextResponse.json(equipment);
}

// RBAC.md Section 3: "PATCH /equipment/{id}, /robots/{id} | WCS Administrator,
// Maintenance/Engineer". Catatan di dokumen: Maintenance cuma boleh ubah
// field status/konfigurasi teknis, bukan vendor/lokasi -- belum ditegakkan
// per-field di sini (hanya per-role), lihat laporan akhir.
export async function PATCH(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR, ROLE.MAINTENANCE_ENGINEER]);
  if (!authResult.ok) return authResult.response;
  const { equipmentId } = await params;

  const result = await parseJsonBody(request, equipmentUpdateSchema);
  if ("error" in result) return result.error;

  const existing = await db.equipment.findUnique({ where: { equipmentId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Equipment tidak ditemukan");

  const equipment = await db.equipment.update({ where: { equipmentId }, data: result.data });
  return NextResponse.json(equipment);
}

// RBAC.md Section 3: "DELETE /equipment/{id}, /robots/{id} | WCS Administrator".
export async function DELETE(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { equipmentId } = await params;

  const existing = await db.equipment.findUnique({ where: { equipmentId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Equipment tidak ditemukan");

  await db.equipment.delete({ where: { equipmentId } });
  return new Response(null, { status: 204 });
}
