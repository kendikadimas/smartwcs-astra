import { describe, expect, it } from "vitest";
import { signRequest, buildSigningString, buildPathAndParameters, computeContentMd5 } from "./signing";
import golden from "@/test/fixtures/pudu-official/pudu-signing-golden.json";

// Fase A: tes golden terhadap logika penandatanganan contoh KODE JavaScript
// resmi PUDU (bukan excerpt teks bagian A yang ambigu soal baris kosong --
// ini dihitung dari kode resmi, byte-persis). Kalau tes ini gagal, JANGAN
// menebak perbaikan di buildSigningString/computeContentMd5/
// buildPathAndParameters/signRequest -- berhenti dan laporkan (aturan
// keras task ini); fungsi-fungsi itu sendiri sudah terbukti benar.
describe("signing vs golden fixture (kode resmi PUDU)", () => {
  for (const testCase of golden.cases) {
    // body: {} (POST body kosong) MASIH punya body -- JSON.stringify({}) = "{}",
    // string tidak kosong, jadi Content-MD5 TETAP dihitung (dikonfirmasi
    // fixture: contentMd5 "POST body kosong" bukan string kosong). Beda
    // dari GET, yang body-nya literal `null` di fixture (tidak ada body
    // sama sekali). Patokan "ada body atau tidak" harus `body !== null`,
    // BUKAN `Object.keys(body).length > 0` (percobaan awal salah,
    // ditemukan lewat test ini sendiri -- {} punya 0 keys tapi tetap
    // sebuah body).
    const hasBody = testCase.body !== null;
    const pathAndParameters = buildPathAndParameters(
      testCase.path,
      testCase.query as Record<string, string> | undefined,
    );

    it(`${testCase.name}: Authorization sama dengan referensi resmi`, () => {
      const signed = signRequest({
        method: testCase.method,
        pathAndParameters,
        body: hasBody ? JSON.stringify(testCase.body) : undefined,
        apiAppKey: testCase.apiAppKey,
        apiAppSecret: testCase.apiAppSecret,
        date: new Date(testCase.fixedDate),
      });

      expect(signed.Authorization).toBe(testCase.expected.authorization);
    });

    it(`${testCase.name}: signing string sama dengan referensi resmi`, () => {
      const contentMd5 = hasBody ? computeContentMd5(JSON.stringify(testCase.body)) : "";

      const signingString = buildSigningString({
        signedHeaders: { "x-date": testCase.xDate },
        method: testCase.method,
        accept: "application/json",
        contentType: "application/json",
        contentMd5,
        pathAndParameters,
      });

      expect(signingString).toBe(testCase.expected.signingString);
    });

    if (hasBody) {
      it(`${testCase.name}: computeContentMd5 sama dengan referensi resmi`, () => {
        const md5 = computeContentMd5(JSON.stringify(testCase.body));
        expect(md5).toBe(testCase.expected.contentMd5);
      });
    }
  }
});
