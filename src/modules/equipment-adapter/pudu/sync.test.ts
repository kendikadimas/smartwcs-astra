import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { startMockPuduServer } from "@/test/mock-pudu-server";
import { PuduClient } from "./client";
import { syncShops, syncRobots, syncGroups, syncMaps } from "./sync";

describe("sync-shops / sync-robots / sync-groups (paginasi)", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("syncShops mengambil semua halaman sampai list lebih pendek dari pageSize", async () => {
    const allShops = Array.from({ length: 5 }, (_, i) => ({ shop_id: `S${i}` }));
    const server = await startMockPuduServer((req) => {
      const limit = Number(req.query.get("limit") ?? 2);
      const offset = Number(req.query.get("offset") ?? 0);
      return {
        status: 200,
        body: { message: "SUCCESS", data: { count: allShops.length, list: allShops.slice(offset, offset + limit) } },
      };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await syncShops(client, { pageSize: 2 });
    expect(result).toHaveLength(5);
    expect(result.map((s: { shop_id: string }) => s.shop_id)).toEqual(["S0", "S1", "S2", "S3", "S4"]);
  });

  it("syncRobots mengirim shop_id dan berhenti saat halaman kosong", async () => {
    let calls = 0;
    const server = await startMockPuduServer((req) => {
      calls += 1;
      expect(req.query.get("shop_id")).toBe("1001");
      return { status: 200, body: { message: "SUCCESS", data: { count: 0, list: [] } } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await syncRobots(client, "1001", { pageSize: 10 });
    expect(result).toHaveLength(0);
    expect(calls).toBe(1);
  });

  it("syncGroups mengembalikan seluruh grup dari satu halaman penuh + satu halaman sisa", async () => {
    const allGroups = Array.from({ length: 3 }, (_, i) => ({ group_id: `G${i}` }));
    const server = await startMockPuduServer((req) => {
      const limit = Number(req.query.get("limit") ?? 2);
      const offset = Number(req.query.get("offset") ?? 0);
      return { status: 200, body: { message: "SUCCESS", data: { groups: allGroups.slice(offset, offset + limit) } } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await syncGroups(client, "1001", { pageSize: 2 });
    expect(result.map((g: { group_id: string }) => g.group_id)).toEqual(["G0", "G1", "G2"]);
  });
});

const mapsTestDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("syncMaps (Fase E, belum diverifikasi dokumen resmi)", () => {
  const testDb = mapsTestDb!;
  let close: (() => Promise<void>) | undefined;

  beforeEach(async () => {
    await truncateAll(testDb);
  });

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  afterAll(async () => {
    await testDb.$disconnect();
  });

  it("upsert PuduMap + PuduMapElement dari StoreMapList + GetMapDetailV2", async () => {
    const server = await startMockPuduServer((req) => {
      if (req.path === "/data-open-platform-service/v1/api/maps") {
        return { status: 200, body: { message: "SUCCESS", data: { list: [{ map_name: "Gudang-1F" }] } } };
      }
      return {
        status: 200,
        body: {
          message: "SUCCESS",
          data: {
            map_name: "Gudang-1F",
            map_code: "MC1",
            width: 10,
            height: 20,
            resolution: 0.05,
            origin_list: [0, 0, 0],
            element_list: [{ id: "EL-1", name: "P1", type: "point", mode: "table", vector_list: [1, 2, 0] }],
          },
        },
      };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });
    const shop = await testDb.puduShop.create({ data: { shopId: "shop-1" } });

    const result = await syncMaps(testDb, client, shop.puduShopId, "shop-1");

    expect(result.mapsSynced).toBe(1);
    expect(result.elementsSynced).toBe(1);
    const map = await testDb.puduMap.findUniqueOrThrow({
      where: { puduShopId_mapName: { puduShopId: shop.puduShopId, mapName: "Gudang-1F" } },
    });
    expect(map.mapCode).toBe("MC1");
    const element = await testDb.puduMapElement.findFirstOrThrow({ where: { puduMapId: map.puduMapId } });
    expect(element.name).toBe("P1");
    expect(element.isActive).toBe(true);
  });

  it("elemen yang hilang dari element_list di-soft-delete, bukan di-DELETE", async () => {
    const shop = await testDb.puduShop.create({ data: { shopId: "shop-2" } });
    const map = await testDb.puduMap.create({ data: { puduShopId: shop.puduShopId, mapName: "Gudang-2F" } });
    await testDb.puduMapElement.create({
      data: { puduMapId: map.puduMapId, vendorElementId: "EL-HILANG", name: "Hilang", elementType: "point" },
    });

    const server = await startMockPuduServer((req) => {
      if (req.path === "/data-open-platform-service/v1/api/maps") {
        return { status: 200, body: { message: "SUCCESS", data: { list: [{ map_name: "Gudang-2F" }] } } };
      }
      return {
        status: 200,
        body: { message: "SUCCESS", data: { map_name: "Gudang-2F", element_list: [] } }, // elemen lama tidak muncul lagi
      };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    await syncMaps(testDb, client, shop.puduShopId, "shop-2");

    const element = await testDb.puduMapElement.findFirstOrThrow({ where: { vendorElementId: "EL-HILANG" } });
    expect(element.isActive).toBe(false);
    expect(element.deletedAt).not.toBeNull();
    // Masih ada barisnya (soft delete), bukan DELETE -- FK PuduTaskStop tetap utuh.
  });
});
