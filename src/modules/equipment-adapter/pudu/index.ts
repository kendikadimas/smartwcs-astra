import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { env } from "../../../lib/env";
import { logger } from "../../../lib/logger";
import type { EquipmentAdapter } from "../contract";
import type {
  AdapterCapabilities,
  DispatchCommand,
  DispatchResult,
  InboundMessage,
  InboundResult,
  MissionRef,
  SyncResourcesResult,
} from "../types";
import { verifyCallbackCode } from "./callback-auth";
import { handleNotifyRobotPose, notifyRobotPoseSchema } from "./pose";
import { parsers } from "./parsers";
import { PuduClient, PuduApiError } from "./client";
import { db } from "../../../lib/db";
import { syncShops, syncRobots, syncMaps } from "./sync";
import { refreshPoseReporting } from "./pose-report";
import { reconcileStalledCallTasks } from "./reconcile";
import { IgnoredMessageTypeError } from "../worker-core";
import { recordEvent } from "../../event/record-event";
import { PUDU_INTEGRATION_ID } from "./integration";
import { mapCallStatus, mapDeliveryStatus } from "./status-map";
import { DispatchRejectedError, mapPuduErrorToFailureCode } from "./error-map";

// Envelope minimal callback PUDU (PUDU_INTEGRATION.md bagian 4):
// { "callback_type": "...", "data": { ... } }.
const callbackEnvelopeSchema = z
  .object({ callback_type: z.string().min(1), data: z.unknown().optional() })
  .passthrough();

function getPuduClient(): PuduClient {
  if (!env.PUDU_BASE_URL || !env.PUDU_API_APP_KEY || !env.PUDU_API_APP_SECRET) {
    throw new Error("PUDU_BASE_URL/PUDU_API_APP_KEY/PUDU_API_APP_SECRET belum diset");
  }
  return new PuduClient({ baseUrl: env.PUDU_BASE_URL, apiAppKey: env.PUDU_API_APP_KEY, apiAppSecret: env.PUDU_API_APP_SECRET });
}

/**
 * PUDU_OFFICIAL_EXCERPT.md InitiateCallTask poin 1: run_state menentukan
 * apakah robot bisa dipanggil -- OFFLINE/DISABLE ditolak sebelum memanggil
 * PUDU sama sekali, BUSY tetap dikirim (PUDU yang mengantre), IDLE jalan
 * langsung. State basi (lebih tua dari PUDU_ROBOT_STATE_STALE_MS, atau
 * belum pernah ada) dibarui dulu lewat GetRobotStatusV2 -- kalau panggilan
 * itu sendiri gagal, dispatch tetap lanjut pakai data lama apa adanya
 * (robot yang benar-benar tidak bisa dihubungi akan tertangkap sendiri
 * oleh error InitiateCallTask di bawah).
 */
async function resolveFreshRunState(
  client: PuduClient,
  sn: string,
  cached: { runState: string | null; updatedAt: Date | null } | null,
): Promise<string | null> {
  const staleMs = env.PUDU_ROBOT_STATE_STALE_MS;
  const isStale = !cached?.updatedAt || Date.now() - cached.updatedAt.getTime() > staleMs;
  if (!isStale) return cached?.runState ?? null;

  try {
    const res = await client.getRobotStatusV2({ sn });
    return res.data?.run_state ?? cached?.runState ?? null;
  } catch (err) {
    logger.warn({ sn, errMessage: err instanceof Error ? err.message : String(err) }, "gagal getRobotStatusV2 sebelum dispatch, pakai state lama");
    return cached?.runState ?? null;
  }
}

async function dispatch(tx: Prisma.TransactionClient, command: DispatchCommand): Promise<DispatchResult> {
  const puduRobot = await tx.puduRobot.findUnique({
    where: { robotId: command.robotId },
    include: { puduRobotState: true },
  });
  if (!puduRobot) {
    throw new Error(`Robot ${command.robotId} belum terdaftar sebagai PuduRobot`);
  }

  const client = getPuduClient();
  const state = puduRobot.puduRobotState;
  const runState = await resolveFreshRunState(client, puduRobot.sn, state ? { runState: state.runState, updatedAt: state.updatedAt } : null);

  if (runState === "OFFLINE" || runState === "DISABLE") {
    throw new DispatchRejectedError(`Robot ${puduRobot.sn} run_state=${runState}, tidak bisa dipanggil`, "NO_RESOURCE_AVAILABLE");
  }
  // runState === "BUSY" tetap lanjut (PUDU mengantre, lihat excerpt) --
  // tidak ada cara mengirim do_not_queue=true dari DispatchCommand (tidak
  // ada field itu di kontrak, types.ts tidak diubah di task ini).

  let vendorTaskId: string | undefined;
  let rawState: string | undefined;

  try {
    if (command.kind === "CALL") {
      if (!command.targetPoint) throw new Error("targetPoint wajib untuk dispatch kind CALL");
      if (!state?.currentPuduMapId) {
        throw new DispatchRejectedError(
          `Robot ${puduRobot.sn} belum punya peta aktif (currentPuduMapId kosong), tidak bisa resolve map_name`,
          "NO_RESOURCE_AVAILABLE",
        );
      }
      const element = await tx.puduMapElement.findFirst({
        where: { puduMapId: state.currentPuduMapId, name: command.targetPoint, isActive: true },
      });
      if (!element) {
        throw new DispatchRejectedError(
          `Titik "${command.targetPoint}" tidak ditemukan di peta aktif robot ${puduRobot.sn}`,
          "NO_RESOURCE_AVAILABLE",
        );
      }
      const map = await tx.puduMap.findUnique({ where: { puduMapId: state.currentPuduMapId } });

      // priority WCS -> PUDU: 1-5 valid (1 tertinggi), di luar rentang
      // tidak dikirim supaya PUDU memakai default 5 (excerpt InitiateCallTask).
      const priority =
        command.priority !== undefined && command.priority >= 1 && command.priority <= 5 ? command.priority : undefined;

      const response = await client.initiateCallTask({
        sn: puduRobot.sn,
        map_name: map!.mapName,
        point: command.targetPoint,
        point_type: element.pointType ?? "",
        priority,
      });
      vendorTaskId = response.data?.task_id;
      rawState = response.data?.state;
    } else {
      if (!command.destinations?.length) throw new Error("destinations wajib untuk dispatch kind DELIVERY");
      // DeliveryTask (API inisiasi) BELUM diverifikasi dokumen resmi --
      // field dari PUDU_INTEGRATION.md Lampiran #5 (lihat client.ts).
      const response = await client.deliveryTask({
        sn: puduRobot.sn,
        trays: [{ destinations: command.destinations.map((d) => ({ destination: d.point, type: d.type })) }],
      });
      vendorTaskId = response.data?.task_id;
      rawState = response.data?.task_status;
    }
  } catch (err) {
    if (err instanceof DispatchRejectedError) throw err;
    if (err instanceof PuduApiError) {
      throw new DispatchRejectedError(
        `PUDU menolak dispatch: ${err.code ?? err.message}`,
        mapPuduErrorToFailureCode(err.code),
        err.code,
      );
    }
    throw err;
  }

  if (!vendorTaskId) {
    throw new Error("PUDU tidak mengembalikan task_id");
  }

  await tx.puduTask.upsert({
    where: { vendorTaskId },
    update: { missionId: command.missionId, status: rawState ?? "QUEUEING" },
    create: {
      missionId: command.missionId,
      puduRobotId: puduRobot.puduRobotId,
      vendorTaskId,
      taskKind: command.kind,
      status: rawState ?? "QUEUEING",
    },
  });

  const mapped =
    command.kind === "CALL" ? mapCallStatus(rawState ?? "QUEUEING") : mapDeliveryStatus(rawState ?? "ON_THE_WAY");
  return { externalTaskId: vendorTaskId, status: mapped.recognized ? mapped.taskStatus : "DISPATCHED" };
}

async function cancel(tx: Prisma.TransactionClient, missionRef: MissionRef): Promise<void> {
  const puduTask = await tx.puduTask.findFirst({
    where: { missionId: missionRef.missionId },
    include: { puduRobot: true },
  });
  if (!puduTask) return; // tidak ada task PUDU untuk mission ini

  const client = getPuduClient();
  try {
    // Catatan: InitiateCallTask dan CancelCallTask WAJIB memakai ApiAppKey
    // yang sama (excerpt CancelCallTask poin 3), kalau tidak PUDU membalas
    // CLOUD_OPEN_TASK_BELONG_ERROR. WCS hari ini cuma punya satu ApiAppKey
    // per deployment (satu baris Integration PUDU, lihat integration.ts),
    // jadi tidak ada aksi kode yang perlu diambil -- dicatat sebagai mode
    // gagal yang mungkin terjadi kalau asumsi itu berubah.
    await client.cancelCallTask({ task_id: puduTask.vendorTaskId, sn: puduTask.puduRobot.sn });
  } catch (err) {
    if (err instanceof PuduApiError) {
      throw new DispatchRejectedError(
        `PUDU menolak cancel: ${err.code ?? err.message}`,
        mapPuduErrorToFailureCode(err.code),
        err.code,
      );
    }
    throw err;
  }
  await tx.puduTask.update({ where: { puduTaskId: puduTask.puduTaskId }, data: { status: "CANCEL" } });
}

/**
 * Satu-satunya operasi kontrak tanpa parameter yang cocok dijadwalkan
 * berkala dari worker.ts tanpa mengimpor folder pudu/ langsung (lihat
 * ADAPTER_CONTRACT.md Section 2) -- jadi dipakai sebagai "titik masuk
 * pemeliharaan periodik" PUDU: sync shop/robot/peta (tugas aslinya),
 * refresh NotifyRobotReportPosition, DAN rekonsiliasi task CALL yang
 * nyangkut (Fase E). `SyncResourcesResult` tidak punya field untuk
 * pose-report/rekonsiliasi -- hasilnya cuma dilog, bukan dikembalikan
 * (kontrak types.ts tidak diubah). Keputusan sendiri, dicatat di laporan
 * akhir: membungkus 3 tugas berbeda jadi satu panggilan karena cuma
 * operasi ini yang tersedia di kontrak untuk dipanggil tanpa argumen.
 */
async function syncResources(): Promise<SyncResourcesResult> {
  const client = getPuduClient();
  const shops = await syncShops(client);
  const robots: SyncResourcesResult["robots"] = [];
  let mapsSynced = 0;
  let elementsSynced = 0;

  for (const shop of shops) {
    const shopRobots = await syncRobots(client, shop.shop_id);
    for (const r of shopRobots) robots.push({ serialNumber: r.sn, name: r.nickname });

    const puduShop = await db.puduShop.upsert({
      where: { shopId: shop.shop_id },
      update: { shopName: shop.shop_name, companyId: shop.company_id, companyName: shop.company_name, syncedAt: new Date() },
      create: { shopId: shop.shop_id, shopName: shop.shop_name, companyId: shop.company_id, companyName: shop.company_name, syncedAt: new Date() },
    });
    try {
      const mapResult = await syncMaps(db, client, puduShop.puduShopId, shop.shop_id);
      mapsSynced += mapResult.mapsSynced;
      elementsSynced += mapResult.elementsSynced;
    } catch (err) {
      logger.warn({ shopId: shop.shop_id, errMessage: err instanceof Error ? err.message : String(err) }, "gagal sync peta");
    }
  }

  try {
    const poseResult = await refreshPoseReporting(db, client);
    logger.info(poseResult, "syncResources: refresh pose reporting");
  } catch (err) {
    logger.warn({ errMessage: err instanceof Error ? err.message : String(err) }, "gagal refresh pose reporting");
  }

  try {
    const reconcileResult = await reconcileStalledCallTasks(db, client);
    logger.info(reconcileResult, "syncResources: rekonsiliasi task CALL");
  } catch (err) {
    logger.warn({ errMessage: err instanceof Error ? err.message : String(err) }, "gagal rekonsiliasi task");
  }

  return { robots, locationsSynced: mapsSynced + elementsSynced };
}

async function handleInbound(tx: Prisma.TransactionClient, message: InboundMessage): Promise<InboundResult> {
  if (message.kind === "queued") {
    const parser = parsers[message.messageType];
    if (!parser) {
      // Fase F: callback_type tanpa parser (termasuk yang SENGAJA tidak
      // dikerjakan -- traffic control area, lifting/transport,
      // robotEmergencyRecover) tidak lagi dilempar sebagai Error biasa,
      // yang akan membuat worker-core.ts retry selamanya dan tidak pernah
      // SUCCESS untuk pesan yang memang tidak akan pernah punya parser.
      // Satu Event INFO per callback_type (dedup lewat externalErrorId),
      // BUKAN per pesan -- supaya tidak membanjiri Event kalau callback
      // ini sering masuk.
      // Event.sourceId berkolom UUID (@db.Uuid) -- bukan teks bebas seperti
      // dikira sebelumnya (lihat ERD.md), jadi TIDAK bisa diisi messageType
      // mentah. Dipakai PUDU_INTEGRATION_ID (UUID baris Integration PUDU
      // yang sudah ada) sebagai sourceId; nama callback_type-nya sendiri
      // ada di `message` dan `externalErrorId` (dedup).
      await recordEvent(tx, {
        eventType: "PUDU_UNSUPPORTED_CALLBACK",
        sourceType: "INTEGRATION",
        sourceId: PUDU_INTEGRATION_ID,
        severity: "INFO",
        message: `callback_type "${message.messageType}" belum/tidak didukung, diabaikan`,
        externalErrorId: `unsupported-callback:${message.messageType}`,
        integrationLogId: message.integrationLogId,
        occurredAt: message.occurredAt,
      });
      throw new IgnoredMessageTypeError(`callback_type "${message.messageType}" tidak punya parser (diabaikan)`);
    }
    await parser({ tx, integrationLogId: message.integrationLogId, occurredAt: message.occurredAt, data: message.data });
    return { kind: "processed" };
  }

  // message.kind === "raw"
  if (!env.PUDU_CALLBACK_CODE) {
    return { kind: "unavailable", reason: "PUDU_CALLBACK_CODE belum diset" };
  }

  const traceId = message.headers["traceid"] ?? null;
  const callbackCodeHeader = message.headers["callbackcode"] ?? null;
  if (!verifyCallbackCode(callbackCodeHeader, env.PUDU_CALLBACK_CODE)) {
    return { kind: "unauthorized", reason: "CallbackCode tidak valid", traceId };
  }

  let body: unknown = null;
  try {
    body = message.rawBody ? JSON.parse(message.rawBody) : null;
  } catch {
    body = null;
  }

  const parsedEnvelope = callbackEnvelopeSchema.safeParse(body);
  if (!parsedEnvelope.success) {
    return {
      kind: "invalid",
      reason: "Body bukan JSON valid atau callback_type kosong",
      traceId,
      payload: body && typeof body === "object" ? body : { raw: message.rawBody },
    };
  }

  const { callback_type: callbackType, data } = parsedEnvelope.data;

  if (callbackType === "notifyRobotPose") {
    const parsedPose = notifyRobotPoseSchema.safeParse(data);
    if (parsedPose.success) {
      await handleNotifyRobotPose(tx, parsedPose.data);
    } else {
      logger.warn({ traceId }, "notifyRobotPose diabaikan: data tidak valid");
    }
    return { kind: "handled" };
  }

  return { kind: "queue", traceId, messageType: callbackType, payload: parsedEnvelope.data };
}

function capabilities(): AdapterCapabilities {
  return { canCancel: true, canReportPosition: true, supportedDispatchKinds: ["CALL", "DELIVERY"] };
}

export const puduAdapter: EquipmentAdapter = {
  key: "pudu",
  dispatch,
  cancel,
  syncResources,
  handleInbound,
  capabilities,
};
