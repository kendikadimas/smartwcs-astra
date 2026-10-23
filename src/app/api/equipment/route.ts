import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { equipmentCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 2 "Equipment & Robot": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const zoneId = url.searchParams.get("zoneId");
  const status = url.searchParams.get("status");

  const equipment = await db.equipment.findMany({
    where: {
      ...(zoneId ? { location: { zoneId } } : {}),
      ...(status ? { status } : {}),
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(equipment);
}

// RBAC.md Section 2: "Full" (create/update/delete) cuma WCS Administrator.
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

  const result = await parseJsonBody(request, equipmentCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const equipment = await db.equipment.create({
    data: {
      locationId: body.locationId,
      name: body.name ?? body.equipmentType,
      equipmentType: body.equipmentType,
      vendor: body.vendor,
      status: "OFFLINE",
      capabilities: {},
    },
  });
  return NextResponse.json(equipment, { status: 201 });
}
