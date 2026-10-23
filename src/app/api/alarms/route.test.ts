import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createEventFixture, createAlarmFixture, createUserFixture } from "@/test/fixtures";

// Bagian 1 Fase C: acknowledge/clear sekarang butuh requireRole DAN menulis
// AuditLog (FK ke User sungguhan, bukan sekadar UUID) -- berbeda dari file
// test lain (lihat komentar di equipment/route.test.ts), mock di sini
// menunjuk ke user NYATA yang dibuat per test lewat `authState`, diisi di
// beforeEach supaya FK AuditLog.userId valid. WAREHOUSE_SUPERVISOR dipilih
// karena satu-satunya role yang lolos ketiganya: GET (semua role), acknowledge,
// DAN clear (RBAC.md Section 3).
const authState = vi.hoisted(() => ({ userId: "pending" }));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: vi.fn(async () => ({
      ok: true as const,
      auth: { userId: authState.userId, roleName: "WAREHOUSE_SUPERVISOR" },
    })),
  };
});

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("GET /api/alarms", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
    authState.userId = (await createUserFixture(testDb!, { roleName: "WAREHOUSE_SUPERVISOR" })).userId;
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("filter status", async () => {
    const event1 = await createEventFixture(testDb!);
    const event2 = await createEventFixture(testDb!);
    await createAlarmFixture(testDb!, { eventId: event1.eventId, status: "ACTIVE" });
    await createAlarmFixture(testDb!, { eventId: event2.eventId, status: "CLEARED" });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/alarms?status=ACTIVE"));
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.items[0].status).toBe("ACTIVE");
  });

  it("filter severity lewat relasi event", async () => {
    const eventCritical = await createEventFixture(testDb!, { severity: "CRITICAL" });
    const eventInfo = await createEventFixture(testDb!, { severity: "INFO" });
    await createAlarmFixture(testDb!, { eventId: eventCritical.eventId });
    await createAlarmFixture(testDb!, { eventId: eventInfo.eventId });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/alarms?severity=CRITICAL"));
    const body = await res.json();
    expect(body.total).toBe(1);
  });
});

describe.skipIf(!hasTestDatabase())("POST /api/alarms/[alarmId]/acknowledge dan /clear", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
    authState.userId = (await createUserFixture(testDb!, { roleName: "WAREHOUSE_SUPERVISOR" })).userId;
  });

  async function freshRoutes() {
    vi.resetModules();
    const ack = await import("./[alarmId]/acknowledge/route");
    vi.resetModules();
    const clear = await import("./[alarmId]/clear/route");
    return { ack: ack.POST, clear: clear.POST };
  }

  it("404 kalau alarm tidak ditemukan", async () => {
    const { ack } = await freshRoutes();
    const res = await ack(makeRequest("http://localhost/api/alarms/x/acknowledge", { method: "POST" }), {
      params: Promise.resolve({ alarmId: "00000000-0000-0000-0000-000000000099" }),
    });
    expect(res.status).toBe(404);
  });

  it("ACTIVE -> ACKNOWLEDGED sukses, mengisi acknowledgedAt", async () => {
    const event = await createEventFixture(testDb!);
    const alarm = await createAlarmFixture(testDb!, { eventId: event.eventId, status: "ACTIVE" });
    const { ack } = await freshRoutes();

    const res = await ack(makeRequest("http://localhost/api/alarms/x/acknowledge", { method: "POST" }), {
      params: Promise.resolve({ alarmId: alarm.alarmId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ACKNOWLEDGED");
    expect(body.acknowledgedAt).not.toBeNull();
  });

  it("ACKNOWLEDGED -> ACKNOWLEDGED (acknowledge dua kali) ditolak 409", async () => {
    const event = await createEventFixture(testDb!);
    const alarm = await createAlarmFixture(testDb!, { eventId: event.eventId, status: "ACKNOWLEDGED" });
    const { ack } = await freshRoutes();

    const res = await ack(makeRequest("http://localhost/api/alarms/x/acknowledge", { method: "POST" }), {
      params: Promise.resolve({ alarmId: alarm.alarmId }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe("INVALID_TRANSITION");
  });

  it("ACTIVE -> CLEARED langsung (lompat acknowledge) ditolak 409", async () => {
    const event = await createEventFixture(testDb!);
    const alarm = await createAlarmFixture(testDb!, { eventId: event.eventId, status: "ACTIVE" });
    const { clear } = await freshRoutes();

    const res = await clear(makeRequest("http://localhost/api/alarms/x/clear", { method: "POST" }), {
      params: Promise.resolve({ alarmId: alarm.alarmId }),
    });
    expect(res.status).toBe(409);
  });

  it("ACKNOWLEDGED -> CLEARED sukses, mengisi clearedAt", async () => {
    const event = await createEventFixture(testDb!);
    const alarm = await createAlarmFixture(testDb!, { eventId: event.eventId, status: "ACKNOWLEDGED" });
    const { clear } = await freshRoutes();

    const res = await clear(makeRequest("http://localhost/api/alarms/x/clear", { method: "POST" }), {
      params: Promise.resolve({ alarmId: alarm.alarmId }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("CLEARED");
    expect(body.clearedAt).not.toBeNull();
  });

  it("CLEARED -> CLEARED (clear dua kali) ditolak 409", async () => {
    const event = await createEventFixture(testDb!);
    const alarm = await createAlarmFixture(testDb!, { eventId: event.eventId, status: "CLEARED" });
    const { clear } = await freshRoutes();

    const res = await clear(makeRequest("http://localhost/api/alarms/x/clear", { method: "POST" }), {
      params: Promise.resolve({ alarmId: alarm.alarmId }),
    });
    expect(res.status).toBe(409);
  });

  // Fase C: dua request acknowledge "bersamaan" terhadap alarm ACTIVE yang
  // sama -- updateMany bersyarat (where: {alarmId, status: "ACTIVE"}) harus
  // membuat Postgres menyerialkan dua UPDATE itu lewat row lock, jadi cuma
  // satu yang melihat status ACTIVE (200), yang lain melihat 0 baris (409).
  // Tanpa fix ini (findUnique+update lama), keduanya bisa lolos cek status
  // dan keduanya 200.
  it("dua acknowledge bersamaan terhadap alarm ACTIVE yang sama -- cuma satu 200, satu 409", async () => {
    const event = await createEventFixture(testDb!);
    const alarm = await createAlarmFixture(testDb!, { eventId: event.eventId, status: "ACTIVE" });
    const { ack } = await freshRoutes();

    const [res1, res2] = await Promise.all([
      ack(makeRequest("http://localhost/api/alarms/x/acknowledge", { method: "POST" }), {
        params: Promise.resolve({ alarmId: alarm.alarmId }),
      }),
      ack(makeRequest("http://localhost/api/alarms/x/acknowledge", { method: "POST" }), {
        params: Promise.resolve({ alarmId: alarm.alarmId }),
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);
  });
});
