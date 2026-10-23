import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { zoneCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 3: "POST/PATCH/DELETE ... /zones ... | WCS Administrator".
export async function PATCH(request: Request, { params }: { params: Promise<{ zoneId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { zoneId } = await params;

  const result = await parseJsonBody(request, zoneCreateSchema.partial());
  if ("error" in result) return result.error;

  const existing = await db.zone.findUnique({ where: { zoneId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Zone tidak ditemukan");

  const zone = await db.zone.update({ where: { zoneId }, data: result.data });
  return NextResponse.json(zone);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ zoneId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;
  const { zoneId } = await params;

  const existing = await db.zone.findUnique({ where: { zoneId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Zone tidak ditemukan");

  await db.zone.delete({ where: { zoneId } });
  return new Response(null, { status: 204 });
}
