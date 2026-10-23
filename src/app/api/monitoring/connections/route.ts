import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/rbac";

// GET /api/monitoring/connections -- bentuk persis openapi-smart-wcs.yaml.
// RBAC.md Section 2 "Monitoring": Read untuk semua role login.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const integrations = await db.integration.findMany({ orderBy: { name: "asc" } });
  const items = integrations.map((i) => ({
    systemName: i.name,
    status: i.status,
    lastSeenAt: i.lastTestedAt,
  }));
  return NextResponse.json(items);
}
