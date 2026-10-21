import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireAuth } from "@/lib/auth";
import { locationCreateSchema } from "@/modules/master-data/schemas";

export async function GET(request: Request) {
  await requireAuth(request);

  const url = new URL(request.url);
  const zoneId = url.searchParams.get("zoneId");

  const locations = await db.location.findMany({
    where: zoneId ? { zoneId } : undefined,
    orderBy: { code: "asc" },
  });
  return NextResponse.json(locations);
}

export async function POST(request: Request) {
  await requireAuth(request);

  const result = await parseJsonBody(request, locationCreateSchema);
  if ("error" in result) return result.error;

  const location = await db.location.create({ data: result.data });
  return NextResponse.json(location, { status: 201 });
}
