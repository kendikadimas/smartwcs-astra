import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture, createTaskFixture, createMissionFixture } from "@/test/fixtures";
import { startMockPuduServer } from "@/test/mock-pudu-server";
import { PuduClient } from "./client";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("reconcileStalledCallTasks", () => {
  let close: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await truncateAll(testDb!);
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function setupStalledTask(opts: { createdAt: Date; status: string }) {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "RECON-TEST-1" });
    const puduRobot = await testDb!.puduRobot.create({
      data: { robotId: robot.robotId, sn: "RECON-TEST-1", model: "T600", bindingStatus: "BOUND" },
    });
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "DISPATCHED",
    });
    const mission = await createMissionFixture(testDb!, { taskId: task.taskId, robotId: robot.robotId, status: "ACCEPTED" });
    const puduTask = await testDb!.puduTask.create({
      data: {
        missionId: mission.missionId,
        puduRobotId: puduRobot.puduRobotId,
        vendorTaskId: "vendor-recon-1",
        taskKind: "CALL",
        status: opts.status,
        createdAt: opts.createdAt,
      },
    });
    return { task, mission, puduTask };
  }

  it("task CALL basi: GetCallList dipanggil, status baru diterapkan lewat jalur yang sama dengan callback", async () => {
    const { task, mission } = await setupStalledTask({ createdAt: new Date(Date.now() - 10 * 60_000), status: "QUEUEING" });

    const server = await startMockPuduServer(() => ({
      status: 200,
      body: { message: "SUCCESS", data: { total: 1, list: [{ task_id: "vendor-recon-1", status: "CALL_COMPLETE" }] } },
    }));
    close = server.close;

    process.env.PUDU_TASK_RECONCILE_CHECK_AFTER_MS = "1";
    process.env.PUDU_TASK_RECONCILE_TIMEOUT_MS = "999999999"; // jauh, supaya tidak ikut ditandai timeout di test ini

    vi.resetModules();
    const { reconcileStalledCallTasks } = await import("./reconcile");
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await reconcileStalledCallTasks(testDb!, client);

    expect(result.checked).toBe(1);
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedTask.status).toBe("COMPLETED"); // CALL_COMPLETE -> COMPLETED (status-map.ts)
    const updatedMission = await testDb!.mission.findUniqueOrThrow({ where: { missionId: mission.missionId } });
    expect(updatedMission.status).toBe("COMPLETED");
  });

  it("task CALL basi DAN lewat batas timeout, masih belum final -> WCS menandai FAILED/TASK_TIMEOUT sendiri", async () => {
    const { task } = await setupStalledTask({ createdAt: new Date(Date.now() - 40 * 60_000), status: "QUEUEING" });

    // GetCallList tidak menemukan task ini lagi (atau statusnya tetap belum final)
    const server = await startMockPuduServer(() => ({
      status: 200,
      body: { message: "SUCCESS", data: { total: 0, list: [] } },
    }));
    close = server.close;

    process.env.PUDU_TASK_RECONCILE_CHECK_AFTER_MS = "1";
    process.env.PUDU_TASK_RECONCILE_TIMEOUT_MS = "1"; // apa pun yang basi otomatis lewat batas timeout juga

    vi.resetModules();
    const { reconcileStalledCallTasks } = await import("./reconcile");
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await reconcileStalledCallTasks(testDb!, client);

    expect(result.timedOut).toBe(1);
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedTask.status).toBe("FAILED");
    expect(updatedTask.failureCode).toBe("TASK_TIMEOUT");
  });

  it("task yang sudah final (CALL_COMPLETE) tidak ikut direkonsiliasi", async () => {
    await setupStalledTask({ createdAt: new Date(Date.now() - 60 * 60_000), status: "CALL_COMPLETE" });

    let calls = 0;
    const server = await startMockPuduServer(() => {
      calls += 1;
      return { status: 200, body: { message: "SUCCESS", data: { total: 0, list: [] } } };
    });
    close = server.close;

    process.env.PUDU_TASK_RECONCILE_CHECK_AFTER_MS = "1";
    process.env.PUDU_TASK_RECONCILE_TIMEOUT_MS = "1";

    vi.resetModules();
    const { reconcileStalledCallTasks } = await import("./reconcile");
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await reconcileStalledCallTasks(testDb!, client);
    expect(result.checked).toBe(0);
    expect(calls).toBe(0);
  });
});
