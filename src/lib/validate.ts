import type { z } from "zod";
import { apiError } from "./api-response";

/**
 * Parse body JSON request terhadap skema Zod. Mengembalikan `{ data }` kalau
 * valid, atau `{ error: Response }` (400, format konsisten lewat apiError)
 * kalau body bukan JSON atau tidak lolos validasi -- dipanggil dengan
 * `if ("error" in result) return result.error;`.
 */
export async function parseJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ data: T } | { error: Response }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: apiError(400, "INVALID_JSON", "Body bukan JSON valid") };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    return { error: apiError(400, "VALIDATION_ERROR", message) };
  }
  return { data: parsed.data };
}
