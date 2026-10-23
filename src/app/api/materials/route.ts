import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { materialCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 2 "Master Data": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;
  const materials = await db.material.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(materials);
}

// RBAC.md Section 3: "POST/PATCH/DELETE ... /materials | WCS Administrator".
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

  const result = await parseJsonBody(request, materialCreateSchema);
  if ("error" in result) return result.error;

  const material = await db.material.create({ data: result.data });
  return NextResponse.json(material, { status: 201 });
}
