import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createTaskFixture, createUserFixture } from "@/test/fixtures";

// Bagian 1 Fase D: dispatch/cancel butuh requireRole DAN menulis
// TaskStatusHistory.changedBy (FK ke User sungguhan) -- userId di sini
// diisi user NYATA (dibuat per test lewat authState, pola sama di
// alarms/route.test.ts). Role bisa diganti per test lewat authState.roleName.
const authState = vi.hoisted(() => ({ roleName: "WAREHOUSE_OPERATOR", userId: "pending" }));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: vi.fn(async () => ({
      ok: true as const,
      auth: { userId: authState.userId, roleName: authState.roleName },
    })),
  };
});

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, body?: unknown) {
  return new Request(url, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
}

async function createFakeRobot(locationId: string, serialNumber: string) {
  const equipment = await testDb!.equipment.create({
    data: { locationId, name: "Fake Robot", equipmentType: "ROBOT", vendor: "Fake", status: "ONLINE", capabilities: {} },
  });
  return testDb!.robot.create({
    data: { equipmentId: equipment.equipmentId, name: "Fake Robot", serialNumber, vendor: "Fake", model: "FAKE", protocol: "FAKE" },
  });
}

/**
 * `vi.resetModules()` membuang cache modul -- termasuk registry.ts (Map
 * adapter kosong lagi). Supaya adapter fake yang didaftarkan di sini benar-
 * benar dipakai route (yang mengimpor registry.ts lewat modul-graf SEGAR
 * yang sama), registrasi dilakukan lewat import dinamis SETELAH
 * resetModules, bukan lewat import statis di atas file ini.
 */
async function freshRouteWithFakeAdapter() {
  vi.resetModules();
  const { registerAdapter, clearRegistry } = await import("@/modules/equipment-adapter/registry");
  const { fakeAdapter, resetFakeAdapterState } = await import("@/modules/equipment-adapter/fake");
  clearRegistry();
  registerAdapter(fakeAdapter);
  resetFakeAdapterState();
  const route = await import("./route");
  return { POST: route.POST, fakeAdapter };
}

describe.skipIf(!hasTestDatabase())("POST /api/tasks/[taskId]/dispatch (adapter fake, tanpa PUDU)", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    delete process.env.PUDU_BASE_URL;
    delete process.env.PUDU_API_APP_KEY;
    delete process.env.PUDU_API_APP_SECRET;
    delete process.env.PUDU_CALLBACK_CODE;

    await truncateAll(testDb!);
    authState.roleName = "WAREHOUSE_OPERATOR";
    authState.userId = (await createUserFixture(testDb!, { roleName: "WAREHOUSE_OPERATOR" })).userId;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("E2E: dispatch -> CREATED->DISPATCHED, lalu callback fake 'queued' -> COMPLETED", async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createFakeRobot(location.locationId, "SN-DISPATCH-1");
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    const { POST, fakeAdapter } = await freshRouteWithFakeAdapter();
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/dispatch`, { robotId: robot.robotId, kind: "CALL", targetPoint: "P1" }), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.task.status).toBe("DISPATCHED");
    expect(body.mission.status).toBe("ACCEPTED");
    expect(body.mission.attempt).toBe(1);

    const histories = await testDb!.taskStatusHistory.findMany({ where: { taskId: task.taskId } });
    expect(histories).toHaveLength(1);
    expect(histories[0].fromStatus).toBe("CREATED");
    expect(histories[0].toStatus).toBe("DISPATCHED");

    // Callback fake "queued" -> COMPLETED (jalur yang sama dipakai worker nyata).
    const inboundResult = await fakeAdapter.handleInbound(testDb!, {
      kind: "queued",
      messageType: "statusUpdate",
      data: { missionId: body.mission.missionId, status: "COMPLETED" },
      integrationLogId: null,
      occurredAt: new Date(),
    });
    expect(inboundResult.kind).toBe("processed");

    const finalTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(finalTask.status).toBe("COMPLETED");
  });

  it("dispatch ditolak adapter (robot offline/dst) -> 409 dengan failureCode, Task TETAP CREATED, Mission FAILED, Event tercatat", async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createFakeRobot(location.locationId, "SN-REJECT-1");
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    const { POST } = await freshRouteWithFakeAdapter();
    const res = await POST(
      makeRequest(`http://localhost/api/tasks/${task.taskId}/dispatch`, {
        robotId: robot.robotId,
        kind: "CALL",
        targetPoint: "REJECT_NO_RESOURCE",
      }),
      { params: Promise.resolve({ taskId: task.taskId }) },
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("NO_RESOURCE_AVAILABLE");

    const task2 = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(task2.status).toBe("CREATED");
    const mission = await testDb!.mission.findFirstOrThrow({ where: { taskId: task.taskId } });
    expect(mission.status).toBe("FAILED");
    const event = await testDb!.event.findFirst({ where: { eventType: "DISPATCH_REJECTED", taskId: task.taskId } });
    expect(event).not.toBeNull();
  });

  it("dispatch kalau Task bukan CREATED -> 409", async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createFakeRobot(location.locationId, "SN-STATUS-1");
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "COMPLETED",
    });

    const { POST } = await freshRouteWithFakeAdapter();
    const res = await POST(
      makeRequest(`http://localhost/api/tasks/${task.taskId}/dispatch`, { robotId: robot.robotId, kind: "CALL", targetPoint: "P1" }),
      { params: Promise.resolve({ taskId: task.taskId }) },
    );
    expect(res.status).toBe(409);
  });

  it("dispatch dengan robotId tidak ditemukan -> 404", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    const { POST } = await freshRouteWithFakeAdapter();
    const res = await POST(
      makeRequest(`http://localhost/api/tasks/${task.taskId}/dispatch`, {
        // UUID v4 valid secara format (biar lolos zod .uuid()) tapi tidak
        // pernah dibuat di DB yang baru di-truncate ini.
        robotId: "00000000-0000-4000-8000-000000000099",
        kind: "CALL",
        targetPoint: "P1",
      }),
      { params: Promise.resolve({ taskId: task.taskId }) },
    );
    expect(res.status).toBe(404);
  });

  it("RBAC.md: role Maintenance/Engineer ditolak 403 (Task Management = None)", async () => {
    authState.roleName = "MAINTENANCE_ENGINEER";
    const location = await createLocationFixture(testDb!);
    const robot = await createFakeRobot(location.locationId, "SN-RBAC-1");
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    const { POST } = await freshRouteWithFakeAdapter();
    const res = await POST(
      makeRequest(`http://localhost/api/tasks/${task.taskId}/dispatch`, { robotId: robot.robotId, kind: "CALL", targetPoint: "P1" }),
      { params: Promise.resolve({ taskId: task.taskId }) },
    );
    expect(res.status).toBe(403);
  });
});
