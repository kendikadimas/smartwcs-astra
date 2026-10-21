import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture } from "@/test/fixtures";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("CRUD /api/equipment", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("alur penuh: create -> list -> detail -> update (EquipmentUpdateRequest) -> delete -> 404", async () => {
    const location = await createLocationFixture(testDb!);
    vi.resetModules();
    const list = await import("./route");

    const createRes = await list.POST(
      makeRequest("http://localhost/api/equipment", {
        method: "POST",
        body: JSON.stringify({ locationId: location.locationId, equipmentType: "CONVEYOR", vendor: "Generic" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("OFFLINE");

    const listRes = await list.GET(makeRequest(`http://localhost/api/equipment?zoneId=${location.zoneId}`));
    expect(await listRes.json()).toHaveLength(1);

    vi.resetModules();
    const detail = await import("./[equipmentId]/route");
    const patchRes = await detail.PATCH(
      makeRequest("http://localhost/api/equipment/x", { method: "PATCH", body: JSON.stringify({ status: "ONLINE" }) }),
      { params: Promise.resolve({ equipmentId: created.equipmentId }) },
    );
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).status).toBe("ONLINE");

    const deleteRes = await detail.DELETE(makeRequest("http://localhost/api/equipment/x"), {
      params: Promise.resolve({ equipmentId: created.equipmentId }),
    });
    expect(deleteRes.status).toBe(204);

    const notFoundRes = await detail.GET(makeRequest("http://localhost/api/equipment/x"), {
      params: Promise.resolve({ equipmentId: created.equipmentId }),
    });
    expect(notFoundRes.status).toBe(404);
  });
});
