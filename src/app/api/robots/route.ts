import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { robotCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 2 "Equipment & Robot": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const zoneId = url.searchParams.get("zoneId");

  const robots = await db.robot.findMany({
    where: zoneId ? { equipment: { location: { zoneId } } } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json(robots);
}

// RBAC.md Section 2: "Full" (create) cuma WCS Administrator.
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

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
