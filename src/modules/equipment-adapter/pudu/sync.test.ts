import { afterEach, describe, expect, it } from "vitest";
import { startMockPuduServer } from "@/test/mock-pudu-server";
import { PuduClient } from "./client";
import { syncShops, syncRobots, syncGroups } from "./sync";

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
      return { status: 200, body: { count: allShops.length, list: allShops.slice(offset, offset + limit) } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await syncShops(client, { pageSize: 2 });
    expect(result).toHaveLength(5);
    expect(result.map((s) => s.shop_id)).toEqual(["S0", "S1", "S2", "S3", "S4"]);
  });

  it("syncRobots mengirim shop_id dan berhenti saat halaman kosong", async () => {
    let calls = 0;
    const server = await startMockPuduServer((req) => {
      calls += 1;
      expect(req.query.get("shop_id")).toBe("1001");
      return { status: 200, body: { count: 0, list: [] } };
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
      return { status: 200, body: { groups: allGroups.slice(offset, offset + limit) } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s" });

    const result = await syncGroups(client, "1001", { pageSize: 2 });
    expect(result.map((g) => g.group_id)).toEqual(["G0", "G1", "G2"]);
  });
});
