import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture } from "@/test/fixtures";
import { startMockPuduServer } from "@/test/mock-pudu-server";
import { PuduClient } from "./client";
import { refreshPoseReporting } from "./pose-report";

const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("refreshPoseReporting", () => {
  let close: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await truncateAll(testDb!);
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function setupRobot(opts: { online: boolean | null; poseReportStartedAt?: Date | null }) {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "POSE-TEST-1" });
    const puduRobot = await testDb!.puduRobot.create({
      data: { robotId: robot.robotId, sn: "POSE-TEST-1", model: "T600", bindingStatus: "BOUND" },
    });
    await testDb!.puduRobotState.create({
      data: { puduRobotId: puduRobot.puduRobotId, online: opts.online, poseReportStartedAt: opts.poseReportStartedAt },
    });
    return puduRobot;
  }

  it("memanggil NotifyRobotReportPosition untuk robot online yang belum pernah diminta lapor posisi", async () => {
    await setupRobot({ online: true, poseReportStartedAt: null });
    let receivedBody: unknown;
    const server = await startMockPuduServer((req) => {
      receivedBody = req.body;
      return { status: 200, body: { message: "SUCCESS" } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await refreshPoseReporting(testDb!, client);

    expect(result.refreshed).toBe(1);
    expect(receivedBody).toMatchObject({ sn: "POSE-TEST-1" });
    const state = await testDb!.puduRobotState.findFirst();
    expect(state?.poseReportStartedAt).not.toBeNull();
  });

  it("tidak memanggil robot offline", async () => {
    await setupRobot({ online: false });
    let calls = 0;
    const server = await startMockPuduServer(() => {
      calls += 1;
      return { status: 200, body: { message: "SUCCESS" } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await refreshPoseReporting(testDb!, client);
    expect(result.refreshed).toBe(0);
    expect(calls).toBe(0);
  });

  it("tidak memanggil ulang robot yang baru saja diminta lapor posisi (belum basi)", async () => {
    await setupRobot({ online: true, poseReportStartedAt: new Date() });
    let calls = 0;
    const server = await startMockPuduServer(() => {
      calls += 1;
      return { status: 200, body: { message: "SUCCESS" } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await refreshPoseReporting(testDb!, client);
    expect(result.refreshed).toBe(0);
    expect(calls).toBe(0);
  });
});
