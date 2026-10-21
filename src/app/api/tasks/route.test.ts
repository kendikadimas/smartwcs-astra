import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture } from "@/test/fixtures";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

async function freshRoutes() {
  vi.resetModules();
  return import("./route");
}

describe.skipIf(!hasTestDatabase())("POST/GET /api/tasks", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("POST membuat task baru dengan status CREATED", async () => {
    const location = await createLocationFixture(testDb!);
    const { POST } = await freshRoutes();

    const res = await POST(
      makeRequest("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          taskType: "MOVE",
          source: "API",
          externalRef: "ext-1",
          sourceLocationId: location.locationId,
          destinationLocationId: location.locationId,
          priority: 1,
        }),
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("CREATED");
    expect(body.externalRef).toBe("ext-1");
  });

  it("POST dengan (source, externalRef) yang sama dua kali mengembalikan task yang sama, bukan duplikat", async () => {
    const location = await createLocationFixture(testDb!);
    const { POST } = await freshRoutes();
    const payload = {
      taskType: "MOVE",
      source: "API" as const,
      externalRef: "ext-dup",
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      priority: 1,
    };

    const res1 = await POST(makeRequest("http://localhost/api/tasks", { method: "POST", body: JSON.stringify(payload) }));
    const res2 = await POST(makeRequest("http://localhost/api/tasks", { method: "POST", body: JSON.stringify(payload) }));

    const body1 = await res1.json();
    const body2 = await res2.json();
    expect(body1.taskId).toBe(body2.taskId);

    const count = await testDb!.task.count({ where: { source: "API", externalRef: "ext-dup" } });
    expect(count).toBe(1);
  });

  it("POST dengan field wajib hilang -> 400 VALIDATION_ERROR", async () => {
    const { POST } = await freshRoutes();

    const res = await POST(
      makeRequest("http://localhost/api/tasks", { method: "POST", body: JSON.stringify({ taskType: "MOVE" }) }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  it("GET list mendukung filter status dan paginasi", async () => {
    const location = await createLocationFixture(testDb!);
    const { POST, GET } = await freshRoutes();
    for (let i = 0; i < 3; i++) {
      await POST(
        makeRequest("http://localhost/api/tasks", {
          method: "POST",
          body: JSON.stringify({
            taskType: "MOVE",
            source: "API",
            externalRef: `ext-list-${i}`,
            sourceLocationId: location.locationId,
            destinationLocationId: location.locationId,
            priority: 1,
          }),
        }),
      );
    }

    const res = await GET(makeRequest("http://localhost/api/tasks?status=CREATED&pageSize=2&page=1"));
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(2);
  });
});

describe.skipIf(!hasTestDatabase())("GET /api/tasks/[taskId]", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  it("404 kalau taskId tidak ditemukan", async () => {
    vi.resetModules();
    const { GET } = await import("./[taskId]/route");
    const res = await GET(makeRequest("http://localhost/api/tasks/x"), {
      params: Promise.resolve({ taskId: "00000000-0000-0000-0000-000000000099" }),
    });
    expect(res.status).toBe(404);
  });

  it("200 dengan detail task kalau ditemukan", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await testDb!.task.create({
      data: {
        taskType: "MOVE",
        source: "API",
        externalRef: "ext-detail",
        sourceLocationId: location.locationId,
        destinationLocationId: location.locationId,
        priority: 1,
        status: "CREATED",
      },
    });

    vi.resetModules();
    const { GET } = await import("./[taskId]/route");
    const res = await GET(makeRequest("http://localhost/api/tasks/x"), {
      params: Promise.resolve({ taskId: task.taskId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.taskId).toBe(task.taskId);
  });
});
