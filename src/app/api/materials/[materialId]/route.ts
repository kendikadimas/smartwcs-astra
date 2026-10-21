import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { materialCreateSchema } from "@/modules/master-data/schemas";

export async function PATCH(request: Request, { params }: { params: Promise<{ materialId: string }> }) {
  await requireAuth(request);
  const { materialId } = await params;

  const result = await parseJsonBody(request, materialCreateSchema.partial());
  if ("error" in result) return result.error;

  const existing = await db.material.findUnique({ where: { materialId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Material tidak ditemukan");

  const material = await db.material.update({ where: { materialId }, data: result.data });
  return NextResponse.json(material);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ materialId: string }> }) {
  await requireAuth(request);
  const { materialId } = await params;

  const existing = await db.material.findUnique({ where: { materialId } });
  if (!existing) return apiError(404, "NOT_FOUND", "Material tidak ditemukan");

  await db.material.delete({ where: { materialId } });
  return new Response(null, { status: 204 });
}
