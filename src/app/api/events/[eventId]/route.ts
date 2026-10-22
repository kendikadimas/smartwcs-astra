import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

// Tidak ada di openapi-smart-wcs.yaml (cuma list /events) -- ditambah
// karena diminta eksplisit ("Detail event") di task ini.
export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  await requireAuth(request);
  const { eventId } = await params;

  const event = await db.event.findUnique({ where: { eventId } });
  if (!event) {
    return apiError(404, "NOT_FOUND", "Event tidak ditemukan");
  }
  return NextResponse.json(event);
}
