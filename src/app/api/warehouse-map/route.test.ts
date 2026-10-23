import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";

// Bagian 1 Fase C: lihat komentar sama di equipment/route.test.ts. Diperlakukan
// sebagai Monitoring (Read untuk semua role login) -- lihat komentar route.ts.
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

describe.skipIf(!hasTestDatabase())("GET /api/warehouse-map", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("400 kalau warehouseId kosong", async () => {
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/warehouse-map"));
    expect(res.status).toBe(400);
  });

  it("mengembalikan nodes/edges/puduMaps milik warehouse itu saja", async () => {
    const warehouse = await testDb!.warehouse.create({ data: { name: "WH-A", address: "-" } });
    const otherWarehouse = await testDb!.warehouse.create({ data: { name: "WH-B", address: "-" } });
    const zone = await testDb!.zone.create({ data: { warehouseId: warehouse.warehouseId, name: "Z1", zoneType: "STORAGE" } });

    const node1 = await testDb!.node.create({ data: { zoneId: zone.zoneId, x: 1, y: 1 } });
    const node2 = await testDb!.node.create({ data: { zoneId: zone.zoneId, x: 2, y: 2 } });
    await testDb!.edge.create({ data: { fromNodeId: node1.nodeId, toNodeId: node2.nodeId } });

    const shop = await testDb!.puduShop.create({ data: { shopId: "shop-1" } });
    await testDb!.puduMap.create({
      data: { warehouseId: warehouse.warehouseId, puduShopId: shop.puduShopId, mapName: "Map A" },
    });
    // Peta milik warehouse lain -- tidak boleh ikut.
    await testDb!.puduMap.create({
      data: { warehouseId: otherWarehouse.warehouseId, puduShopId: shop.puduShopId, mapName: "Map B" },
    });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest(`http://localhost/api/warehouse-map?warehouseId=${warehouse.warehouseId}`));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nodes).toHaveLength(2);
    expect(body.edges).toHaveLength(1);
    expect(body.puduMaps).toHaveLength(1);
    expect(body.puduMaps[0].mapName).toBe("Map A");
  });
});
