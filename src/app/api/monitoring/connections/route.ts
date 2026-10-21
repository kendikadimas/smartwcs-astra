import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

// GET /api/monitoring/connections -- bentuk persis openapi-smart-wcs.yaml.
export async function GET(request: Request) {
  await requireAuth(request);

  const integrations = await db.integration.findMany({ orderBy: { name: "asc" } });
  const items = integrations.map((i) => ({
    systemName: i.name,
    status: i.status,
    lastSeenAt: i.lastTestedAt,
  }));
  return NextResponse.json(items);
}
