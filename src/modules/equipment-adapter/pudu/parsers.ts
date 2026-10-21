import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client";
import { resolveOrCreatePuduRobot } from "./unknown-robot";
import { applyPuduTaskStatus } from "./task-status";
import { handleNotifyRobotPose, notifyRobotPoseSchema } from "./pose";
import { recordEvent } from "../../event/record-event";

export interface CallbackContext {
  tx: Prisma.TransactionClient;
  integrationLogId: string;
  occurredAt: Date; // waktu IntegrationLog diterima (fallback kalau payload tidak punya timestamp)
  data: unknown;
}

export type ParserFn = (ctx: CallbackContext) => Promise<void>;

// Field unlabeled "timestamp" di dokumentasi PUDU tidak menyebut satuan
// (beda dari "notify_timestamp" yang sudah dikonfirmasi milidetik) --
// diasumsikan epoch detik, mengikuti konvensi nama paling umum. Belum
// terverifikasi dengan data nyata (lihat laporan akhir, pertanyaan terbuka).
function toDate(value: string | number | undefined, unit: "s" | "ms" = "s"): Date | undefined {
  if (value === undefined) return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) return undefined;
  return new Date(unit === "s" ? num * 1000 : num);
}

type SharedStatusFields = Partial<{
  online: boolean;
  runState: string;
  moveState: string;
  chargeStage: string;
  isCharging: number;
  remainTime: number;
  battery: number;
}>;

// PuduRobotState di-upsert setiap callback status/pose; PuduRobotStatusLog
// cuma ditulis saat state benar-benar berubah (lihat ERD.md "siapa menulis
// apa") -- bukan setiap callback, supaya tidak membanjiri riwayat dengan
// baris identik.
async function upsertStateAndLogIfChanged(
  tx: Prisma.TransactionClient,
  puduRobotId: string,
  fields: SharedStatusFields,
  source: string,
  recordedAt: Date,
  integrationLogId: string | null,
  stateOnlyFields: Partial<{ chargeType: string }> = {},
) {
  const current = await tx.puduRobotState.findUnique({ where: { puduRobotId } });
  const currentRecord = current as unknown as Record<string, unknown> | null;
  const changed =
    !currentRecord ||
    Object.entries(fields).some(([key, value]) => value !== undefined && currentRecord[key] !== value);

  await tx.puduRobotState.upsert({
    where: { puduRobotId },
    create: { puduRobotId, ...fields, ...stateOnlyFields, vendorStatusAt: recordedAt },
    update: { ...fields, ...stateOnlyFields, vendorStatusAt: recordedAt },
  });

  if (changed) {
    await tx.puduRobotStatusLog.create({
      data: { puduRobotId, integrationLogId, source, recordedAt, ...fields },
    });
  }
}


// ---------------------------------------------------------------------------
// 1-3. robotBinding / robotUnBinding / robotActivate (#38-40)
// ---------------------------------------------------------------------------

const snWithTimestampSchema = z
  .object({ sn: z.string().min(1), timestamp: z.union([z.string(), z.number()]).optional() })
  .passthrough();

async function handleRobotBinding(ctx: CallbackContext) {
  const parsed = z
    .object({ sn: z.string().min(1), shop_id: z.union([z.string(), z.number()]), timestamp: z.union([z.string(), z.number()]).optional() })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);
  const shop = await ctx.tx.puduShop.upsert({
    where: { shopId: String(parsed.shop_id) },
    update: {},
    create: { shopId: String(parsed.shop_id) },
  });
  await ctx.tx.puduRobot.update({
    where: { puduRobotId: puduRobot.puduRobotId },
    data: {
      puduShopId: shop.puduShopId,
      bindingStatus: "BOUND",
      boundAt: toDate(parsed.timestamp) ?? ctx.occurredAt,
    },
  });
}

async function handleRobotUnBinding(ctx: CallbackContext) {
  const parsed = snWithTimestampSchema.parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);
  await ctx.tx.puduRobot.update({
    where: { puduRobotId: puduRobot.puduRobotId },
    data: { bindingStatus: "UNBOUND", unboundAt: toDate(parsed.timestamp) ?? ctx.occurredAt },
  });
}

async function handleRobotActivate(ctx: CallbackContext) {
  const parsed = snWithTimestampSchema.parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);
  await ctx.tx.puduRobot.update({
    where: { puduRobotId: puduRobot.puduRobotId },
    data: { activatedAt: toDate(parsed.timestamp) ?? ctx.occurredAt },
  });
}

// ---------------------------------------------------------------------------
// 4-6. robotStatus / notifyRobotStatus / notifyRobotPose (#15, #17, #19)
// ---------------------------------------------------------------------------

function coerceOnline(value: string | boolean | number): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  return value.toLowerCase() === "online" || value.toLowerCase() === "true" || value === "1";
}

async function handleRobotStatus(ctx: CallbackContext) {
  const parsed = z
    .object({
      sn: z.string().min(1),
      run_status: z.union([z.string(), z.boolean(), z.number()]),
      timestamp: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);
  const recordedAt = toDate(parsed.timestamp) ?? ctx.occurredAt;
  await upsertStateAndLogIfChanged(
    ctx.tx,
    puduRobot.puduRobotId,
    { online: coerceOnline(parsed.run_status) },
    "robotStatus",
    recordedAt,
    ctx.integrationLogId,
  );
}

async function handleNotifyRobotStatus(ctx: CallbackContext) {
  const parsed = z
    .object({
      sn: z.string().min(1),
      mac: z.string().optional(),
      battery: z.coerce.number().optional(),
      charge_stage: z.string().optional(),
      move_state: z.string().optional(),
      run_state: z.string().optional(),
      is_charging: z.coerce.number().optional(),
      remain_time: z.coerce.number().optional(),
      charge_type: z.string().optional(),
      notify_timestamp: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn, { mac: parsed.mac });
  const recordedAt = toDate(parsed.notify_timestamp, "ms") ?? ctx.occurredAt;
  await upsertStateAndLogIfChanged(
    ctx.tx,
    puduRobot.puduRobotId,
    {
      battery: parsed.battery,
      chargeStage: parsed.charge_stage,
      moveState: parsed.move_state,
      runState: parsed.run_state,
      isCharging: parsed.is_charging,
      remainTime: parsed.remain_time,
    },
    "notifyRobotStatus",
    recordedAt,
    ctx.integrationLogId,
    { chargeType: parsed.charge_type },
  );
}

async function handleNotifyRobotPoseInWorker(ctx: CallbackContext) {
  // Dalam alur normal, notifyRobotPose tidak pernah masuk antrean (lihat
  // Fase 1 / pose.ts) -- dispatch ini cuma jaring pengaman kalau suatu saat
  // ada baris PENDING bertipe ini.
  const parsed = notifyRobotPoseSchema.parse(ctx.data);
  await handleNotifyRobotPose(ctx.tx, parsed);
}

// ---------------------------------------------------------------------------
// 7-8. notifyCustomCall / notifyDeliveryTask (#21, #22)
// ---------------------------------------------------------------------------

async function handleNotifyCustomCall(ctx: CallbackContext) {
  const parsed = z
    .object({
      task_id: z.string().min(1),
      state: z.string().min(1),
      sn: z.string().min(1),
      queue: z.coerce.number().optional(),
      robot_response_code: z.string().optional(),
      message: z.string().optional(),
      point: z.string().optional(),
      point_type: z.string().optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);

  const puduTask = await ctx.tx.puduTask.upsert({
    where: { vendorTaskId: parsed.task_id },
    update: {
      status: parsed.state,
      queueNo: parsed.queue,
      robotResponseCode: parsed.robot_response_code,
      robotResponseMessage: parsed.message,
      targetPoint: parsed.point,
      pointType: parsed.point_type,
      lastNotifiedAt: ctx.occurredAt,
    },
    create: {
      puduRobotId: puduRobot.puduRobotId,
      vendorTaskId: parsed.task_id,
      taskKind: "CALL",
      status: parsed.state,
      queueNo: parsed.queue,
      robotResponseCode: parsed.robot_response_code,
      robotResponseMessage: parsed.message,
      targetPoint: parsed.point,
      pointType: parsed.point_type,
      lastNotifiedAt: ctx.occurredAt,
    },
  });

  await applyPuduTaskStatus(ctx.tx, {
    rawStatus: parsed.state,
    robotId: puduRobot.robotId,
    missionId: puduTask.missionId,
    integrationLogId: ctx.integrationLogId,
    occurredAt: ctx.occurredAt,
  });
}

const puduTaskStopSchema = z
  .object({
    destination: z.string().optional(),
    type: z.string().optional(),
    id: z.string().optional(),
    estimated_time: z.coerce.number().optional(),
    spend_time: z.coerce.number().optional(),
    status: z.string().optional(),
    timeout: z.coerce.boolean().optional(),
    complete_type: z.string().optional(),
  })
  .passthrough();

const traySchema = z.object({ destinations: z.array(puduTaskStopSchema).default([]) }).passthrough();

async function handleNotifyDeliveryTask(ctx: CallbackContext) {
  const parsed = z
    .object({
      task_id: z.string().min(1),
      task_status: z.string().min(1),
      sn: z.string().min(1),
      mac: z.string().optional(),
      delivery_mode: z.string().optional(),
      is_over_time: z.coerce.boolean().optional(),
      spent_time: z.coerce.number().optional(),
      trays: z.array(traySchema).default([]),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn, { mac: parsed.mac });

  const puduTask = await ctx.tx.puduTask.upsert({
    where: { vendorTaskId: parsed.task_id },
    update: {
      status: parsed.task_status,
      deliveryMode: parsed.delivery_mode,
      isOverTime: parsed.is_over_time,
      spentTime: parsed.spent_time,
      lastNotifiedAt: ctx.occurredAt,
    },
    create: {
      puduRobotId: puduRobot.puduRobotId,
      vendorTaskId: parsed.task_id,
      taskKind: "DELIVERY",
      status: parsed.task_status,
      deliveryMode: parsed.delivery_mode,
      isOverTime: parsed.is_over_time,
      spentTime: parsed.spent_time,
      lastNotifiedAt: ctx.occurredAt,
    },
  });

  let trayNo = 0;
  for (const tray of parsed.trays) {
    trayNo += 1;
    let seq = 0;
    for (const dest of tray.destinations) {
      seq += 1;
      const stopData = {
        pointName: dest.destination ?? "",
        destType: dest.type,
        vendorStopId: dest.id,
        estimatedTime: dest.estimated_time,
        spendTime: dest.spend_time,
        status: dest.status,
        isTimeout: dest.timeout,
        completeType: dest.complete_type,
      };
      await ctx.tx.puduTaskStop.upsert({
        where: { puduTaskId_trayNo_seq: { puduTaskId: puduTask.puduTaskId, trayNo, seq } },
        update: stopData,
        create: { puduTaskId: puduTask.puduTaskId, trayNo, seq, ...stopData },
      });
    }
  }

  await applyPuduTaskStatus(ctx.tx, {
    rawStatus: parsed.task_status,
    robotId: puduRobot.robotId,
    missionId: puduTask.missionId,
    integrationLogId: ctx.integrationLogId,
    occurredAt: ctx.occurredAt,
  });
}

// ---------------------------------------------------------------------------
// 9-10. robotErrorWarning / robotErrorNotice (#13, #14)
// ---------------------------------------------------------------------------

async function handleRobotErrorWarning(ctx: CallbackContext) {
  const parsed = z
    .object({
      sn: z.string().min(1),
      error_type: z.string().optional(),
      error_level: z.string().optional(),
      error_detail: z.string().optional(),
      error_id: z.string().optional(),
      timestamp: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);
  await recordEvent(ctx.tx, {
    eventType: "ROBOT_ERROR_WARNING",
    sourceType: "ROBOT",
    sourceId: puduRobot.robotId,
    severity: "WARNING",
    message: parsed.error_detail ?? "robotErrorWarning",
    errorCode: parsed.error_type,
    externalErrorId: parsed.error_id,
    externalLevel: parsed.error_level,
    integrationLogId: ctx.integrationLogId,
    occurredAt: toDate(parsed.timestamp) ?? ctx.occurredAt,
  });
}

async function handleRobotErrorNotice(ctx: CallbackContext) {
  const parsed = z
    .object({
      sn: z.string().min(1),
      error_type: z.string().optional(),
      error_level: z.string().optional(),
      error_detail: z.string().optional(),
      error_id: z.string().optional(),
      timestamp: z.union([z.string(), z.number()]).optional(),
      language: z.string().optional(),
      extend_info: z
        .object({
          task_id: z.string().optional(),
          battery: z.coerce.number().optional(),
          floor: z.string().optional(),
          mac: z.string().optional(),
          map_name: z.string().optional(),
          map_point: z.unknown().optional(),
          sn: z.string().optional(),
          task_type: z.string().optional(),
          position: z.unknown().optional(),
        })
        .passthrough()
        .optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn);

  // extend_info.task_id adalah vendorTaskId PUDU, bukan Task.taskId WCS --
  // ditelusuri lewat PuduTask -> Mission kalau ada, bukan dipetakan langsung.
  let taskId: string | null = null;
  const vendorTaskId = parsed.extend_info?.task_id;
  if (vendorTaskId) {
    const puduTask = await ctx.tx.puduTask.findUnique({
      where: { vendorTaskId },
      include: { mission: true },
    });
    taskId = puduTask?.mission?.taskId ?? null;
  }

  await recordEvent(ctx.tx, {
    eventType: "ROBOT_ERROR_NOTICE",
    sourceType: "ROBOT",
    sourceId: puduRobot.robotId,
    severity: "ERROR",
    message: parsed.error_detail ?? "robotErrorNotice",
    errorCode: parsed.error_type,
    externalErrorId: parsed.error_id,
    externalLevel: parsed.error_level,
    integrationLogId: ctx.integrationLogId,
    payload: { language: parsed.language, extend_info: parsed.extend_info } as Prisma.InputJsonValue,
    taskId,
    occurredAt: toDate(parsed.timestamp) ?? ctx.occurredAt,
  });
}

// ---------------------------------------------------------------------------
// 11-12. mapElementChange / notifySwitchMap (#18, #43)
// ---------------------------------------------------------------------------

async function handleMapElementChange(ctx: CallbackContext) {
  const parsed = z
    .object({
      map_name: z.string().min(1),
      shop_id: z.union([z.string(), z.number()]),
      timestamp: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const shop = await ctx.tx.puduShop.upsert({
    where: { shopId: String(parsed.shop_id) },
    update: {},
    create: { shopId: String(parsed.shop_id) },
  });
  const lastChangedAt = toDate(parsed.timestamp) ?? ctx.occurredAt;
  await ctx.tx.puduMap.upsert({
    where: { puduShopId_mapName: { puduShopId: shop.puduShopId, mapName: parsed.map_name } },
    update: { lastChangedAt },
    create: { puduShopId: shop.puduShopId, mapName: parsed.map_name, lastChangedAt },
  });
}

async function handleNotifySwitchMap(ctx: CallbackContext) {
  const parsed = z
    .object({
      sn: z.string().min(1),
      mac: z.string().optional(),
      task_id: z.string().min(1),
      task_status: z.string().min(1),
      remark: z.string().optional(),
      map_info: z.object({ map_name: z.string().optional() }).passthrough().optional(),
      notify_timestamp: z.union([z.string(), z.number()]).optional(),
    })
    .passthrough()
    .parse(ctx.data);
  const puduRobot = await resolveOrCreatePuduRobot(ctx.tx, parsed.sn, { mac: parsed.mac });

  let puduMapId: string | undefined;
  if (parsed.map_info?.map_name && puduRobot.puduShopId) {
    const map = await ctx.tx.puduMap.findUnique({
      where: { puduShopId_mapName: { puduShopId: puduRobot.puduShopId, mapName: parsed.map_info.map_name } },
    });
    puduMapId = map?.puduMapId;
  }

  const lastNotifiedAt = toDate(parsed.notify_timestamp, "ms") ?? ctx.occurredAt;
  const puduTask = await ctx.tx.puduTask.upsert({
    where: { vendorTaskId: parsed.task_id },
    update: { status: parsed.task_status, remark: parsed.remark, puduMapId, lastNotifiedAt },
    create: {
      puduRobotId: puduRobot.puduRobotId,
      vendorTaskId: parsed.task_id,
      taskKind: "SWITCH_MAP",
      status: parsed.task_status,
      remark: parsed.remark,
      puduMapId,
      lastNotifiedAt,
    },
  });

  await applyPuduTaskStatus(ctx.tx, {
    rawStatus: parsed.task_status,
    robotId: puduRobot.robotId,
    missionId: puduTask.missionId,
    integrationLogId: ctx.integrationLogId,
    occurredAt: ctx.occurredAt,
  });
}

// ---------------------------------------------------------------------------

export const parsers: Record<string, ParserFn> = {
  robotBinding: handleRobotBinding,
  robotUnBinding: handleRobotUnBinding,
  robotActivate: handleRobotActivate,
  robotStatus: handleRobotStatus,
  notifyRobotStatus: handleNotifyRobotStatus,
  notifyRobotPose: handleNotifyRobotPoseInWorker,
  notifyCustomCall: handleNotifyCustomCall,
  notifyDeliveryTask: handleNotifyDeliveryTask,
  robotErrorWarning: handleRobotErrorWarning,
  robotErrorNotice: handleRobotErrorNotice,
  mapElementChange: handleMapElementChange,
  notifySwitchMap: handleNotifySwitchMap,
};
