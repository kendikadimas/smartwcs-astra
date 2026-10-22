import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PuduClient, PuduApiError } from "./client";
import golden from "@/test/fixtures/pudu-official/pudu-signing-golden.json";

// Fase D: tes tingkat klien terhadap golden fixture, dengan fetchImpl palsu
// (menangkap request) dan vi.setSystemTime (signRequest() memanggil
// `new Date()` sendiri -- tidak menerima parameter date dari client.ts).
// baseUrl SENGAJA memakai pathname "/pudu-entry" (bukan host kosong seperti
// test lama) supaya temuan tambahan (pathAndParameters harus path LENGKAP,
// bukan cuma relatif) ikut teruji -- lihat komentar di client.ts request().
const golden1 = golden.cases[0]; // POST body JSON
const golden3 = golden.cases[2]; // GET query: nilai kosong dan karakter khusus
const golden4 = golden.cases[3]; // GET tanpa query

interface Captured {
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

function makeClient(onRequest: (c: Captured) => void) {
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((v, k) => (headers[k] = v));
    onRequest({ url: String(url), headers, body: init?.body ?? null });
    return new Response(JSON.stringify({ message: "SUCCESS" }), { status: 200 });
  }) as unknown as typeof fetch;

  return new PuduClient({
    baseUrl: "http://fake.invalid/pudu-entry",
    apiAppKey: golden1.apiAppKey,
    apiAppSecret: golden1.apiAppSecret,
    fetchImpl,
    maxRetries: 0,
  });
}

describe("PuduClient vs golden fixture (level klien, bukan cuma fungsi signing murni)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(golden1.fixedDate));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Method privat `request()` diakses lewat `as any` (biasa untuk tes unit
  // terhadap detail internal) -- golden1.body bukan bentuk payload PUDU
  // resmi manapun (cuma data uji tanda tangan dari dokumen Authentication
  // Access), jadi tidak bisa dikirim lewat method publik (initiateCallTask
  // dkk. mewajibkan field yang tidak ada di golden1.body).
  it("POST dengan body: header Content-MD5 ADA dan sama dengan golden, Authorization sama, body persis JSON.stringify(body)", async () => {
    let captured: Captured | undefined;
    const client = makeClient((c) => (captured = c));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).request("POST", "/data-open-platform-service/v1/api/healthCheck", { body: golden1.body });

    expect(captured!.headers["content-md5"]).toBe(golden1.expected.contentMd5);
    expect(captured!.headers.authorization).toBe(golden1.expected.authorization);
    expect(captured!.body).toBe(JSON.stringify(golden1.body));
  });

  it("GET dengan query: URL berisi urlQueryString golden, Authorization sama, TANPA header Content-MD5 bernilai", async () => {
    let captured: Captured | undefined;
    const client = makeClient((c) => (captured = c));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).request("GET", "/data-open-platform-service/v1/api/healthCheck", { query: golden3.query });

    expect(captured!.url).toContain(`?${golden3.expected.urlQueryString}`);
    expect(captured!.headers.authorization).toBe(golden3.expected.authorization);
    expect(captured!.headers["content-md5"]).toBeUndefined();
  });

  it("GET tanpa query: URL tidak punya '?'", async () => {
    let captured: Captured | undefined;
    const client = makeClient((c) => (captured = c));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).request("GET", "/data-open-platform-service/v1/api/healthCheck", {});

    expect(captured!.url).not.toContain("?");
    expect(captured!.headers.authorization).toBe(golden4.expected.authorization);
  });

  // Temuan tambahan Fase D: baseUrl berpathname "/pudu-entry" (kasus
  // realistis -- lihat .env.example PUDU_BASE_URL) harus ikut tersertakan
  // di path yang ditandatangani, BUKAN cuma path relatif method.
  it("Authorization memperhitungkan pathname baseUrl ('/pudu-entry'), bukan cuma path method", async () => {
    let captured: Captured | undefined;
    const client = makeClient((c) => (captured = c));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).request("GET", "/data-open-platform-service/v1/api/healthCheck", {});

    // golden4 dihitung untuk path LENGKAP "/pudu-entry/..." -- kalau
    // pathAndParameters cuma pakai path relatif (tanpa /pudu-entry), hasil
    // ini TIDAK akan sama dengan golden4 (itulah bug yang baru diperbaiki).
    expect(captured!.headers.authorization).toBe(golden4.expected.authorization);
  });

  it("message bukan SUCCESS tetap menjadi PuduApiError di level klien (bukan cuma fungsi signing)", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ message: "CLOUD_OPEN_ROBOT_OFFLINE" }), { status: 200 })) as unknown as typeof fetch;
    const client = new PuduClient({
      baseUrl: "http://fake.invalid/pudu-entry",
      apiAppKey: golden1.apiAppKey,
      apiAppSecret: golden1.apiAppSecret,
      fetchImpl,
      maxRetries: 0,
    });
    await expect(client.healthCheck()).rejects.toThrow(PuduApiError);
  });
});
