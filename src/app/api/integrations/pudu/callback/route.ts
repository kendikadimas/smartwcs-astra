import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import "@/modules/equipment-adapter/adapters";
import { getAdapter, findIntegrationForAdapterKey } from "@/modules/equipment-adapter/registry";

// URL ini sudah didaftarkan ke PUDU (tidak boleh pindah), tapi isinya tidak
// lagi mengimpor kode PUDU langsung -- lewat registri adapter supaya rute
// ini bisa dipakai pola yang sama untuk vendor lain nanti.
const ADAPTER_KEY = "pudu";

export async function POST(request: Request) {
  const adapter = getAdapter(ADAPTER_KEY);
  if (!adapter) {
    return apiError(503, "ADAPTER_NOT_REGISTERED", "Adapter belum terdaftar");
  }

  const integration = await findIntegrationForAdapterKey(db, adapter.key);
  if (!integration) {
    return apiError(503, "PUDU_NOT_CONFIGURED", "Integrasi PUDU belum dikonfigurasi");
  }

  const headers: Record<string, string | null> = {};
  for (const [key, value] of request.headers.entries()) headers[key] = value;
  const rawBody = await request.text();
  const receivedAt = new Date();

  const result = await adapter.handleInbound(db, { kind: "raw", headers, rawBody, receivedAt });

  switch (result.kind) {
    case "unavailable":
      return apiError(503, "PUDU_NOT_CONFIGURED", result.reason);

    case "unauthorized":
      await db.integrationLog.createMany({
        data: [
          {
            integrationId: integration.integrationId,
            direction: "INBOUND",
            status: "IGNORED",
            traceId: result.traceId,
            messageType: "UNKNOWN",
            payload: {},
            callbackCodeValid: false,
            errorMessage: result.reason,
            occurredAt: receivedAt,
          },
        ],
        skipDuplicates: true,
      });
      return apiError(401, "INVALID_CALLBACK_CODE", result.reason);

    case "invalid":
      await db.integrationLog.createMany({
        data: [
          {
            integrationId: integration.integrationId,
            direction: "INBOUND",
            status: "IGNORED",
            traceId: result.traceId,
            messageType: "UNKNOWN",
            payload: result.payload && typeof result.payload === "object" ? (result.payload as object) : {},
            callbackCodeValid: true,
            errorMessage: result.reason,
            occurredAt: receivedAt,
          },
        ],
        skipDuplicates: true,
      });
      return NextResponse.json({ status: "ignored" }, { status: 200 });

    case "queue":
      await db.integrationLog.createMany({
        data: [
          {
            integrationId: integration.integrationId,
            direction: "INBOUND",
            status: "PENDING",
            traceId: result.traceId,
            messageType: result.messageType,
            payload: result.payload as object,
            callbackCodeValid: true,
            occurredAt: receivedAt,
          },
        ],
        skipDuplicates: true,
      });
      return NextResponse.json({ status: "ok" }, { status: 200 });

    case "handled":
    case "processed":
      return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}
