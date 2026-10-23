import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture, createRobotFixture } from "@/test/fixtures";

// Bagian 1 Fase C: lihat komentar sama di equipment/route.test.ts. Monitoring
// Read terbuka untuk semua role login.
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

describe.skipIf(!hasTestDatabase())("GET /api/monitoring/fleet", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("meringkas online/offline/charging dan menerjemahkan isCharging ke boolean (Fase F: is_charging 1/-1 terkonfirmasi), remainTimeRaw tetap mentah", async () => {
    const location = await createLocationFixture(testDb!);
    const robotOnline = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "SN-ON" });
    const puduRobotOnline = await testDb!.puduRobot.create({
      data: { robotId: robotOnline.robotId, sn: "SN-ON", model: "T600", bindingStatus: "BOUND" },
    });
    await testDb!.puduRobotState.create({
      data: {
        puduRobotId: puduRobotOnline.puduRobotId,
        online: true,
        battery: 80,
        isCharging: -1,
        remainTime: 42,
        runState: "IDLE",
        x: 1,
        y: 2,
      },
    });

    const robotOffline = await createRobotFixture(testDb!, { locationId: location.locationId, serialNumber: "SN-OFF" });
    const puduRobotOffline = await testDb!.puduRobot.create({
      data: { robotId: robotOffline.robotId, sn: "SN-OFF", model: "T600", bindingStatus: "BOUND" },
    });
    await testDb!.puduRobotState.create({
      data: { puduRobotId: puduRobotOffline.puduRobotId, online: false, battery: 20, isCharging: 1 },
    });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/monitoring/fleet"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.total).toBe(2);
    expect(body.summary.online).toBe(1);
    expect(body.summary.offline).toBe(1);
    expect(body.summary.charging).toBe(1); // cuma SN-OFF yang isCharging=1
    const onlineItem = body.items.find((i: { serialNumber: string }) => i.serialNumber === "SN-ON");
    expect(onlineItem.isCharging).toBe(false); // -1 -> false, bukan lagi mentah
    expect(onlineItem.runState).toBe("IDLE");
    expect(onlineItem.remainTimeRaw).toBe(42); // tetap mentah, satuan belum diketahui untuk T600
    expect(onlineItem.battery).toBe(80);
  });
});
