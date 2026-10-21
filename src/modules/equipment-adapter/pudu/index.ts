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
import { PuduClient } from "./client";
import { syncShops, syncRobots } from "./sync";
import { mapPuduStatus } from "./status-map";

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

async function dispatch(tx: Prisma.TransactionClient, command: DispatchCommand): Promise<DispatchResult> {
  const puduRobot = await tx.puduRobot.findUnique({ where: { robotId: command.robotId } });
  if (!puduRobot) {
    throw new Error(`Robot ${command.robotId} belum terdaftar sebagai PuduRobot`);
  }

  const client = getPuduClient();
  let vendorTaskId: string | undefined;
  let rawState: string | undefined;

  if (command.kind === "CALL") {
    if (!command.targetPoint) throw new Error("targetPoint wajib untuk dispatch kind CALL");
    const response = await client.initiateCallTask({
      sn: puduRobot.sn,
      point: command.targetPoint,
      priority: command.priority,
    });
    vendorTaskId = response.task_id;
    rawState = response.state;
  } else {
    if (!command.destinations?.length) throw new Error("destinations wajib untuk dispatch kind DELIVERY");
    const response = await client.deliveryTask({
      sn: puduRobot.sn,
      trays: [{ destinations: command.destinations.map((d) => ({ destination: d.point, type: d.type })) }],
    });
    vendorTaskId = response.data?.task_id;
    rawState = response.data?.task_status;
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

  const mapped = mapPuduStatus(rawState ?? "QUEUEING");
  return { externalTaskId: vendorTaskId, status: mapped.recognized ? mapped.taskStatus : "DISPATCHED" };
}

async function cancel(tx: Prisma.TransactionClient, missionRef: MissionRef): Promise<void> {
  const puduTask = await tx.puduTask.findFirst({
    where: { missionId: missionRef.missionId },
    include: { puduRobot: true },
  });
  if (!puduTask) return; // tidak ada task PUDU untuk mission ini

  const client = getPuduClient();
  await client.cancelCallTask({ task_id: puduTask.vendorTaskId, sn: puduTask.puduRobot.sn });
  await tx.puduTask.update({ where: { puduTaskId: puduTask.puduTaskId }, data: { status: "CANCEL" } });
}

async function syncResources(): Promise<SyncResourcesResult> {
  const client = getPuduClient();
  const shops = await syncShops(client);
  const robots: SyncResourcesResult["robots"] = [];
  for (const shop of shops) {
    const shopRobots = await syncRobots(client, shop.shop_id);
    for (const r of shopRobots) robots.push({ serialNumber: r.sn, name: r.nickname });
  }
  return { robots, locationsSynced: shops.length };
}

async function handleInbound(tx: Prisma.TransactionClient, message: InboundMessage): Promise<InboundResult> {
  if (message.kind === "queued") {
    const parser = parsers[message.messageType];
    if (!parser) {
      throw new Error(`Tidak ada parser untuk callback_type "${message.messageType}"`);
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
