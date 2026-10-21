import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { verifyCallbackCode } from "@/modules/equipment-adapter/pudu/callback-auth";
import { getPuduIntegration } from "@/modules/equipment-adapter/pudu/integration";
import { handleNotifyRobotPose, notifyRobotPoseSchema } from "@/modules/equipment-adapter/pudu/pose";

// Envelope minimal callback PUDU (PUDU_INTEGRATION.md bagian 4):
// { "callback_type": "...", "data": { ... } }. Field lain diabaikan di sini --
// parsing detail per callback_type dilakukan worker (Fase 2).
const callbackEnvelopeSchema = z
  .object({
    callback_type: z.string().min(1),
    data: z.unknown().optional(),
  })
  .passthrough();

export async function POST(request: Request) {
  if (!env.PUDU_CALLBACK_CODE) {
    logger.warn("callback PUDU ditolak: PUDU_CALLBACK_CODE belum diset");
    return apiError(503, "PUDU_NOT_CONFIGURED", "Integrasi PUDU belum dikonfigurasi");
  }

  const integration = await getPuduIntegration(db);
  if (!integration) {
    logger.warn("callback PUDU ditolak: baris Integration PUDU belum ada (jalankan seed)");
    return apiError(503, "PUDU_NOT_CONFIGURED", "Integrasi PUDU belum dikonfigurasi");
  }

  const traceId = request.headers.get("TraceId");
  const callbackCodeValid = verifyCallbackCode(
    request.headers.get("CallbackCode"),
    env.PUDU_CALLBACK_CODE,
  );
  const occurredAt = new Date();

  if (!callbackCodeValid) {
    await db.integrationLog.createMany({
      data: [
        {
          integrationId: integration.integrationId,
          direction: "INBOUND",
          status: "IGNORED",
          traceId,
          messageType: "UNKNOWN",
          payload: {},
          callbackCodeValid: false,
          errorMessage: "CallbackCode tidak valid",
          occurredAt,
        },
      ],
      skipDuplicates: true,
    });
    logger.warn({ traceId }, "callback PUDU ditolak: CallbackCode tidak valid");
    return apiError(401, "INVALID_CALLBACK_CODE", "CallbackCode tidak valid");
  }

  const rawBody = await request.text();
  let body: unknown = null;
  try {
    body = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    body = null;
  }

  const parsedEnvelope = callbackEnvelopeSchema.safeParse(body);
  if (!parsedEnvelope.success) {
    await db.integrationLog.createMany({
      data: [
        {
          integrationId: integration.integrationId,
          direction: "INBOUND",
          status: "IGNORED",
          traceId,
          messageType: "UNKNOWN",
          payload: body && typeof body === "object" ? (body as object) : { raw: rawBody },
          callbackCodeValid: true,
          errorMessage: "Body bukan JSON valid atau callback_type kosong",
          occurredAt,
        },
      ],
      skipDuplicates: true,
    });
    logger.warn({ traceId }, "callback PUDU diabaikan: payload tidak valid");
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const { callback_type: callbackType, data } = parsedEnvelope.data;

  // Pengecualian notifyRobotPose: frekuensi tinggi, upsert langsung tanpa
  // lewat antrean IntegrationLog (PUDU_INTEGRATION.md bagian 4 poin 5).
  if (callbackType === "notifyRobotPose") {
    const parsedPose = notifyRobotPoseSchema.safeParse(data);
    if (parsedPose.success) {
      await handleNotifyRobotPose(db, parsedPose.data);
    } else {
      logger.warn({ traceId }, "notifyRobotPose diabaikan: data tidak valid");
    }
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  await db.integrationLog.createMany({
    data: [
      {
        integrationId: integration.integrationId,
        direction: "INBOUND",
        status: "PENDING",
        traceId,
        messageType: callbackType,
        payload: parsedEnvelope.data as object,
        callbackCodeValid: true,
        occurredAt,
      },
    ],
    skipDuplicates: true,
  });

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
