import { describe, expect, it } from "vitest";
import { buildPathAndParameters, buildEncodedQueryString, buildSigningString, computeContentMd5, signRequest } from "./signing";
import golden from "@/test/fixtures/pudu-official/pudu-signing-golden.json";

describe("buildPathAndParameters", () => {
  it("tanpa query, tidak ada '?'", () => {
    expect(buildPathAndParameters("/pudu-entry/foo")).toBe("/pudu-entry/foo");
  });

  it("query diurutkan leksikografis, bukan urutan insersi", () => {
    expect(buildPathAndParameters("/p", { offset: 0, limit: 10 })).toBe("/p?limit=10&offset=0");
  });

  it("param undefined diabaikan", () => {
    expect(buildPathAndParameters("/p", { sn: "ABC", mac: undefined })).toBe("/p?sn=ABC");
  });

  it("param tanpa nilai (string kosong) ditulis key-nya saja", () => {
    expect(buildPathAndParameters("/p", { flag: "" })).toBe("/p?flag");
  });
});

// Fase C: query string URL fetch SUNGGUHAN -- beda dari buildPathAndParameters
// (nilai mentah untuk ditandatangani) karena nilainya di-encodeURIComponent.
describe("buildEncodedQueryString", () => {
  it("cocok persis dengan contoh resmi (golden): karakter khusus + nilai kosong", () => {
    const goldenCase = golden.cases.find((c) => c.name === "GET query: nilai kosong dan karakter khusus")!;
    const result = buildEncodedQueryString(goldenCase.query as Record<string, string>);
    expect(result).toBe(goldenCase.expected.urlQueryString);
  });

  it("tanpa query/kosong -> string kosong, tanpa '?'", () => {
    expect(buildEncodedQueryString()).toBe("");
    expect(buildEncodedQueryString({})).toBe("");
  });

  it("spasi jadi %20 (BUKAN '+' seperti URLSearchParams)", () => {
    expect(buildEncodedQueryString({ q: "a b" })).toBe("q=a%20b");
  });

  it("param undefined dilewati", () => {
    expect(buildEncodedQueryString({ sn: "ABC", mac: undefined })).toBe("sn=ABC");
  });

  it("param tanpa nilai ditulis key-nya saja (tanpa '=')", () => {
    expect(buildEncodedQueryString({ flag: "" })).toBe("flag");
  });
});

describe("computeContentMd5", () => {
  it("deterministik untuk body yang sama", () => {
    const body = JSON.stringify({ sn: "ABC" });
    expect(computeContentMd5(body)).toBe(computeContentMd5(body));
  });

  it("beda untuk body yang beda", () => {
    expect(computeContentMd5("a")).not.toBe(computeContentMd5("b"));
  });

  // PUDU_OFFICIAL_EXCERPT.md bagian A: "Content-MD5 = Base64( hex( MD5(body
  // UTF-8) ) )" -- base64 dari STRING HEX digest, bukan base64 dari bytes
  // digest mentah. Dihitung manual lewat node:crypto mengikuti definisi itu
  // persis, dibandingkan dengan signing.ts.
  it("sesuai formula resmi: base64(hex(md5(body))), bukan base64(digest biner)", async () => {
    const { createHash } = await import("node:crypto");
    const body = JSON.stringify({ b: "2", a: "###Special Character Test", c: "3" });

    const expected = Buffer.from(createHash("md5").update(body, "utf8").digest("hex"), "utf8").toString("base64");
    const wrongFormula = createHash("md5").update(body, "utf8").digest("base64");

    expect(computeContentMd5(body)).toBe(expected);
    expect(computeContentMd5(body)).not.toBe(wrongFormula);
  });
});

describe("buildSigningString", () => {
  it("menyusun 6 bagian sesuai urutan dokumentasi (Headers, Method, Accept, Content-Type, Content-MD5, PathAndParameters)", () => {
    const result = buildSigningString({
      signedHeaders: { "x-date": "Mon, 19 Oct 2026 01:00:00 GMT" },
      method: "get",
      accept: "application/json",
      contentType: "application/json",
      contentMd5: "",
      pathAndParameters: "/pudu-entry/foo?sn=ABC",
    });

    expect(result).toBe(
      "x-date: Mon, 19 Oct 2026 01:00:00 GMT\n" +
        ["GET", "application/json", "application/json", "", "/pudu-entry/foo?sn=ABC"].join("\n"),
    );
  });

  it("header diurutkan leksikografis kalau lebih dari satu", () => {
    const result = buildSigningString({
      signedHeaders: { "x-date": "D1", "x-another": "D2" },
      method: "GET",
      accept: "application/json",
      contentType: "application/json",
      contentMd5: "",
      pathAndParameters: "/p",
    });
    expect(result.startsWith("x-another: D2\nx-date: D1\n")).toBe(true);
  });

  // PUDU_OFFICIAL_EXCERPT.md bagian A, contoh signing string resmi (request
  // form, header "source" + "x-date" ikut ditandatangani). Hanya menguji
  // bagian yang tidak ambigu dari teks hasil scraping web: baris header
  // TERAKHIR langsung diikuti HTTPMethod (tanpa baris kosong), lalu
  // Accept/Content-Type pada baris berikutnya, lalu PathAndParameters di
  // baris terakhir. Jumlah baris kosong TEPAT antara Content-Type dan
  // PathAndParameters tidak diuji byte-persis (lihat komentar di
  // buildSigningString) -- lihat laporan akhir, pertanyaan terbuka.
  it("cocok dengan contoh resmi untuk bagian yang tidak ambigu (header ganda, tanpa baris kosong sebelum Method)", () => {
    const result = buildSigningString({
      signedHeaders: { source: "apigw test", "x-date": "Thu, 11 Mar 2021 08:29:58 GMT" },
      method: "POST",
      accept: "application/json",
      contentType: "application/x-www-form-urlencoded",
      contentMd5: "",
      pathAndParameters: "/?p=test",
    });

    const lines = result.split("\n");
    expect(lines[0]).toBe("source: apigw test");
    expect(lines[1]).toBe("x-date: Thu, 11 Mar 2021 08:29:58 GMT");
    expect(lines[2]).toBe("POST"); // langsung sesudah header, bukan baris kosong
    expect(lines[3]).toBe("application/json");
    expect(lines[4]).toBe("application/x-www-form-urlencoded");
    expect(result.endsWith("/?p=test")).toBe(true);
  });
});

describe("signRequest", () => {
  it("menghasilkan header x-date, Accept, Content-Type, Authorization dengan format hmac", () => {
    const result = signRequest({
      method: "GET",
      pathAndParameters: "/pudu-entry/data-open-platform-service/v1/api/healthCheck",
      apiAppKey: "dummy-key",
      apiAppSecret: "dummy-secret",
      date: new Date("2026-10-19T01:00:00Z"),
    });

    expect(result["x-date"]).toBe("Mon, 19 Oct 2026 01:00:00 GMT");
    expect(result.Accept).toBe("application/json");
    expect(result["Content-Type"]).toBe("application/json");
    expect(result.Authorization).toMatch(/^hmac id="dummy-key", algorithm="hmac-sha1", headers="x-date", signature=".+"$/);
  });

  it("GET tidak menghitung Content-MD5 (selalu kosong, header tidak ada)", () => {
    const a = signRequest({
      method: "GET",
      pathAndParameters: "/p",
      apiAppKey: "k",
      apiAppSecret: "s",
      date: new Date("2026-10-19T01:00:00Z"),
    });
    const b = signRequest({
      method: "GET",
      pathAndParameters: "/p",
      body: "harusnya diabaikan untuk GET",
      apiAppKey: "k",
      apiAppSecret: "s",
      date: new Date("2026-10-19T01:00:00Z"),
    });
    expect(a.Authorization).toBe(b.Authorization);
    expect(a["Content-MD5"]).toBeUndefined();
    expect(b["Content-MD5"]).toBeUndefined();
  });

  // Fase B: gateway PUDU membaca NILAI header Content-MD5 -- tanpa header
  // ini terkirim, request ber-body kemungkinan ditolak 401 walau
  // signature-nya benar (bug ditemukan verifikasi lanjutan, bukan dari
  // tes golden bagian A).
  it("POST dengan body: header Content-MD5 ADA dan sama dengan yang dipakai di signing string", () => {
    const body = JSON.stringify({ sn: "ABC" });
    const result = signRequest({
      method: "POST",
      pathAndParameters: "/p",
      body,
      apiAppKey: "k",
      apiAppSecret: "s",
      date: new Date("2026-10-19T01:00:00Z"),
    });
    expect(result["Content-MD5"]).toBe(computeContentMd5(body));
  });

  it("signature berubah kalau secret berbeda (deterministik per secret)", () => {
    const a = signRequest({
      method: "GET",
      pathAndParameters: "/p",
      apiAppKey: "k",
      apiAppSecret: "secret-1",
      date: new Date("2026-10-19T01:00:00Z"),
    });
    const b = signRequest({
      method: "GET",
      pathAndParameters: "/p",
      apiAppKey: "k",
      apiAppSecret: "secret-2",
      date: new Date("2026-10-19T01:00:00Z"),
    });
    expect(a.Authorization).not.toBe(b.Authorization);
  });

  it("tidak pernah menaruh ApiAppSecret mentah di header manapun", () => {
    const result = signRequest({
      method: "GET",
      pathAndParameters: "/p",
      apiAppKey: "k",
      apiAppSecret: "secret-rahasia-xyz",
      date: new Date("2026-10-19T01:00:00Z"),
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("secret-rahasia-xyz");
  });
});
