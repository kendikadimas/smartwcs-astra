import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createTaskFixture, createEventFixture, createAlarmFixture } from "@/test/fixtures";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string) {
  return new Request(url);
}

describe.skipIf(!hasTestDatabase())("GET /api/monitoring/overview", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("warehouseId wajib -> 400 kalau kosong", async () => {
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/monitoring/overview"));
    expect(res.status).toBe(400);
  });

  it("menghitung activeTasks/queuedTasks/equipmentOnline/equipmentOffline/activeAlarms untuk satu warehouse", async () => {
    const location = await createLocationFixture(testDb!);
    const zone = await testDb!.zone.findUniqueOrThrow({ where: { zoneId: location.zoneId } });

    // 1 task CREATED (queued), 1 task RUNNING (active)
    await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });
    const runningTask = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "RUNNING",
    });

    // equipment ONLINE + OFFLINE
    await testDb!.equipment.create({
      data: { locationId: location.locationId, name: "EQ-ON", equipmentType: "CONVEYOR", vendor: "x", status: "ONLINE", capabilities: {} },
    });
    await testDb!.equipment.create({
      data: { locationId: location.locationId, name: "EQ-OFF", equipmentType: "CONVEYOR", vendor: "x", status: "OFFLINE", capabilities: {} },
    });

    // alarm ACTIVE terhubung ke task di warehouse ini
    const event = await createEventFixture(testDb!, { sourceType: "TASK", taskId: runningTask.taskId });
    await createAlarmFixture(testDb!, { eventId: event.eventId, status: "ACTIVE" });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest(`http://localhost/api/monitoring/overview?warehouseId=${zone.warehouseId}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.activeTasks).toBe(1);
    expect(body.queuedTasks).toBe(1);
    expect(body.equipmentOnline).toBe(1);
    expect(body.equipmentOffline).toBe(1);
    expect(body.activeAlarms).toBe(1);
  });
});
