import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { locationCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 3: "POST/PATCH/DELETE ... /locations ... | WCS Administrator".
export async function PATCH(request: Request, { params }: { params: Promise<{ locationId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { locationId } = await params;

  const result = await parseJsonBody(request, locationCreateSchema.partial());
  if ("error" in result) return result.error;

  const existing = await db.location.findUnique({ where: { locationId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Location tidak ditemukan");

  const location = await db.location.update({ where: { locationId }, data: result.data });
  return NextResponse.json(location);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ locationId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { locationId } = await params;

  const existing = await db.location.findUnique({ where: { locationId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Location tidak ditemukan");

  await db.location.delete({ where: { locationId } });
  return new Response(null, { status: 204 });
}
