import { afterAll, afterEach, beforeEach, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture, createTaskFixture, createMissionFixture } from "@/test/fixtures";
import { startMockPuduServer } from "@/test/mock-pudu-server";
import { runAdapterContractTests } from "../contract.test-suite";
import type { EquipmentAdapter } from "../contract";

const ORIGINAL_ENV = { ...process.env };
const CALLBACK_CODE = "contract-suite-callback-code-xyz";
const testDb = hasTestDatabase() ? createTestDb() : null;

let close: (() => Promise<void>) | undefined;
let adapter: EquipmentAdapter | undefined;

beforeEach(async () => {
  if (!hasTestDatabase()) return;
  await truncateAll(testDb!);

  const server = await startMockPuduServer(() => ({
    status: 200,
    body: { task_id: "vendor-task-1", state: "QUEUEING" },
  }));
  close = server.close;

  process.env = { ...ORIGINAL_ENV };
  process.env.PUDU_BASE_URL = server.url;
  process.env.PUDU_API_APP_KEY = "dummy-key";
  process.env.PUDU_API_APP_SECRET = "dummy-secret";
  process.env.PUDU_CALLBACK_CODE = CALLBACK_CODE;

  vi.resetModules();
  const mod = await import("./index");
  adapter = mod.puduAdapter;
});

afterEach(async () => {
  await close?.();
  close = undefined;
  process.env = { ...ORIGINAL_ENV };
});

afterAll(async () => {
  await testDb?.$disconnect();
});

runAdapterContractTests({
  name: "pudu",
  skip: !hasTestDatabase(),
  db: testDb!,
  getAdapter: () => adapter!,
  setup: async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "PUDU-SETUP-1" });
    await testDb!.puduRobot.create({
      data: { robotId: robot.robotId, sn: "PUDU-SETUP-1", model: "T600", bindingStatus: "UNBOUND" },
    });
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
    });
    const mission = await createMissionFixture(testDb!, { taskId: task.taskId, robotId: robot.robotId });
    return { robotId: robot.robotId, missionId: mission.missionId };
  },
  validRawMessage: () => ({
    headers: { traceid: "t1", callbackcode: CALLBACK_CODE },
    rawBody: JSON.stringify({ callback_type: "robotActivate", data: { sn: "PUDU-SETUP-1" } }),
  }),
  unauthorizedRawMessage: () => ({
    headers: { traceid: "t1", callbackcode: "salah" },
    rawBody: JSON.stringify({ callback_type: "robotActivate", data: {} }),
  }),
});
