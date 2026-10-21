import { beforeEach } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture, createTaskFixture, createMissionFixture } from "@/test/fixtures";
import { runAdapterContractTests } from "../contract.test-suite";
import { fakeAdapter, resetFakeAdapterState } from "./index";

const testDb = hasTestDatabase() ? createTestDb() : null;

beforeEach(async () => {
  if (!hasTestDatabase()) return;
  resetFakeAdapterState();
  await truncateAll(testDb!);
});

runAdapterContractTests({
  name: "fake",
  skip: !hasTestDatabase(),
  db: testDb!,
  getAdapter: () => fakeAdapter,
  setup: async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "FAKE-SETUP-1" });
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
    });
    const mission = await createMissionFixture(testDb!, { taskId: task.taskId, robotId: robot.robotId });
    return { robotId: robot.robotId, missionId: mission.missionId };
  },
  validRawMessage: () => ({
    headers: { "x-fake-token": "ok" },
    rawBody: JSON.stringify({ callback_type: "statusUpdate", data: { missionId: "x", status: "RUNNING" } }),
  }),
  unauthorizedRawMessage: () => ({
    headers: { "x-fake-token": "salah" },
    rawBody: JSON.stringify({ callback_type: "statusUpdate", data: {} }),
  }),
});
