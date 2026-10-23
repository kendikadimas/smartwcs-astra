import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole, ROLE } from "@/lib/rbac";

/**
 * POST /tasks/{taskId}/retry (docs/openapi-smart-wcs.yaml). RBAC.md
 * Section 3: cuma Warehouse Supervisor (Operator tidak bisa retry sendiri).
 *
 * Keputusan sendiri (Fase D, lihat TASK_STATE_MACHINE.md bagian 5 --
 * `retryCount` tidak pernah dibaca/ditambah kode mana pun sebelum ini,
 * status `RETRY`/`QUEUED` tidak pernah diproduksi kode mana pun): retry
 * memindahkan Task balik ke `CREATED` (bukan `QUEUED`, nilai yang memang
 * tidak dipakai kode manapun) supaya bisa langsung di-dispatch lagi lewat
 * `POST /tasks/{taskId}/dispatch`, dan menaikkan `retryCount`. Mission lama
 * (FAILED) dibiarkan apa adanya sebagai riwayat -- dispatch berikutnya
 * membuat Mission baru dengan `attempt` yang sudah dihitung dari jumlah
 * Mission sebelumnya.
 */
export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const authResult = await requireRole(request, [ROLE.WAREHOUSE_SUPERVISOR]);
  if (!authResult.ok) return authResult.response;
  const { auth } = authResult;
  const { taskId } = await params;

  const outcome = await db.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { taskId } });
    if (!task) return { kind: "not_found" as const };
    if (task.status !== "FAILED") return { kind: "invalid_status" as const, status: task.status };

    await tx.taskStatusHistory.create({
      data: {
        taskId,
        fromStatus: task.status,
        toStatus: "CREATED",
        reason: "RETRY",
        changedBy: auth.userId,
        changedAt: new Date(),
      },
    });
    const updated = await tx.task.update({
      where: { taskId },
      data: { status: "CREATED", failureCode: null, retryCount: { increment: 1 } },
    });
    return { kind: "ok" as const, task: updated };
  });

  switch (outcome.kind) {
    case "not_found":
      return apiError(404, "NOT_FOUND", "Task tidak ditemukan");
    case "invalid_status":
      return apiError(409, "INVALID_TRANSITION", `Task berstatus ${outcome.status}, cuma task FAILED yang bisa di-retry`);
    case "ok":
      return NextResponse.json(outcome.task);
  }
}
