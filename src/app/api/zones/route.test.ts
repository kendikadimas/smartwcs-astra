import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("CRUD /api/zones", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("alur penuh: create -> list (filter warehouseId) -> update -> delete", async () => {
    const warehouse = await testDb!.warehouse.create({ data: { name: "WH", address: "-" } });

    vi.resetModules();
    const list = await import("./route");
    const createRes = await list.POST(
      makeRequest("http://localhost/api/zones", {
        method: "POST",
        body: JSON.stringify({ warehouseId: warehouse.warehouseId, name: "Zona A" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.zoneType).toBe("STORAGE");

    const listRes = await list.GET(makeRequest(`http://localhost/api/zones?warehouseId=${warehouse.warehouseId}`));
    expect(await listRes.json()).toHaveLength(1);

    vi.resetModules();
    const detail = await import("./[zoneId]/route");
    const patchRes = await detail.PATCH(
      makeRequest("http://localhost/api/zones/x", { method: "PATCH", body: JSON.stringify({ name: "Zona B" }) }),
      { params: Promise.resolve({ zoneId: created.zoneId }) },
    );
    expect((await patchRes.json()).name).toBe("Zona B");

    const deleteRes = await detail.DELETE(makeRequest("http://localhost/api/zones/x"), {
      params: Promise.resolve({ zoneId: created.zoneId }),
    });
    expect(deleteRes.status).toBe(204);
  });
});
