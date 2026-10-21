import { afterEach, describe, expect, it } from "vitest";
import { startMockPuduServer, type MockRequest } from "@/test/mock-pudu-server";
import { PuduClient, PuduApiError } from "./client";

describe("PuduClient", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  async function setup(handler: (req: MockRequest) => { status: number; body: unknown }) {
    const server = await startMockPuduServer(handler);
    close = server.close;
    return new PuduClient({
      baseUrl: server.url,
      apiAppKey: "dummy-key",
      apiAppSecret: "dummy-secret",
      language: "en",
      maxRetries: 0,
    });
  }

  it("mengirim header hasil signRequest dan Language ke server", async () => {
    let received: MockRequest | undefined;
    const client = await setup((req) => {
      received = req;
      return { status: 200, body: { count: 0, list: [] } };
    });

    await client.getStoreList({ limit: 10, offset: 0 });

    expect(received?.headers["x-date"]).toBeDefined();
    expect(received?.headers.authorization).toMatch(/^hmac id="dummy-key"/);
    expect(received?.headers.language).toBe("en");
    expect(received?.query.get("limit")).toBe("10");
  });

  it("getStoreList mengembalikan body hasil parse JSON", async () => {
    const client = await setup(() => ({
      status: 200,
      body: { count: 1, list: [{ shop_id: "1001", shop_name: "Toko Test" }] },
    }));

    const result = await client.getStoreList();
    expect(result.count).toBe(1);
    expect(result.list[0].shop_id).toBe("1001");
  });

  it("initiateCallTask mengirim body sebagai JSON (POST)", async () => {
    let received: MockRequest | undefined;
    const client = await setup((req) => {
      received = req;
      return { status: 200, body: { task_id: "T1", state: "QUEUEING" } };
    });

    await client.initiateCallTask({ sn: "SN1", point: "P1" });

    expect(received?.method).toBe("POST");
    expect(received?.body).toEqual({ sn: "SN1", point: "P1" });
  });

  it("melempar PuduApiError kalau server membalas non-2xx", async () => {
    const client = await setup(() => ({ status: 401, body: { message: "signature invalid" } }));

    await expect(client.healthCheck()).rejects.toThrow(PuduApiError);
  });

  it("retry sampai maxRetries kalau server selalu gagal, lalu melempar error terakhir", async () => {
    let attempts = 0;
    const server = await startMockPuduServer(() => {
      attempts += 1;
      return { status: 500, body: { message: "server error" } };
    });
    close = server.close;
    const client = new PuduClient({
      baseUrl: server.url,
      apiAppKey: "k",
      apiAppSecret: "s",
      maxRetries: 2,
    });

    await expect(client.healthCheck()).rejects.toThrow();
    expect(attempts).toBe(3); // percobaan awal + 2 retry
  });

  it("tidak pernah memanggil internet -- fetchImpl default dites lewat server lokal, bukan URL asli PUDU", async () => {
    const client = await setup(() => ({ status: 200, body: {} }));
    // Kalau implementasi diam-diam memanggil domain PUDU asli, test ini akan
    // timeout/gagal di lingkungan tanpa internet -- lolos berarti request
    // benar-benar hanya ke server mock lokal.
    await expect(client.healthCheck()).resolves.toBeDefined();
  });
});
