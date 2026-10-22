import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createEventFixture, createLocationFixture, createTaskFixture } from "@/test/fixtures";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string) {
  return new Request(url);
}

describe.skipIf(!hasTestDatabase())("GET /api/events", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("filter severity dan paginasi", async () => {
    await createEventFixture(testDb!, { severity: "WARNING" });
    await createEventFixture(testDb!, { severity: "CRITICAL" });
    await createEventFixture(testDb!, { severity: "CRITICAL" });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/events?severity=CRITICAL&pageSize=1&page=1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].severity).toBe("CRITICAL");
  });

  it("filter rentang waktu (from/to)", async () => {
    await createEventFixture(testDb!, { occurredAt: new Date("2026-01-01T00:00:00Z") });
    await createEventFixture(testDb!, { occurredAt: new Date("2026-06-01T00:00:00Z") });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(
      makeRequest("http://localhost/api/events?from=2026-05-01T00:00:00Z&to=2026-07-01T00:00:00Z"),
    );
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("filter taskId", async () => {
    const location = await createLocationFixture(testDb!);
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
    });
    await createEventFixture(testDb!, { taskId: task.taskId });
    await createEventFixture(testDb!);

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest(`http://localhost/api/events?taskId=${task.taskId}`));
    const body = await res.json();
    expect(body.total).toBe(1);
  });
});

describe.skipIf(!hasTestDatabase())("GET /api/events/[eventId]", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  it("404 kalau tidak ditemukan", async () => {
    vi.resetModules();
    const { GET } = await import("./[eventId]/route");
    const res = await GET(makeRequest("http://localhost/api/events/x"), {
      params: Promise.resolve({ eventId: "00000000-0000-0000-0000-000000000099" }),
    });
    expect(res.status).toBe(404);
  });

  it("200 dengan detail event", async () => {
    const event = await createEventFixture(testDb!);
    vi.resetModules();
    const { GET } = await import("./[eventId]/route");
    const res = await GET(makeRequest("http://localhost/api/events/x"), {
      params: Promise.resolve({ eventId: event.eventId }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).eventId).toBe(event.eventId);
  });
});
