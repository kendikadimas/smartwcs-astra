import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createTaskFixture, createMissionFixture, createUserFixture } from "@/test/fixtures";

// userId harus user NYATA -- cancel menulis TaskStatusHistory.changedBy (FK
// ke User). Lihat alasan sama di dispatch/route.test.ts.
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

function makeRequest(url: string) {
  return new Request(url, { method: "POST" });
}

async function createFakeRobot(locationId: string, serialNumber: string) {
  const equipment = await testDb!.equipment.create({
    data: { locationId, name: "Fake Robot", equipmentType: "ROBOT", vendor: "Fake", status: "ONLINE", capabilities: {} },
  });
  return testDb!.robot.create({
    data: { equipmentId: equipment.equipmentId, name: "Fake Robot", serialNumber, vendor: "Fake", model: "FAKE", protocol: "FAKE" },
  });
}

// vi.resetModules() membuang cache registry.ts -- registrasi fakeAdapter
// harus dilakukan lewat import dinamis SETELAH reset, lihat komentar sama
// di dispatch/route.test.ts.
async function freshRouteWithFakeAdapter() {
  vi.resetModules();
  const { registerAdapter, clearRegistry } = await import("@/modules/equipment-adapter/registry");
  const { fakeAdapter, resetFakeAdapterState } = await import("@/modules/equipment-adapter/fake");
  clearRegistry();
  registerAdapter(fakeAdapter);
  resetFakeAdapterState();
  const route = await import("./route");
  return route.POST;
}

describe.skipIf(!hasTestDatabase())("POST /api/tasks/[taskId]/cancel", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    delete process.env.PUDU_BASE_URL;
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

  it("task sudah di-dispatch (ada Mission aktif) -> CANCELLED, adapter.cancel dipanggil", async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createFakeRobot(location.locationId, "SN-CANCEL-1");
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "DISPATCHED",
    });
    const mission = await createMissionFixture(testDb!, { taskId: task.taskId, robotId: robot.robotId, status: "ACCEPTED" });

    const POST = await freshRouteWithFakeAdapter();
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/cancel`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("CANCELLED");

    const updatedMission = await testDb!.mission.findUniqueOrThrow({ where: { missionId: mission.missionId } });
    expect(updatedMission.status).toBe("CANCELLED");
  });

  it("task belum pernah di-dispatch (tanpa Mission) -> CANCELLED langsung", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    const POST = await freshRouteWithFakeAdapter();
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/cancel`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("CANCELLED");
  });

  it("task sudah COMPLETED -> 409, tidak bisa dibatalkan", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "COMPLETED",
    });

    const POST = await freshRouteWithFakeAdapter();
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/cancel`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(409);
  });

  it("RBAC.md: role Maintenance/Engineer ditolak 403", async () => {
    authState.roleName = "MAINTENANCE_ENGINEER";
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    const POST = await freshRouteWithFakeAdapter();
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/cancel`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(403);
  });
});
