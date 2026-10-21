import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { robotCreateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request) {
  await requireAuth(request);

  const url = new URL(request.url);
  const zoneId = url.searchParams.get("zoneId");

  const robots = await db.robot.findMany({
    where: zoneId ? { equipment: { location: { zoneId } } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(robots);
}

export async function POST(request: Request) {
  await requireAuth(request);

  const result = await parseJsonBody(request, robotCreateSchema);
  if ("error" in result) return result.error;
  const body = result.data;

  const robot = await db.robot.create({
    data: {
      equipmentId: body.equipmentId,
      name: body.name ?? `${body.vendor} ${body.model}`,
      serialNumber: body.serialNumber,
      vendor: body.vendor,
      model: body.model,
      protocol: body.protocol,
    },
  });
  return NextResponse.json(robot, { status: 201 });
}
