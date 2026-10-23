import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, ROLE } from "@/lib/rbac";

// RBAC.md Section 3: "GET /users, /roles | WCS Administrator".
//
// Catatan gap spec (lihat laporan akhir): openapi-smart-wcs.yaml menyatakan
// item respons ref `#/components/schemas/Role`, yang di `components.schemas`
// didefinisikan sebagai enum string polos -- bukan objek. Tapi
// `GET /users?roleId=` (juga di spec yang sama) butuh `roleId` (UUID), yang
// hanya bisa didapat dari tabel Role (schema.prisma), bukan dari nama enum
// saja. Dikembalikan {roleId, name} di sini supaya roleId itu bisa dipakai;
// flag untuk disinkronkan ke OpenAPI di Bagian 2.
export async function GET(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

  const roles = await db.role.findMany({ orderBy: { name: "asc" }, select: { roleId: true, name: true } });
  return NextResponse.json(roles);
}
