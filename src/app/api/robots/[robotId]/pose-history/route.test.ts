import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture } from "@/test/fixtures";

// Bagian 1 Fase C: lihat komentar sama di equipment/route.test.ts. Equipment
// & Robot Read terbuka untuk semua role login.
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: vi.fn(async () => ({
      ok: true as const,
      auth: { userId: "00000000-0000-0000-0000-000000000001", roleName: "WCS_ADMINISTRATOR" },
    })),
  };
});

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string) {
  return new Request(url);
}

describe.skipIf(!hasTestDatabase())("GET /api/robots/[robotId]/pose-history", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function freshRoute() {
    vi.resetModules();
    const mod = await import("./route");
    return mod.GET;
  }

  it("400 kalau from/to tidak ada", async () => {
    const GET = await freshRoute();
    const res = await GET(makeRequest("http://localhost/api/robots/x/pose-history"), {
      params: Promise.resolve({ robotId: "00000000-0000-0000-0000-000000000099" }),
    });
    expect(res.status).toBe(400);
  });

  it("404 kalau robot tidak ditemukan", async () => {
    const GET = await freshRoute();
    const res = await GET(
      makeRequest("http://localhost/api/robots/x/pose-history?from=2026-10-01T00:00:00Z&to=2026-10-31T00:00:00Z"),
      { params: Promise.resolve({ robotId: "00000000-0000-0000-0000-000000000099" }) },
    );
    expect(res.status).toBe(404);
  });

  it("robot ada tapi bukan robot PUDU -> items kosong", async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId });

    const GET = await freshRoute();
    const res = await GET(
      makeRequest("http://localhost/api/robots/x/pose-history?from=2026-10-01T00:00:00Z&to=2026-10-31T00:00:00Z"),
      { params: Promise.resolve({ robotId: robot.robotId }) },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).items).toHaveLength(0);
  });

  it("mengembalikan baris di dalam rentang recordedAt, terurut terbaru dulu, dibatasi limit", async () => {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "SN-POSE" });
    const puduRobot = await testDb!.puduRobot.create({
      data: { robotId: robot.robotId, sn: "SN-POSE", model: "T600", bindingStatus: "BOUND" },
    });

    await testDb!.puduPoseLog.create({
      data: { puduRobotId: puduRobot.puduRobotId, x: 1, y: 1, source: "CALLBACK", recordedAt: new Date("2026-10-05T00:00:00Z") },
    });
    await testDb!.puduPoseLog.create({
      data: { puduRobotId: puduRobot.puduRobotId, x: 2, y: 2, source: "CALLBACK", recordedAt: new Date("2026-10-10T00:00:00Z") },
    });
    // Di luar rentang query (bulan November) -- partisi berbeda.
    await testDb!.puduPoseLog.create({
      data: { puduRobotId: puduRobot.puduRobotId, x: 3, y: 3, source: "CALLBACK", recordedAt: new Date("2026-11-05T00:00:00Z") },
    });

    const GET = await freshRoute();
    const res = await GET(
      makeRequest(
        `http://localhost/api/robots/x/pose-history?from=2026-10-01T00:00:00Z&to=2026-10-31T23:59:59Z&limit=1`,
      ),
      { params: Promise.resolve({ robotId: robot.robotId }) },
    );
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(Number(body.items[0].x)).toBe(2); // terbaru dalam rentang (10 Okt)
  });
});
