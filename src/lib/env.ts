import { z } from "zod";

// Variabel PUDU_* dan AUTH_SECRET opsional untuk saat ini karena UI masih
// statis dan nilainya belum ada. Jadi WAJIB (ubah ke required) saat
// adapter PUDU / Better Auth benar-benar dibuat.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
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
