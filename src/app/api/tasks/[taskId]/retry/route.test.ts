import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createTaskFixture, createUserFixture } from "@/test/fixtures";

// userId harus user NYATA -- retry menulis TaskStatusHistory.changedBy (FK
// ke User). Lihat alasan sama di dispatch/route.test.ts.
const authState = vi.hoisted(() => ({ roleName: "WAREHOUSE_SUPERVISOR", userId: "pending" }));
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

describe.skipIf(!hasTestDatabase())("POST /api/tasks/[taskId]/retry", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
    authState.roleName = "WAREHOUSE_SUPERVISOR";
    authState.userId = (await createUserFixture(testDb!, { roleName: "WAREHOUSE_SUPERVISOR" })).userId;
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("task FAILED -> CREATED, retryCount naik 1, TaskStatusHistory reason RETRY", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "FAILED",
    });
    await testDb!.task.update({ where: { taskId: task.taskId }, data: { failureCode: "RESOURCE_ERROR" } });

    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/retry`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("CREATED");
    expect(body.retryCount).toBe(1);
    expect(body.failureCode).toBeNull();

    const history = await testDb!.taskStatusHistory.findFirstOrThrow({ where: { taskId: task.taskId } });
    expect(history.reason).toBe("RETRY");
  });

  it("task bukan FAILED -> 409", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "CREATED",
    });

    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/retry`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(409);
  });

  it("RBAC.md: Warehouse Operator tidak bisa retry sendiri -> 403", async () => {
    authState.roleName = "WAREHOUSE_OPERATOR";
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "FAILED",
    });

    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(makeRequest(`http://localhost/api/tasks/${task.taskId}/retry`), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(403);
  });
});
