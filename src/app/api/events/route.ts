import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { eventListQuerySchema } from "@/modules/event/event-schemas";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  await requireAuth(request);

  const url = new URL(request.url);
  const parsed = eventListQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { severity, sourceType, taskId, from, to, page, pageSize } = parsed.data;

  const where: Prisma.EventWhereInput = {
    ...(severity ? { severity } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(taskId ? { taskId } : {}),
    ...(from || to
      ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.event.count({ where }),
  ]);

  return NextResponse.json({ items, total });
}
