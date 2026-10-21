import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  await requireAuth(request);
  const { taskId } = await params;

  const task = await db.task.findUnique({ where: { taskId } });
  if (!task) {
    return apiError(404, "NOT_FOUND", "Task tidak ditemukan");
  }
  return NextResponse.json(task);
}
