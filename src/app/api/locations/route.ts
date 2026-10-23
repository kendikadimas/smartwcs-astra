import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJsonBody } from "@/lib/validate";
import { requireRole, ROLE } from "@/lib/rbac";
import { locationCreateSchema } from "@/modules/master-data/schemas";

// RBAC.md Section 2 "Master Data": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const zoneId = url.searchParams.get("zoneId");

  const locations = await db.location.findMany({
    where: zoneId ? { zoneId } : undefined,
    orderBy: { code: "asc" },
  });
  return NextResponse.json(locations);
}

// RBAC.md Section 3: "POST/PATCH/DELETE ... /locations ... | WCS Administrator".
export async function POST(request: Request) {
  const authResult = await requireRole(request, [ROLE.WCS_ADMINISTRATOR]);
  if (!authResult.ok) return authResult.response;

  const result = await parseJsonBody(request, locationCreateSchema);
  if ("error" in result) return result.error;

  const location = await db.location.create({ data: result.data });
  return NextResponse.json(location, { status: 201 });
}
