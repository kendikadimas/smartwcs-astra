import { createHash, createHmac } from "node:crypto";

export type HmacAlgorithm = "hmac-sha1" | "hmac-sha256";

/**
 * Format persis Content-MD5 BELUM TERVERIFIKASI (PUDU_INTEGRATION.md bagian
 * 3 & 9: "contoh JS dan Java di docs PUDU berbeda cara encode"). Implementasi
 * ini pakai konvensi header HTTP Content-MD5 paling umum: base64(MD5(body)).
 * WAJIB diverifikasi lewat healthCheck sebelum dipakai ke endpoint lain --
 * respons 401 PUDU menyertakan StringToSign versi server untuk dibandingkan
 * (lihat client.ts `healthCheck()`). Dipisah jadi fungsi sendiri supaya
 * mudah diganti kalau hasil verifikasi tidak cocok.
 */
export function computeContentMd5(body: string): string {
  return createHash("md5").update(body, "utf8").digest("base64");
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
 * Enam bagian dipisah "\n" sesuai PUDU_INTEGRATION.md bagian 3:
 * Headers, HTTPMethod, Accept, Content-Type, Content-MD5, PathAndParameters.
 * Headers sendiri multi-baris ("key: value\n" per baris, key diurutkan
 * leksikografis). Catatan keterbatasan: dokumentasi PUDU tidak memberi
 * contoh signing string lengkap untuk dicocokkan, jadi format gabungan
 * persis (terutama newline di sekitar blok Headers) belum terverifikasi --
 * lihat laporan akhir, pertanyaan terbuka.
 */
export function buildSigningString(input: SigningStringInput): string {
  const headerLines = Object.keys(input.signedHeaders)
    .sort()
    .map((key) => `${key}: ${input.signedHeaders[key]}\n`)
    .join("");

  return [
    headerLines,
    input.method.toUpperCase(),
    input.accept,
    input.contentType,
    input.contentMd5,
    input.pathAndParameters,
  ].join("\n");
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
