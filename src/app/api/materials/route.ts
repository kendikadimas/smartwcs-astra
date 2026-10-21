import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { materialCreateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request) {
  await requireAuth(request);
  const materials = await db.material.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(materials);
}

export async function POST(request: Request) {
  await requireAuth(request);

  const result = await parseJsonBody(request, materialCreateSchema);
  if ("error" in result) return result.error;

  const material = await db.material.create({ data: result.data });
  return NextResponse.json(material, { status: 201 });
}
