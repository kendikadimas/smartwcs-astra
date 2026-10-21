import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { equipmentCreateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request) {
  await requireAuth(request);

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

export async function POST(request: Request) {
  await requireAuth(request);

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
