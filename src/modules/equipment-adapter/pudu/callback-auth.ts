import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time verification of PUDU CallbackCode to prevent timing attacks.
 */
export function verifyCallbackCode(received: string | null, expected: string): boolean {
  if (!received) return false;
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
