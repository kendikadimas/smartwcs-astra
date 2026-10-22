import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture } from "@/test/fixtures";
import { puduAdapter } from "./index";

import robotErrorWarning from "@/test/fixtures/pudu-official/robotErrorWarning.json";
import robotErrorNotice from "@/test/fixtures/pudu-official/robotErrorNotice.json";
import robotBinding from "@/test/fixtures/pudu-official/robotBinding.json";
import robotUnBinding from "@/test/fixtures/pudu-official/robotUnBinding.json";
import robotActivate from "@/test/fixtures/pudu-official/robotActivate.json";
import robotStatus from "@/test/fixtures/pudu-official/robotStatus.json";
import robotEmergencyRecover from "@/test/fixtures/pudu-official/robotEmergencyRecover.json";
import notifyRobotStatus from "@/test/fixtures/pudu-official/notifyRobotStatus.json";
import mapElementChange from "@/test/fixtures/pudu-official/mapElementChange.json";
import notifyRobotPose from "@/test/fixtures/pudu-official/notifyRobotPose.json";
import notifyRobotMoveState from "@/test/fixtures/pudu-official/notifyRobotMoveState.json";
import notifySwitchMap from "@/test/fixtures/pudu-official/notifySwitchMap.json";
import notifyCustomCall from "@/test/fixtures/pudu-official/notifyCustomCall.json";
import notifyDeliveryTask from "@/test/fixtures/pudu-official/notifyDeliveryTask.json";
import notifyRobotPower from "@/test/fixtures/pudu-official/notifyRobotPower.json";
import notifyRechargeStatus from "@/test/fixtures/pudu-official/notifyRechargeStatus.json";

const testDb = hasTestDatabase() ? createTestDb() : null;

// Fase E.2: setiap contoh callback resmi (src/test/fixtures/pudu-official/)
// melewati handleInbound (kind "queued", jalur yang sama dipakai
// worker-core.ts) dan harus menghasilkan efek yang diharapkan.
async function dispatchFixture(fixture: { callback_type: string; data: unknown }) {
  return puduAdapter.handleInbound(testDb!, {
    kind: "queued",
    messageType: fixture.callback_type,
    data: fixture.data,
    integrationLogId: null,
    occurredAt: new Date(),
  });
}

describe.skipIf(!hasTestDatabase())("fixture callback resmi PUDU", () => {
  beforeEach(async () => {
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("robotErrorWarning.json -> Event WARNING, errorCode=LostLocalization", async () => {
    const result = await dispatchFixture(robotErrorWarning);
    expect(result.kind).toBe("processed");
    const events = await testDb!.event.findMany({ where: { eventType: "ROBOT_ERROR_WARNING" } });
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe("WARNING");
    expect(events[0].errorCode).toBe("LostLocalization");
  });

  it("robotErrorNotice.json -> Event ERROR, errorCode=EmergencyStop, payload.extend_info tersimpan", async () => {
    await dispatchFixture(robotErrorNotice);
    const events = await testDb!.event.findMany({ where: { eventType: "ROBOT_ERROR_NOTICE" } });
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe("ERROR");
    expect(events[0].errorCode).toBe("EmergencyStop");
    expect((events[0].payload as { extend_info: { battery: number } }).extend_info.battery).toBe(58);
  });

  it("robotBinding.json -> PuduRobot dibuat dan di-bind ke PuduShop", async () => {
    await dispatchFixture(robotBinding);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SV10111...." } });
    expect(robot.bindingStatus).toBe("BOUND");
    const shop = await testDb!.puduShop.findUniqueOrThrow({ where: { shopId: "1001" } });
    expect(robot.puduShopId).toBe(shop.puduShopId);
  });

  it("robotUnBinding.json -> bindingStatus UNBOUND", async () => {
    await dispatchFixture(robotBinding); // bind dulu
    await dispatchFixture(robotUnBinding);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SV10111...." } });
    expect(robot.bindingStatus).toBe("UNBOUND");
  });

  it("robotActivate.json -> activatedAt terisi", async () => {
    await dispatchFixture(robotActivate);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SV10111...." } });
    expect(robot.activatedAt).not.toBeNull();
  });

  it("robotStatus.json -> PuduRobotState.online = true", async () => {
    await dispatchFixture(robotStatus);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SV10111...." } });
    const state = await testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: robot.puduRobotId } });
    expect(state.online).toBe(true);
  });

  it("robotEmergencyRecover.json -> emergencyRecoveredAt terisi (fixture resmi yang BENAR, bukan notifyRobotStatus yang mislabel)", async () => {
    await dispatchFixture(robotEmergencyRecover);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "OP21321dsffsd" } });
    const state = await testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: robot.puduRobotId } });
    expect(state.emergencyRecoveredAt).not.toBeNull();
  });

  it("robotEmergencyRecover: menutup Alarm ACTIVE yang terkait (errorCode EmergencyStop) kalau ada", async () => {
    await dispatchFixture(robotErrorNotice); // bikin Event errorCode EmergencyStop untuk sn yang sama
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "826004C17060045" } });
    const event = await testDb!.event.findFirstOrThrow({ where: { errorCode: "EmergencyStop" } });
    const alarm = await testDb!.alarm.create({ data: { eventId: event.eventId, status: "ACTIVE" } });

    await dispatchFixture({ callback_type: "robotEmergencyRecover", data: { sn: "826004C17060045", timestamp: 1764325700 } });

    const updatedAlarm = await testDb!.alarm.findUniqueOrThrow({ where: { alarmId: alarm.alarmId } });
    expect(updatedAlarm.status).toBe("CLEARED");
    expect(updatedAlarm.clearedAt).not.toBeNull();
    void robot;
  });

  it("notifyRobotStatus.json (callback_type diperbaiki, lihat fixtures README) -> battery/charge_stage/run_state/chargeType ter-upsert", async () => {
    await dispatchFixture(notifyRobotStatus);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "SN-PD202405000001" } });
    const state = await testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: robot.puduRobotId } });
    expect(state.battery).toBe(85);
    expect(state.runState).toBe("IDLE");
    expect(state.chargeType).toBe("2"); // int32 resmi (2=dock), dikonversi ke string untuk kolom yang ada
    expect(state.isCharging).toBe(-1);
  });

  it("mapElementChange.json -> PuduShop + PuduMap diupsert, lastChangedAt terisi", async () => {
    await dispatchFixture(mapElementChange);
    const shop = await testDb!.puduShop.findUniqueOrThrow({ where: { shopId: "1001" } });
    const map = await testDb!.puduMap.findUniqueOrThrow({
      where: { puduShopId_mapName: { puduShopId: shop.puduShopId, mapName: "map123" } },
    });
    expect(map.lastChangedAt).not.toBeNull();
  });

  it("notifyRobotPose.json -> PuduPoseLog + PuduRobotState terisi (robot harus sudah dikenal)", async () => {
    const location = await createLocationFixture(testDb!);
    const robotCore = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "OP21321dsffsd" });
    const puduRobot = await testDb!.puduRobot.create({
      data: { robotId: robotCore.robotId, sn: "OP21321dsffsd", model: "T600", bindingStatus: "BOUND" },
    });
    // PuduPoseLog dipartisi per bulan; partisi test DB cuma dibuat untuk
    // bulan-bulan sekitar "sekarang" (lihat prisma/sql), bukan sampai
    // 2025-11 (waktu asli contoh resmi notify_timestamp). notify_timestamp
    // di override ke sekarang HANYA untuk lolos partisi -- semua field lain
    // (x/y/yaw/nearest_point/sn/mac) tetap dari fixture resmi apa adanya.
    const fixtureNow = { ...notifyRobotPose, data: { ...notifyRobotPose.data, notify_timestamp: Date.now(), timestamp: Math.floor(Date.now() / 1000) } };
    const result = await dispatchFixture(fixtureNow);
    expect(result.kind).toBe("processed");
    const state = await testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: puduRobot.puduRobotId } });
    expect(Number(state.x)).toBeCloseTo(1.234);
    const logs = await testDb!.puduPoseLog.findMany({ where: { puduRobotId: puduRobot.puduRobotId } });
    expect(logs).toHaveLength(1);
  });

  it("notifyRobotMoveState.json -> PuduRobotState.moveState = IDLE", async () => {
    await dispatchFixture(notifyRobotMoveState);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "OP21321dsffsd" } });
    const state = await testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: robot.puduRobotId } });
    expect(state.moveState).toBe("IDLE");
  });

  it("notifySwitchMap.json -> PuduTask kind SWITCH_MAP tercatat, status mentah tersimpan", async () => {
    await dispatchFixture(notifySwitchMap);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "1760624617357856" } });
    expect(task.taskKind).toBe("SWITCH_MAP");
    expect(task.status).toBe("COMPLETE");
  });

  it("notifyCustomCall.json -> PuduTask kind CALL tercatat, robot_response_code/message terbaca", async () => {
    await dispatchFixture(notifyCustomCall);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "123" } });
    expect(task.taskKind).toBe("CALL");
    expect(task.status).toBe("QUEUING");
    expect(task.robotResponseCode).toBe("0"); // int32 resmi dikonversi ke string untuk kolom yang ada
  });

  it("notifyDeliveryTask.json -> PuduTask kind DELIVERY + 3 PuduTaskStop (satu per tray)", async () => {
    await dispatchFixture(notifyDeliveryTask);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "111111111" } });
    expect(task.taskKind).toBe("DELIVERY");
    expect(task.status).toBe("ON_THE_WAY");
    const stops = await testDb!.puduTaskStop.findMany({ where: { puduTaskId: task.puduTaskId } });
    expect(stops).toHaveLength(3);
  });

  it("notifyRobotPower.json -> battery=99 (dari power), chargeStage=IDLE", async () => {
    await dispatchFixture(notifyRobotPower);
    const robot = await testDb!.puduRobot.findUniqueOrThrow({ where: { sn: "TS1732946965085" } });
    const state = await testDb!.puduRobotState.findUniqueOrThrow({ where: { puduRobotId: robot.puduRobotId } });
    expect(state.battery).toBe(99);
    expect(state.chargeStage).toBe("IDLE");
  });

  it("notifyRechargeStatus.json -> PuduTask kind RECHARGE, status mentah tersimpan (taskKind OTHER -> Task.status WCS tidak ikut berubah)", async () => {
    await dispatchFixture(notifyRechargeStatus);
    const task = await testDb!.puduTask.findUniqueOrThrow({ where: { vendorTaskId: "07058bab9ef84625bcfc55d442c5766b" } });
    expect(task.taskKind).toBe("RECHARGE");
    expect(task.status).toBe("COMPLETE");
  });
});
