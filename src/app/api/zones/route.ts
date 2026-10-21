import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { zoneCreateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request) {
  await requireAuth(request);

  const url = new URL(request.url);
  const warehouseId = url.searchParams.get("warehouseId");

  const zones = await db.zone.findMany({
    where: warehouseId ? { warehouseId } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(zones);
}

export async function POST(request: Request) {
  await requireAuth(request);

  const result = await parseJsonBody(request, zoneCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const zone = await db.zone.create({
    data: { warehouseId: body.warehouseId, name: body.name, zoneType: body.zoneType ?? "STORAGE" },
  });
  return NextResponse.json(zone, { status: 201 });
}
