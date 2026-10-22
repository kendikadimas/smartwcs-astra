import { z } from "zod";
import { logger } from "../../../lib/logger";

// Skema `data` untuk 5 API peta, berdasarkan contoh respons resmi
// PUDU_OFFICIAL_EXCERPT.md bagian C. `.passthrough()` di setiap level --
// field yang belum dikenal diabaikan, BUKAN ditolak (dokumen bisa menambah
// field baru tanpa mematahkan parsing).

export const storeMapListDataSchema = z
  .object({
    count: z.number().optional(),
    list: z.array(z.object({ map_name: z.string() }).passthrough()),
  })
  .passthrough();

// AvailableMaps: `is_used` (1 atau 2) disimpan MENTAH, arti persisnya
// belum dijelaskan dokumen resmi -- jangan ditafsirkan jadi boolean di sini.
export const availableMapsDataSchema = z
  .object({
    shop_id: z.union([z.string(), z.number()]).optional(),
    list: z
      .array(
        z
          .object({
            name: z.string(),
            floor: z.string().optional(),
            is_used: z.union([z.number(), z.string()]).optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

// Koordinat elemen peta -- array angka panjang variabel (3 untuk titik,
// bisa 8+ untuk area/polygon pada contoh resmi GetMapDetailV2). Arti
// persis setiap angka BELUM dijelaskan dokumen (lihat extractXYZFromVector).
const mapElementVectorSchema = z.array(z.number());

export const currentMapDataSchema = z
  .object({
    name: z.string(),
    floor: z.string().optional(),
    shop_id: z.union([z.string(), z.number()]).optional(),
    elements: z
      .array(
        z
          .object({
            type: z.string(),
            id: z.string(),
            name: z.string(),
            mode: z.string().optional(),
            group: z.unknown().optional(),
            // CurrentMap memakai kunci "vector" (BUKAN "vector_list" seperti GetMapDetailV2).
            vector: mapElementVectorSchema.optional(),
            width: z.number().optional(),
            max_speed: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const getMapDetailV2DataSchema = z
  .object({
    map_name: z.string(),
    map_code: z.string().optional(),
    url: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    resolution: z.number().optional(),
    origin_list: z.array(z.number()).optional(),
    zone_list: z.array(z.unknown()).optional(),
    element_list: z
      .array(
        z
          .object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            mode: z.string().optional(),
            // GetMapDetailV2 memakai kunci "vector_list" (BUKAN "vector" seperti CurrentMap).
            vector_list: mapElementVectorSchema.optional(),
            // Array objek {x,y,z} pada contoh resmi, bukan array angka -- disimpan mentah di geometry.
            clean_path_list: z.array(z.unknown()).optional(),
            group: z.unknown().optional(),
            width: z.number().optional(),
            max_speed: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

export const getCurrentMapPointsDataSchema = z
  .object({
    total: z.number().optional(),
    list: z.array(
      z
        .object({
          name: z.string(),
          type: z.string().optional(),
          x: z.number().optional(),
          y: z.number().optional(),
          z: z.number().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

/**
 * Normalisasi SATU TEMPAT untuk membaca x/y/z dari `vector` (CurrentMap)
 * atau `vector_list` (GetMapDetailV2) -- dipakai syncMaps (sync.ts) untuk
 * GetMapDetailV2.element_list, dan siap dipakai kalau CurrentMap.elements
 * ikut diproses nanti. Arti 3 angka pertama BELUM dijelaskan dokumen resmi
 * (contoh resmi: titik punya 3 angka, area/polygon punya 8+ -- tidak jelas
 * apakah elemen "titik" itu x/y/yaw atau sesuatu yang lain) -- diisi apa
 * adanya ke kolom x/y/z PuduMapElement, array LENGKAP tetap disimpan mentah
 * di `geometry` oleh pemanggil, supaya tidak ada informasi yang hilang
 * kalau tafsirannya ternyata salah.
 */
export function extractXYZFromVector(vector: number[] | undefined): { x?: number; y?: number; z?: number } {
  if (!vector || vector.length === 0) return {};
  return { x: vector[0], y: vector[1], z: vector[2] };
}

/**
 * Parse `data` terhadap skema; kalau tidak cocok, log respons mentah
 * (tanpa rahasia -- API peta tidak pernah membawa secret) dan lempar error
 * jelas. Pemanggil (syncMaps) menangkap ini PER PETA supaya satu peta yang
 * bentuknya aneh tidak menggagalkan sinkronisasi peta lain.
 */
export function parseMapData<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    logger.warn(
      { context, rawData: data, issues: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) },
      "respons API peta PUDU tidak cocok skema yang diharapkan",
    );
    throw new Error(
      `Respons ${context} tidak cocok skema yang diharapkan (${result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")})`,
    );
  }
  return result.data;
}
