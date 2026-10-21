import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import type { Prisma } from "@/generated/prisma/client";
import { seedPuduIntegration } from "./integration";
import { processPendingLogs, computeBackoffMs } from "./worker-core";

const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("worker PUDU: processPendingLogs", () => {
  let integrationId: string;

  beforeEach(async () => {
    await truncateAll(testDb!);
    const integration = await seedPuduIntegration(testDb!);
    integrationId = integration.integrationId;
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function enqueue(callbackType: string, data: Record<string, unknown>, traceId?: string) {
    return testDb!.integrationLog.create({
      data: {
        integrationId,
        direction: "INBOUND",
        status: "PENDING",
        traceId: traceId ?? `trace-${callbackType}-${Math.random().toString(36).slice(2)}`,
        messageType: callbackType,
        payload: { callback_type: callbackType, data } as Prisma.InputJsonValue,
        callbackCodeValid: true,
        occurredAt: new Date(),
      },
    });
  }

  async function run(batchSize = 1) {
    return processPendingLogs(testDb!, { integrationId, maxAttempts: 5, batchSize });
  }

  // Data di bawah ini SINTETIS (dibuat dari field di Lampiran
  // PUDU_INTEGRATION.md), bukan payload asli PUDU -- belum ada akun/robot
  // nyata untuk mengambil contoh sungguhan.

  it("robotBinding: membuat PuduRobot baru dan mem-bind ke PuduShop", async () => {
    await enqueue("robotBinding", { sn: "SYN0001", shop_id: "1001", timestamp: 1700000000 });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const puduRobot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SYN0001" } });
    expect(puduRobot.bindingStatus).toBe("BOUND");
    expect(puduRobot.boundAt).not.toBeNull();
    const shop = await testDb!.puduShop.findUniqueOrThrow({ where: { shopId: "1001" } });
    expect(puduRobot.puduShopId).toBe(shop.puduShopId);
  });

  it("robotUnBinding: menandai UNBOUND", async () => {
    await enqueue("robotBinding", { sn: "SYN0002", shop_id: "1001" });
    await run();
    await enqueue("robotUnBinding", { sn: "SYN0002", timestamp: 1700000100 });
    await run();

    const puduRobot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SYN0002" } });
    expect(puduRobot.bindingStatus).toBe("UNBOUND");
    expect(puduRobot.unboundAt).not.toBeNull();
  });

  it("robotActivate: mengisi activatedAt, auto-membuat robot generik kalau sn belum ada", async () => {
    await enqueue("robotActivate", { sn: "SYN0003", timestamp: 1700000200 });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const puduRobot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SYN0003" } });
    expect(puduRobot.activatedAt).not.toBeNull();
    const robot = await testDb!.robot.findUniqueOrThrow({ where: { robotId: puduRobot.robotId } });
    expect(robot.serialNumber).toBe("SYN0003");
  });

  it("robotStatus: online/offline di-upsert ke PuduRobotState dan ditulis ke StatusLog", async () => {
    await enqueue("robotStatus", { sn: "SYN0004", run_status: "online", timestamp: 1700000300 });
    await run();

    const state = await testDb!.puduRobot
      .findUniqueOrThrow({ where: { sn: "SYN0004" } })
      .then((r) => testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: r.puduRobotId } }));
    expect(state.online).toBe(true);
  });

  it("notifyRobotStatus: battery/charge/run_state di-upsert, StatusLog cuma ditulis saat berubah", async () => {
    await enqueue("notifyRobotStatus", {
      sn: "SYN0005",
      battery: 80,
      charge_stage: "NONE",
      move_state: "IDLE",
      run_state: "IDLE",
      is_charging: -1,
      remain_time: 0,
      charge_type: "NONE",
      notify_timestamp: 1700000400000,
    });
    await run();
    // Callback identik kedua -- tidak boleh menambah baris StatusLog baru.
    await enqueue("notifyRobotStatus", {
      sn: "SYN0005",
      battery: 80,
      charge_stage: "NONE",
      move_state: "IDLE",
      run_state: "IDLE",
      is_charging: -1,
      remain_time: 0,
      charge_type: "NONE",
      notify_timestamp: 1700000400001,
    });
    await run();

    const puduRobot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SYN0005" } });
    const logs = await testDb!.puduRobotStatusLog.findMany({ where: { puduRobotId: puduRobot.puduRobotId } });
    expect(logs).toHaveLength(1);
  });

  it("notifyCustomCall: upsert PuduTask + pemetaan status ke Mission/Task kalau ada", async () => {
    await enqueue("notifyCustomCall", {
      task_id: "SYNTASK1",
      state: "CALLING",
      sn: "SYN0006",
      queue: 1,
      robot_response_code: "0",
      message: "ok",
      point: "P1",
      point_type: "normal",
    });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "SYNTASK1" } });
    expect(task.status).toBe("CALLING");
    expect(task.taskKind).toBe("CALL");
  });

  it("notifyDeliveryTask: upsert PuduTask + PuduTaskStop per destinasi", async () => {
    await enqueue("notifyDeliveryTask", {
      task_id: "SYNTASK2",
      task_status: "COMPLETE",
      sn: "SYN0007",
      mac: "AA:BB:CC",
      delivery_mode: "normal",
      is_over_time: false,
      spent_time: 100,
      trays: [
        {
          destinations: [
            {
              destination: "P1",
              type: "REMOTE",
              id: "D1",
              estimated_time: 60000,
              spend_time: 80000,
              status: "COMPLETED",
              timeout: false,
              complete_type: "NORMAL",
            },
          ],
        },
      ],
    });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "SYNTASK2" } });
    const stops = await testDb!.puduTaskStop.findMany({ where: { puduTaskId: task.puduTaskId } });
    expect(stops).toHaveLength(1);
    expect(stops[0].pointName).toBe("P1");
  });

  it("robotErrorWarning: mencatat Event WARNING, dedup lewat externalErrorId", async () => {
    await enqueue("robotErrorWarning", {
      sn: "SYN0008",
      error_type: "E001",
      error_level: "WARNING",
      error_detail: "battery low",
      error_id: "ERR-W-1",
      timestamp: 1700000600,
    });
    await run();
    await enqueue("robotErrorWarning", {
      sn: "SYN0008",
      error_type: "E001",
      error_level: "WARNING",
      error_detail: "battery low (retry)",
      error_id: "ERR-W-1",
      timestamp: 1700000601,
    });
    await run();

    const events = await testDb!.event.findMany({ where: { externalErrorId: "ERR-W-1" } });
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe("WARNING");
  });

  it("robotErrorNotice: mencatat Event ERROR dengan payload extend_info", async () => {
    await enqueue("robotErrorNotice", {
      sn: "SYN0009",
      error_type: "E002",
      error_level: "ERROR",
      error_detail: "collision",
      error_id: "ERR-N-1",
      timestamp: 1700000700,
      language: "en",
      extend_info: { battery: 50 },
    });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const events = await testDb!.event.findMany({ where: { externalErrorId: "ERR-N-1" } });
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe("ERROR");
  });

  it("mapElementChange: upsert PuduShop + PuduMap, set lastChangedAt", async () => {
    await enqueue("mapElementChange", { map_name: "1#1#Lantai1", shop_id: "1001", timestamp: 1700000800 });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const shop = await testDb!.puduShop.findUniqueOrThrow({ where: { shopId: "1001" } });
    const map = await testDb!.puduMap.findUniqueOrThrow({
      where: { puduShopId_mapName: { puduShopId: shop.puduShopId, mapName: "1#1#Lantai1" } },
    });
    expect(map.lastChangedAt).not.toBeNull();
  });

  it("notifySwitchMap: upsert PuduTask kind SWITCH_MAP, taut ke PuduMap kalau sudah dikenal", async () => {
    await enqueue("mapElementChange", { map_name: "1#1#Lantai1", shop_id: "1002" });
    await run();
    await enqueue("robotBinding", { sn: "SYN0010", shop_id: "1002" });
    await run();
    await enqueue("notifySwitchMap", {
      sn: "SYN0010",
      task_id: "SYNTASK3",
      task_status: "COMPLETE",
      remark: "ok",
      map_info: { map_name: "1#1#Lantai1" },
      notify_timestamp: 1700000900000,
    });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "SYNTASK3" } });
    expect(task.taskKind).toBe("SWITCH_MAP");
    expect(task.puduMapId).not.toBeNull();
  });

  it("notifyRobotPose sebagai jaring pengaman: tidak error walau sn belum dikenal (biasanya ditangani Fase 1, tidak lewat antrean)", async () => {
    await enqueue("notifyRobotPose", { sn: "SYN0011-BELUM-ADA", x: 1, y: 2, notify_timestamp: 1700001000000 });
    const result = await run();

    expect(result.succeeded).toBe(1);
    const poseCount = await testDb!.puduPoseLog.count();
    expect(poseCount).toBe(0);
  });

  it("idempoten: payload identik untuk callback_type yang sama (upsert) tidak menduplikasi PuduRobot/PuduShop", async () => {
    await enqueue("robotBinding", { sn: "SYN0012", shop_id: "1003" });
    await run();
    await enqueue("robotBinding", { sn: "SYN0012", shop_id: "1003" });
    await run();

    const robots = await testDb!.puduRobot.findMany({ where: { sn: "SYN0012" } });
    const shops = await testDb!.puduShop.findMany({ where: { shopId: "1003" } });
    expect(robots).toHaveLength(1);
    expect(shops).toHaveLength(1);
  });

  it("retry: callback_type tanpa parser ditandai FAILED dengan attempts bertambah dan nextAttemptAt di masa depan", async () => {
    const log = await enqueue("tidakAdaParserUntukIni", { apa: "saja" });
    const before = Date.now();
    const result = await run();

    expect(result.failed).toBe(1);
    const updated = await testDb!.integrationLog.findUniqueOrThrow({ where: { logId: log.logId } });
    expect(updated.status).toBe("FAILED");
    expect(updated.attempts).toBe(1);
    expect(updated.errorMessage).toContain("Tidak ada parser");
    expect(updated.nextAttemptAt!.getTime()).toBeGreaterThan(before);
  });

  it("FAILED tidak diproses ulang sebelum nextAttemptAt", async () => {
    await enqueue("tidakAdaParserUntukIni", { apa: "saja" });
    await run();
    const result = await run();
    expect(result.processed).toBe(0);
  });

  it("berhenti retry setelah maxAttempts tercapai", async () => {
    const log = await enqueue("tidakAdaParserUntukIni", { apa: "saja" });
    for (let i = 0; i < 5; i++) {
      await testDb!.integrationLog.update({
        where: { logId: log.logId },
        data: { nextAttemptAt: new Date(Date.now() - 1000) },
      });
      await processPendingLogs(testDb!, { integrationId, maxAttempts: 3, batchSize: 1 });
    }
    const updated = await testDb!.integrationLog.findUniqueOrThrow({ where: { logId: log.logId } });
    expect(updated.attempts).toBe(3);

    await testDb!.integrationLog.update({
      where: { logId: log.logId },
      data: { nextAttemptAt: new Date(Date.now() - 1000) },
    });
    const result = await processPendingLogs(testDb!, { integrationId, maxAttempts: 3, batchSize: 1 });
    expect(result.processed).toBe(0);
  });

  it("dua worker berjalan bersamaan tidak memproses baris yang sama (FOR UPDATE SKIP LOCKED)", async () => {
    await enqueue("robotBinding", { sn: "SYN0013", shop_id: "1004" });

    const [a, b] = await Promise.all([
      processPendingLogs(testDb!, { integrationId, maxAttempts: 5, batchSize: 1 }),
      processPendingLogs(testDb!, { integrationId, maxAttempts: 5, batchSize: 1 }),
    ]);

    expect(a.processed + b.processed).toBe(1);
    const robots = await testDb!.puduRobot.findMany({ where: { sn: "SYN0013" } });
    expect(robots).toHaveLength(1);
  });
});

describe("computeBackoffMs", () => {
  it("naik eksponensial dan dibatasi maksimum", () => {
    expect(computeBackoffMs(1)).toBe(5_000);
    expect(computeBackoffMs(2)).toBe(10_000);
    expect(computeBackoffMs(3)).toBe(20_000);
    expect(computeBackoffMs(20)).toBe(10 * 60_000);
  });
});
