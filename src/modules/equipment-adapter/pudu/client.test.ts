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
      return { status: 200, body: { message: "SUCCESS", data: { count: 0, list: [] } } };
    });

    await client.getStoreList({ limit: 10, offset: 0 });

    expect(received?.headers["x-date"]).toBeDefined();
    expect(received?.headers.authorization).toMatch(/^hmac id="dummy-key"/);
    expect(received?.headers.language).toBe("en");
    expect(received?.query.get("limit")).toBe("10");
  });

  it("getStoreList mengembalikan envelope {trace_id, message, data} hasil parse JSON", async () => {
    const client = await setup(() => ({
      status: 200,
      body: { message: "SUCCESS", data: { count: 1, list: [{ shop_id: "1001", shop_name: "Toko Test" }] } },
    }));

    const result = await client.getStoreList();
    expect(result.message).toBe("SUCCESS");
    expect(result.data?.count).toBe(1);
    expect(result.data?.list[0].shop_id).toBe("1001");
  });

  it("initiateCallTask mengirim body sebagai JSON (POST) dan membaca hasil dari data.*", async () => {
    let received: MockRequest | undefined;
    const client = await setup((req) => {
      received = req;
      return { status: 200, body: { message: "SUCCESS", data: { task_id: "T1", state: "QUEUEING" } } };
    });

    const result = await client.initiateCallTask({ sn: "SN1", map_name: "M1", point: "P1", point_type: "table" });

    expect(received?.method).toBe("POST");
    expect(received?.body).toEqual({ sn: "SN1", map_name: "M1", point: "P1", point_type: "table" });
    expect(result.data?.task_id).toBe("T1"); // bug #1: sebelumnya dibaca dari level atas, sekarang dari data.*
  });

  it("melempar PuduApiError kalau server membalas non-2xx", async () => {
    const client = await setup(() => ({ status: 401, body: { message: "signature invalid" } }));

    await expect(client.healthCheck()).rejects.toThrow(PuduApiError);
  });

  it("melempar PuduApiError kalau HTTP 2xx tapi message bukan SUCCESS, TANPA retry (error bisnis permanen)", async () => {
    let attempts = 0;
    const server = await startMockPuduServer(() => {
      attempts += 1;
      return { status: 200, body: { message: "CLOUD_OPEN_ROBOT_OFFLINE", trace_id: "t-1" } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s", maxRetries: 2 });

    const err = await client.healthCheck().catch((e) => e);
    expect(err).toBeInstanceOf(PuduApiError);
    expect((err as PuduApiError).code).toBe("CLOUD_OPEN_ROBOT_OFFLINE");
    expect((err as PuduApiError).traceId).toBe("t-1");
    expect(attempts).toBe(1); // tidak di-retry
  });

  it("MENG-retry kalau message adalah kode transien (CLOUD_OPEN_WAIT)", async () => {
    let attempts = 0;
    const server = await startMockPuduServer(() => {
      attempts += 1;
      return { status: 200, body: { message: "CLOUD_OPEN_WAIT" } };
    });
    close = server.close;
    const client = new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s", maxRetries: 2 });

    await expect(client.healthCheck()).rejects.toThrow(PuduApiError);
    expect(attempts).toBe(3); // percobaan awal + 2 retry, karena kode transien
  });

  it("retry sampai maxRetries kalau server selalu gagal HTTP (bukan error bisnis), lalu melempar error terakhir", async () => {
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
    const client = await setup(() => ({ status: 200, body: { message: "SUCCESS" } }));
    // Kalau implementasi diam-diam memanggil domain PUDU asli, test ini akan
    // timeout/gagal di lingkungan tanpa internet -- lolos berarti request
    // benar-benar hanya ke server mock lokal.
    await expect(client.healthCheck()).resolves.toBeDefined();
  });
});
