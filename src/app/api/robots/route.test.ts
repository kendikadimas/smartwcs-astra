import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture } from "@/test/fixtures";

// Bagian 1 Fase C: lihat komentar sama di equipment/route.test.ts.
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

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("CRUD /api/robots", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function createEquipment() {
    const location = await createLocationFixture(testDb!);
    return testDb!.equipment.create({
      data: {
        locationId: location.locationId,
        name: "Equipment Test",
        equipmentType: "ROBOT",
        vendor: "Pudu",
        status: "OFFLINE",
        capabilities: {},
      },
    });
  }

  it("alur penuh: create -> list -> detail -> update -> delete -> 404", async () => {
    vi.resetModules();
    const list = await import("./route");
    const equipment = await createEquipment();

    const createRes = await list.POST(
      makeRequest("http://localhost/api/robots", {
        method: "POST",
        body: JSON.stringify({ equipmentId: equipment.equipmentId, vendor: "Pudu", model: "T600", protocol: "REST" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.name).toBe("Pudu T600");

    const listRes = await list.GET(makeRequest("http://localhost/api/robots"));
    const robots = await listRes.json();
    expect(robots).toHaveLength(1);

    vi.resetModules();
    const detail = await import("./[robotId]/route");
    const getRes = await detail.GET(makeRequest("http://localhost/api/robots/x"), {
      params: Promise.resolve({ robotId: created.robotId }),
    });
    expect(getRes.status).toBe(200);

    const patchRes = await detail.PATCH(
      makeRequest("http://localhost/api/robots/x", { method: "PATCH", body: JSON.stringify({ model: "T700" }) }),
      { params: Promise.resolve({ robotId: created.robotId }) },
    );
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.model).toBe("T700");

    const deleteRes = await detail.DELETE(makeRequest("http://localhost/api/robots/x"), {
      params: Promise.resolve({ robotId: created.robotId }),
    });
    expect(deleteRes.status).toBe(204);

    const notFoundRes = await detail.GET(makeRequest("http://localhost/api/robots/x"), {
      params: Promise.resolve({ robotId: created.robotId }),
    });
    expect(notFoundRes.status).toBe(404);
  });

  it("list bisa difilter zoneId", async () => {
    vi.resetModules();
    const list = await import("./route");
    const equipment = await createEquipment();
    await testDb!.robot.create({
      data: { equipmentId: equipment.equipmentId, name: "R1", vendor: "Pudu", model: "T600", protocol: "REST" },
    });

    const location = await testDb!.location.findUniqueOrThrow({ where: { locationId: equipment.locationId } });
    const resMatch = await list.GET(makeRequest(`http://localhost/api/robots?zoneId=${location.zoneId}`));
    expect(await resMatch.json()).toHaveLength(1);

    const resNoMatch = await list.GET(makeRequest(`http://localhost/api/robots?zoneId=00000000-0000-0000-0000-000000000099`));
    expect(await resNoMatch.json()).toHaveLength(0);
  });

  it("POST dengan field wajib hilang -> 400", async () => {
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(makeRequest("http://localhost/api/robots", { method: "POST", body: JSON.stringify({}) }));
    expect(res.status).toBe(400);
  });
});
