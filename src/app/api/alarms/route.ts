import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/rbac";
import { alarmListQuerySchema } from "@/modules/event/event-schemas";
import type { Prisma } from "@/generated/prisma/client";

// RBAC.md Section 2 "Event & Alarm": semua role login punya minimal Read.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const parsed = alarmListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { status, severity, sourceType, taskId, from, to, page, pageSize } = parsed.data;

  // severity/sourceType/taskId/from/to ada di Event, bukan Alarm langsung
  // (openapi-smart-wcs.yaml cuma punya filter `status` untuk /alarms) --
  // difilter lewat relasi `event`, perluasan sesuai permintaan task ini.
  const eventFilter: Prisma.EventWhereInput = {
    ...(severity ? { severity } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(taskId ? { taskId } : {}),
    ...(from || to
      ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };
  const hasEventFilter = Object.keys(eventFilter).length > 0;

  const where: Prisma.AlarmWhereInput = {
    ...(status ? { status } : {}),
    ...(hasEventFilter ? { event: eventFilter } : {}),
  };

  const [items, total] = await Promise.all([
    db.alarm.findMany({
      where,
      include: { event: true },
      orderBy: { event: { occurredAt: "desc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.alarm.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
