import { z } from "zod";

// Variabel PUDU_* opsional untuk saat ini karena belum ada API key PUDU
// asli. AUTH_SECRET sekarang WAJIB (Bagian 1, Better Auth benar-benar
// dipasang) -- aplikasi tidak boleh start tanpanya.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Database terpisah untuk test integrasi (Vitest), supaya test tidak
  // menulis ke database dev. Opsional: test integrasi yang butuh ini skip
  // sendiri kalau kosong (lihat src/test/db.ts).
  TEST_DATABASE_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // Bagian 1: kunci enkripsi sesi/token Better Auth (ADR Section 9.1).
  // Minimal 32 karakter -- rekomendasi resmi Better Auth untuk secret HMAC.
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET minimal 32 karakter"),
  // Base URL server ini sendiri -- dibutuhkan Better Auth untuk membangun
  // URL callback/cookie domain. Default ke localhost:PORT kalau kosong
  // (dev); WAJIB diisi eksplisit di produksi (domain publik sebenarnya).
  AUTH_BASE_URL: z.string().optional(),

  // Bagian 1: dipakai prisma/seed.ts untuk membuat user admin awal --
  // TIDAK PERNAH hardcode password di kode (CLAUDE.md aturan #11).
  ADMIN_USERNAME: z.string().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().min(8).optional(),

  PUDU_BASE_URL: z.string().optional(),
  PUDU_API_APP_KEY: z.string().optional(),
  PUDU_API_APP_SECRET: z.string().optional(),
  PUDU_CALLBACK_CODE: z.string().optional(),
  PUDU_CALLBACK_URL: z.string().optional(),

  // Worker pengurai callback (ADR Section 9.2). Batas percobaan sebelum
  // baris IntegrationLog berstatus FAILED berhenti di-retry otomatis.
  PUDU_WORKER_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  PUDU_WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),

  // Dispatch (pudu/index.ts): PuduRobotState dianggap basi kalau lebih tua
  // dari ini -- dipicu getRobotStatusV2 dulu sebelum cek run_state. Nilai
  // default keputusan sendiri (tidak ada rujukan dokumen resmi), lihat
  // laporan akhir.
  PUDU_ROBOT_STATE_STALE_MS: z.coerce.number().int().positive().default(60_000),

  // Fase E -- worker: kirim ulang NotifyRobotReportPosition untuk robot
  // online sebelum interval x times habis, dan jarak antar siklus
  // sinkronisasi penuh (shop/robot/peta lewat syncResources()). Batas
  // interval (bulat >= 1 detik) dan times (bulat, maks 1000) DIKONFIRMASI
  // PUDU_OFFICIAL_EXCERPT.md bagian D -- `.int().positive()` sudah
  // menjamin bilangan bulat >= 1 (sejak Fase E task sebelumnya; diverifikasi
  // ulang di task ini, TIDAK perlu diubah). Nilai DEFAULT (2 detik, 600x)
  // tetap keputusan sendiri -- dokumen resmi hanya memberi batas, bukan
  // rekomendasi nilai.
  PUDU_POSE_REPORT_INTERVAL_SECONDS: z.coerce.number().int().positive().default(2),
  PUDU_POSE_REPORT_TIMES: z.coerce.number().int().positive().max(1000).default(600),
  PUDU_POSE_REPORT_REFRESH_MS: z.coerce.number().int().positive().default(10 * 60_000),
  PUDU_SYNC_INTERVAL_MS: z.coerce.number().int().positive().default(5 * 60_000),

  // Fase E -- rekonsiliasi task CALL yang tidak kunjung dapat callback
  // status final: CHECK_AFTER_MS = sudah berapa lama sejak dibuat sebelum
  // dicek ulang lewat GetCallList; TIMEOUT_MS = batas sebelum WCS menyerah
  // dan menandai FAILED/TASK_TIMEOUT sendiri -- PUDU_OFFICIAL_EXCERPT.md
  // InitiateCallTask poin 1: PUDU sendiri menggagalkan task otomatis 30
  // menit sejak dibuat, jadi default TIMEOUT_MS sedikit di atas itu.
  PUDU_TASK_RECONCILE_CHECK_AFTER_MS: z.coerce.number().int().positive().default(3 * 60_000),
  PUDU_TASK_RECONCILE_TIMEOUT_MS: z.coerce.number().int().positive().default(35 * 60_000),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Environment variable tidak valid: ${names.join(", ")}`);
  }
  return result.data;
}

// Server-only: jangan import dari Client Component. UI saat ini masih
// statis (data mock), jadi belum ada risiko ini ke-bundle ke klien, tapi
// tetap jangan dilanggar begitu halaman mulai fetch data asli.
export const env = parseEnv();
export type Env = typeof env;
