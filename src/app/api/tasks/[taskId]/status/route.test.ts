import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createTaskFixture, createUserFixture } from "@/test/fixtures";

// userId harus user NYATA -- PATCH menulis TaskStatusHistory.changedBy (FK
// ke User). Lihat alasan sama di dispatch/route.test.ts.
const authState = vi.hoisted(() => ({ roleName: "SYSTEM_INTEGRATOR", userId: "pending" }));
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

function makeRequest(url: string, body: unknown) {
  return new Request(url, { method: "PATCH", body: JSON.stringify(body) });
}

describe.skipIf(!hasTestDatabase())("PATCH /api/tasks/[taskId]/status", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
    authState.roleName = "SYSTEM_INTEGRATOR";
    authState.userId = (await createUserFixture(testDb!, { roleName: "SYSTEM_INTEGRATOR" })).userId;
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("System Integrator -> 200, menulis TaskStatusHistory", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    vi.resetModules();
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest(`http://localhost/api/tasks/${task.taskId}/status`, { status: "RUNNING" }), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("RUNNING");

    const history = await testDb!.taskStatusHistory.findFirstOrThrow({ where: { taskId: task.taskId } });
    expect(history.fromStatus).toBe("CREATED");
    expect(history.toStatus).toBe("RUNNING");
  });

  it("role manusia selain System Integrator ditolak 403 (RBAC.md: dipanggil sistem internal)", async () => {
    authState.roleName = "WAREHOUSE_SUPERVISOR";
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    vi.resetModules();
    const { PATCH } = await import("./route");
    const res = await PATCH(makeRequest(`http://localhost/api/tasks/${task.taskId}/status`, { status: "RUNNING" }), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(403);
  });

  it("404 kalau taskId tidak ditemukan", async () => {
    vi.resetModules();
    const { PATCH } = await import("./route");
    const res = await PATCH(
      makeRequest("http://localhost/api/tasks/x/status", { status: "RUNNING" }),
      { params: Promise.resolve({ taskId: "00000000-0000-0000-0000-000000000099" }) },
    );
    expect(res.status).toBe(404);
  });
});
