import { createHash, createHmac } from "node:crypto";

export type HmacAlgorithm = "hmac-sha1" | "hmac-sha256";

/**
 * PUDU_OFFICIAL_EXCERPT.md bagian A: "Content-MD5 = Base64( hex( MD5(body
 * UTF-8) ) )" -- base64 dari STRING HEX digest, bukan base64 dari bytes
 * digest mentah. Implementasi sebelumnya (base64(digest biner)) salah
 * formula. Tetap diverifikasi lewat healthCheck sebelum dipakai ke endpoint
 * lain -- respons 401 PUDU menyertakan StringToSign versi server untuk
 * dibandingkan (lihat client.ts `healthCheck()`/`request()`).
 */
export function computeContentMd5(body: string): string {
  const hexDigest = createHash("md5").update(body, "utf8").digest("hex");
  return Buffer.from(hexDigest, "utf8").toString("base64");
}

interface SigningStringInput {
  signedHeaders: Record<string, string>; // wajib menyertakan x-date
  method: string;
  accept: string;
  contentType: string;
  contentMd5: string; // "" untuk GET / tanpa body
  pathAndParameters: string;
}

/**
 * Enam bagian sesuai PUDU_OFFICIAL_EXCERPT.md bagian A: Headers, HTTPMethod,
 * Accept, Content-Type, Content-MD5, PathAndParameters. Blok Headers
 * sendiri multi-baris ("key: value\n" per baris, key diurutkan
 * leksikografis) dan baris header TERAKHIR langsung diikuti HTTPMethod
 * TANPA baris kosong di antaranya -- contoh resmi (bagian A, request form):
 *   source: apigw test
 *   x-date: Thu, 11 Mar 2021 08:29:58 GMT
 *   POST
 *   application/json
 *   application/x-www-form-urlencoded
 *
 *   /?p=test
 * (baris "x-date: ...GMT" diikuti langsung "POST", bukan baris kosong).
 * Versi sebelumnya menyisipkan baris kosong ekstra di situ -- diperbaiki.
 * Jumlah baris kosong tepat antara Content-Type dan PathAndParameters
 * (contoh resmi menunjukkan 2 baris kosong, tapi teks dokumen hasil
 * scraping web ambigu soal ini) BELUM bisa diverifikasi byte-persis --
 * dipakai 1 baris kosong (dari Content-MD5 kosong) sesuai pembacaan
 * paling literal "6 bagian dipisah \n"; lihat laporan akhir, pertanyaan
 * terbuka.
 */
export function buildSigningString(input: SigningStringInput): string {
  const headerLines = Object.keys(input.signedHeaders)
    .sort()
    .map((key) => `${key}: ${input.signedHeaders[key]}\n`)
    .join("");

  return (
    headerLines +
    [
      input.method.toUpperCase(),
      input.accept,
      input.contentType,
      input.contentMd5,
      input.pathAndParameters,
    ].join("\n")
  );
}

export interface SignRequestParams {
  method: string;
  pathAndParameters: string;
  body?: string;
  apiAppKey: string;
  apiAppSecret: string;
  algorithm?: HmacAlgorithm;
  date?: Date;
}

export interface SignedHeaders {
  "x-date": string;
  Accept: string;
  "Content-Type": string;
  Authorization: string;
}

export function signRequest(params: SignRequestParams): SignedHeaders {
  const algorithm = params.algorithm ?? "hmac-sha1";
  const xDate = (params.date ?? new Date()).toUTCString();
  const accept = "application/json";
  const contentType = "application/json";
  const contentMd5 =
    params.method.toUpperCase() === "GET" || !params.body ? "" : computeContentMd5(params.body);

  const signingString = buildSigningString({
    signedHeaders: { "x-date": xDate },
    method: params.method,
    accept,
    contentType,
    contentMd5,
    pathAndParameters: params.pathAndParameters,
  });

  const hmacAlgo = algorithm === "hmac-sha1" ? "sha1" : "sha256";
  const signature = createHmac(hmacAlgo, params.apiAppSecret).update(signingString, "utf8").digest("base64");

  return {
    "x-date": xDate,
    Accept: accept,
    "Content-Type": contentType,
    Authorization: `hmac id="${params.apiAppKey}", algorithm="${algorithm}", headers="x-date", signature="${signature}"`,
  };
}

/** Path (termasuk /pudu-entry) + query diurutkan leksikografis, param tanpa nilai ditulis key-nya saja, tanpa "?" kalau kosong. */
export function buildPathAndParameters(path: string, query?: Record<string, string | number | undefined>): string {
  if (!query) return path;
  const keys = Object.keys(query)
    .filter((k) => query[k] !== undefined)
    .sort();
  if (keys.length === 0) return path;
  const parts = keys.map((k) => {
    const value = query[k];
    return value === "" ? k : `${k}=${value}`;
  });
  return `${path}?${parts.join("&")}`;
}
