import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { equipmentUpdateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  await requireAuth(request);
  const { equipmentId } = await params;

  const equipment = await db.equipment.findUnique({ where: { equipmentId } });
  if (!equipment) return apiError(404, "NOT_FOUND", "Equipment tidak ditemukan");
  return NextResponse.json(equipment);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  await requireAuth(request);
  const { equipmentId } = await params;

  const result = await parseJsonBody(request, equipmentUpdateSchema);
  if ("error" in result) return result.error;

  const existing = await db.equipment.findUnique({ where: { equipmentId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Equipment tidak ditemukan");

  const equipment = await db.equipment.update({ where: { equipmentId }, data: result.data });
  return NextResponse.json(equipment);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  await requireAuth(request);
  const { equipmentId } = await params;

  const existing = await db.equipment.findUnique({ where: { equipmentId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Equipment tidak ditemukan");

  await db.equipment.delete({ where: { equipmentId } });
  return new Response(null, { status: 204 });
}
