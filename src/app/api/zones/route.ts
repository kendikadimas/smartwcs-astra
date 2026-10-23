import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { zoneCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 2 "Master Data": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const warehouseId = url.searchParams.get("warehouseId");

  const zones = await db.zone.findMany({
    where: warehouseId ? { warehouseId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(zones);
}

// RBAC.md Section 3: "POST/PATCH/DELETE ... /zones ... | WCS Administrator".
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

  const result = await parseJsonBody(request, zoneCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const zone = await db.zone.create({
    data: { warehouseId: body.warehouseId, name: body.name, zoneType: body.zoneType ?? "STORAGE" },
  });
  return NextResponse.json(zone, { status: 201 });
}
