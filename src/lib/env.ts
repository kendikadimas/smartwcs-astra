import { z } from "zod";

// Variabel PUDU_* dan AUTH_SECRET opsional untuk saat ini karena UI masih
// statis dan nilainya belum ada. Jadi WAJIB (ubah ke required) saat
// adapter PUDU / Better Auth benar-benar dibuat.
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

  AUTH_SECRET: z.string().optional(),

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
