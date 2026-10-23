import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";

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

describe.skipIf(!hasTestDatabase())("CRUD /api/locations", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("alur penuh: create -> list (filter zoneId) -> update -> delete -> list kosong", async () => {
    const warehouse = await testDb!.warehouse.create({ data: { name: "WH", address: "-" } });
    const zone = await testDb!.zone.create({ data: { warehouseId: warehouse.warehouseId, name: "Z1", zoneType: "STORAGE" } });

    vi.resetModules();
    const list = await import("./route");
    const createRes = await list.POST(
      makeRequest("http://localhost/api/locations", {
        method: "POST",
        body: JSON.stringify({ zoneId: zone.zoneId, code: "LOC-1", locationType: "STORAGE" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const listRes = await list.GET(makeRequest(`http://localhost/api/locations?zoneId=${zone.zoneId}`));
    expect(await listRes.json()).toHaveLength(1);

    vi.resetModules();
    const detail = await import("./[locationId]/route");
    const patchRes = await detail.PATCH(
      makeRequest("http://localhost/api/locations/x", { method: "PATCH", body: JSON.stringify({ code: "LOC-1-B" }) }),
      { params: Promise.resolve({ locationId: created.locationId }) },
    );
    expect((await patchRes.json()).code).toBe("LOC-1-B");

    const deleteRes = await detail.DELETE(makeRequest("http://localhost/api/locations/x"), {
      params: Promise.resolve({ locationId: created.locationId }),
    });
    expect(deleteRes.status).toBe(204);

    const listAfter = await list.GET(makeRequest(`http://localhost/api/locations?zoneId=${zone.zoneId}`));
    expect(await listAfter.json()).toHaveLength(0);
  });
});
