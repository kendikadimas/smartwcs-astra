import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture, createTaskFixture, createMissionFixture } from "@/test/fixtures";
import { startMockPuduServer } from "@/test/mock-pudu-server";

// Fase C: dispatch() CALL harus menolak robot OFFLINE/DISABLE sebelum
// memanggil PUDU, tetap mengirim untuk BUSY, me-resolve map_name/point_type
// dari PuduMapElement (bukan string bebas), dan memetakan error bisnis PUDU
// ke failureCode WCS yang sudah ada (DispatchRejectedError).

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("pudu dispatch() -- run_state dan resolusi peta", () => {
  let close: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await truncateAll(testDb!);
    process.env = { ...ORIGINAL_ENV };
    process.env.PUDU_API_APP_KEY = "dummy-key";
    process.env.PUDU_API_APP_SECRET = "dummy-secret";
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function setupRobotWithMap(opts: { runState: string | null; withMapElement?: boolean; pointType?: string | null }) {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "DISPATCH-TEST-1" });
    const puduRobot = await testDb!.puduRobot.create({
      data: { robotId: robot.robotId, sn: "DISPATCH-TEST-1", model: "T600", bindingStatus: "BOUND" },
    });
    const shop = await testDb!.puduShop.create({ data: { shopId: "dispatch-test-shop" } });
    const map = await testDb!.puduMap.create({ data: { puduShopId: shop.puduShopId, mapName: "dispatch-test-map" } });
    if (opts.withMapElement !== false) {
      await testDb!.puduMapElement.create({
        data: {
          puduMapId: map.puduMapId,
          vendorElementId: "P1",
          name: "P1",
          elementType: "point",
          pointType: opts.pointType === undefined ? "table" : opts.pointType,
        },
      });
    }
    await testDb!.puduRobotState.create({
      data: { puduRobotId: puduRobot.puduRobotId, runState: opts.runState, currentPuduMapId: map.puduMapId },
    });
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
    });
    const mission = await createMissionFixture(testDb!, { taskId: task.taskId, robotId: robot.robotId });
    return { robotId: robot.robotId, missionId: mission.missionId, mapName: map.mapName };
  }

  it.each(["OFFLINE", "DISABLE"])("run_state=%s ditolak SEBELUM memanggil PUDU (failureCode NO_RESOURCE_AVAILABLE)", async (runState) => {
    const { robotId, missionId } = await setupRobotWithMap({ runState });
    let calledPudu = false;
    const server = await startMockPuduServer(() => {
      calledPudu = true;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    const { DispatchRejectedError } = await import("./error-map");

    const err = await puduAdapter
      .dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(DispatchRejectedError);
    expect((err as InstanceType<typeof DispatchRejectedError>).failureCode).toBe("NO_RESOURCE_AVAILABLE");
    expect(calledPudu).toBe(false); // tidak pernah sampai memanggil PUDU
  });

  it("run_state=BUSY tetap mengirim ke PUDU (PUDU yang mengantre)", async () => {
    const { robotId, missionId } = await setupRobotWithMap({ runState: "BUSY" });
    let calledPudu = false;
    const server = await startMockPuduServer(() => {
      calledPudu = true;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", queue: 2, state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");

    const result = await puduAdapter.dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1" });

    expect(calledPudu).toBe(true);
    expect(result.externalTaskId).toBe("x");
  });

  it("titik tidak ditemukan di peta aktif -> DispatchRejectedError, tidak memanggil PUDU", async () => {
    const { robotId, missionId } = await setupRobotWithMap({ runState: "IDLE", withMapElement: false });
    let calledPudu = false;
    const server = await startMockPuduServer(() => {
      calledPudu = true;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    const { DispatchRejectedError } = await import("./error-map");

    const err = await puduAdapter
      .dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "TITIK-TIDAK-ADA" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(DispatchRejectedError);
    expect(calledPudu).toBe(false);
  });

  it("mengirim map_name dan point_type hasil resolusi PuduMapElement (bukan string kosong/bebas)", async () => {
    const { robotId, missionId, mapName } = await setupRobotWithMap({ runState: "IDLE" });
    let receivedBody: unknown;
    const server = await startMockPuduServer((req) => {
      receivedBody = req.body;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    await puduAdapter.dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1" });

    expect(receivedBody).toMatchObject({ map_name: mapName, point: "P1", point_type: "table" });
  });

  it("PUDU membalas error bisnis (CLOUD_OPEN_ROBOT_OFFLINE) -> DispatchRejectedError failureCode NO_RESOURCE_AVAILABLE", async () => {
    const { robotId, missionId } = await setupRobotWithMap({ runState: "IDLE" });
    const server = await startMockPuduServer(() => ({ status: 200, body: { message: "CLOUD_OPEN_ROBOT_OFFLINE" } }));
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    const { DispatchRejectedError } = await import("./error-map");

    const err = await puduAdapter
      .dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(DispatchRejectedError);
    expect((err as InstanceType<typeof DispatchRejectedError>).failureCode).toBe("NO_RESOURCE_AVAILABLE");
    expect((err as InstanceType<typeof DispatchRejectedError>).puduCode).toBe("CLOUD_OPEN_ROBOT_OFFLINE");
  });

  it("priority di luar rentang 1-5 tidak dikirim (PUDU memakai default)", async () => {
    const { robotId, missionId } = await setupRobotWithMap({ runState: "IDLE" });
    let receivedBody: unknown;
    const server = await startMockPuduServer((req) => {
      receivedBody = req.body;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    await puduAdapter.dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1", priority: 99 });

    expect((receivedBody as { priority?: number }).priority).toBeUndefined();
  });

  // Fase D: point_type WAJIB (PUDU_OFFICIAL_EXCERPT.md InitiateCallTask) --
  // jangan kirim string kosong untuk field wajib.
  it.each([null, ""])("titik dengan pointType %p (kosong/null) ditolak TANPA memanggil jaringan", async (pointType) => {
    const { robotId, missionId } = await setupRobotWithMap({ runState: "IDLE", pointType });
    let calledPudu = false;
    const server = await startMockPuduServer(() => {
      calledPudu = true;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    const { DispatchRejectedError } = await import("./error-map");

    const err = await puduAdapter
      .dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1" })
      .catch((e) => e);

    expect(err).toBeInstanceOf(DispatchRejectedError);
    expect((err as InstanceType<typeof DispatchRejectedError>).failureCode).toBe("NO_RESOURCE_AVAILABLE");
    expect(calledPudu).toBe(false);
  });

  it("titik dengan pointType terisi dikirim apa adanya (bukan ditebak/diterjemahkan)", async () => {
    const { robotId, missionId } = await setupRobotWithMap({ runState: "IDLE", pointType: "ChargePile" });
    let receivedBody: unknown;
    const server = await startMockPuduServer((req) => {
      receivedBody = req.body;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "x", state: "QUEUEING" } } };
    });
    close = server.close;
    process.env.PUDU_BASE_URL = server.url;

    vi.resetModules();
    const { puduAdapter } = await import("./index");
    await puduAdapter.dispatch(testDb!, { robotId, missionId, kind: "CALL", targetPoint: "P1" });

    expect((receivedBody as { point_type?: string }).point_type).toBe("ChargePile");
  });
});
