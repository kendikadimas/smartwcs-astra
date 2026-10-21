import { describe, expect, it } from "vitest";
import { buildPathAndParameters, buildSigningString, computeContentMd5, signRequest } from "./signing";

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

describe("computeContentMd5", () => {
  it("deterministik untuk body yang sama", () => {
    const body = JSON.stringify({ sn: "ABC" });
    expect(computeContentMd5(body)).toBe(computeContentMd5(body));
  });

  it("beda untuk body yang beda", () => {
    expect(computeContentMd5("a")).not.toBe(computeContentMd5("b"));
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
      [
        "x-date: Mon, 19 Oct 2026 01:00:00 GMT\n",
        "GET",
        "application/json",
        "application/json",
        "",
        "/pudu-entry/foo?sn=ABC",
      ].join("\n"),
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

  it("GET tidak menghitung Content-MD5 (selalu kosong)", () => {
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
