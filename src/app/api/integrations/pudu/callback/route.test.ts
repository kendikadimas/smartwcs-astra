import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { seedPuduIntegration } from "@/modules/equipment-adapter/pudu/integration";

const ORIGINAL_ENV = { ...process.env };
const CALLBACK_CODE = "test-callback-code-32-bytes-long!!";

const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(body: unknown, headers: Record<string, string>) {
  return new Request("http://localhost/api/integrations/pudu/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function freshRoute() {
  vi.resetModules();
  const mod = await import("./route");
  return mod.POST;
}

describe.skipIf(!hasTestDatabase())("POST /api/integrations/pudu/callback", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.PUDU_CALLBACK_CODE = CALLBACK_CODE;
    await truncateAll(testDb!);
    await seedPuduIntegration(testDb!);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("menolak dengan 503 kalau PUDU_CALLBACK_CODE kosong", async () => {
    delete process.env.PUDU_CALLBACK_CODE;
    const POST = await freshRoute();

    const res = await POST(
      makeRequest({ callback_type: "robotActivate", data: { sn: "SN1" } }, { TraceId: "t1" }),
    );

    expect(res.status).toBe(503);
  });

  it("menolak dengan 401 kalau CallbackCode salah", async () => {
    const POST = await freshRoute();

    const res = await POST(
      makeRequest(
        { callback_type: "robotActivate", data: { sn: "SN1" } },
        { TraceId: "t1", CallbackCode: "salah" },
      ),
    );

    expect(res.status).toBe(401);
    const rows = await testDb!.integrationLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].callbackCodeValid).toBe(false);
    expect(rows[0].status).toBe("IGNORED");
  });

  it("menerima dan menyimpan PENDING kalau CallbackCode benar", async () => {
    const POST = await freshRoute();

    const res = await POST(
      makeRequest(
        { callback_type: "robotActivate", data: { sn: "SN1" } },
        { TraceId: "t1", CallbackCode: CALLBACK_CODE },
      ),
    );

    expect(res.status).toBe(200);
    const rows = await testDb!.integrationLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PENDING");
    expect(rows[0].messageType).toBe("robotActivate");
    expect(rows[0].traceId).toBe("t1");
  });

  it("retry dengan TraceId sama tidak membuat baris baru, tetap balas 200", async () => {
    const POST = await freshRoute();
    const req = () =>
      makeRequest(
        { callback_type: "robotActivate", data: { sn: "SN1" } },
        { TraceId: "same-trace", CallbackCode: CALLBACK_CODE },
      );

    const res1 = await POST(req());
    const res2 = await POST(req());
    const res3 = await POST(req());

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res3.status).toBe(200);
    const rows = await testDb!.integrationLog.findMany();
    expect(rows).toHaveLength(1);
  });

  it("payload bukan JSON valid disimpan IGNORED dan tetap balas 200 (supaya tidak di-retry)", async () => {
    const POST = await freshRoute();

    const res = await POST(
      makeRequest("{bukan json", { TraceId: "t1", CallbackCode: CALLBACK_CODE }),
    );

    expect(res.status).toBe(200);
    const rows = await testDb!.integrationLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("IGNORED");
    expect(rows[0].errorMessage).toMatch(/JSON/);
  });

  it("callback_type kosong disimpan IGNORED dan tetap balas 200", async () => {
    const POST = await freshRoute();

    const res = await POST(
      makeRequest({ data: { sn: "SN1" } }, { TraceId: "t1", CallbackCode: CALLBACK_CODE }),
    );

    expect(res.status).toBe(200);
    const rows = await testDb!.integrationLog.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("IGNORED");
  });
});
