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

  it("message 'success' huruf kecil (contoh resmi StoreRobotList) tetap dianggap sukses, bukan error bisnis", async () => {
    const client = await setup(() => ({
      status: 200,
      body: { message: "success", data: { count: 1, list: [{ sn: "SN1" }] } },
    }));
    const result = await client.storeRobotList();
    expect(result.message).toBe("success");
    expect(result.data?.list[0].sn).toBe("SN1");
  });
});

// Fase B (NotifyRobotReportPosition, PUDU_OFFICIAL_EXCERPT.md bagian D):
// body resmi `{ sn, payload: { interval, times } }`, BUKAN `{ sn, interval,
// times }` rata seperti versi sebelum bagian D didapat.
describe("PuduClient.notifyRobotReportPosition", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  async function setup(handler: (req: MockRequest) => { status: number; body: unknown }) {
    const server = await startMockPuduServer(handler);
    close = server.close;
    return new PuduClient({ baseUrl: server.url, apiAppKey: "k", apiAppSecret: "s", maxRetries: 0 });
  }

  it("body persis sama dengan contoh resmi bagian D", async () => {
    let receivedBody: unknown;
    const client = await setup((req) => {
      receivedBody = req.body;
      return { status: 200, body: { trace_id: "t1", message: "SUCCESS" } };
    });

    await client.notifyRobotReportPosition({ sn: "SN-PD202405000001", interval: 5, times: 100 });

    expect(receivedBody).toEqual({ sn: "SN-PD202405000001", payload: { interval: 5, times: 100 } });
  });

  it("menolak interval 0 dan 0.5 tanpa memanggil jaringan", async () => {
    let calls = 0;
    const client = await setup(() => {
      calls += 1;
      return { status: 200, body: { message: "SUCCESS" } };
    });

    expect(() => client.notifyRobotReportPosition({ sn: "SN1", interval: 0, times: 10 })).toThrow();
    expect(() => client.notifyRobotReportPosition({ sn: "SN1", interval: 0.5, times: 10 })).toThrow();
    expect(calls).toBe(0);
  });

  it("menolak times 0 dan 1001 tanpa memanggil jaringan", async () => {
    let calls = 0;
    const client = await setup(() => {
      calls += 1;
      return { status: 200, body: { message: "SUCCESS" } };
    });

    expect(() => client.notifyRobotReportPosition({ sn: "SN1", interval: 1, times: 0 })).toThrow();
    expect(() => client.notifyRobotReportPosition({ sn: "SN1", interval: 1, times: 1001 })).toThrow();
    expect(calls).toBe(0);
  });

  it("menolak sn kosong tanpa memanggil jaringan", async () => {
    let calls = 0;
    const client = await setup(() => {
      calls += 1;
      return { status: 200, body: { message: "SUCCESS" } };
    });

    expect(() => client.notifyRobotReportPosition({ sn: "", interval: 1, times: 10 })).toThrow();
    expect(calls).toBe(0);
  });

  it("menerima respons {trace_id, message:SUCCESS}", async () => {
    const client = await setup(() => ({ status: 200, body: { trace_id: "t1", message: "SUCCESS" } }));
    const result = await client.notifyRobotReportPosition({ sn: "SN1", interval: 2, times: 600 });
    expect(result.message).toBe("SUCCESS");
  });

  it("message selain SUCCESS menjadi PuduApiError", async () => {
    const client = await setup(() => ({ status: 200, body: { message: "CLOUD_OPEN_ROBOT_OFFLINE" } }));
    await expect(client.notifyRobotReportPosition({ sn: "SN1", interval: 2, times: 600 })).rejects.toThrow(PuduApiError);
  });
});
