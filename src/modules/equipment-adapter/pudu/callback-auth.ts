import { timingSafeEqual } from "node:crypto";

// Header CallbackCode PUDU: string rahasia, dibandingkan dengan
// crypto.timingSafeEqual (bukan ===) supaya waktu komparasi tidak membocorkan
// berapa banyak karakter yang cocok. Panjang beda -> langsung tidak valid
// (kebocoran info panjang dianggap dapat diterima, sama seperti pola umum
// verifikasi webhook signature).
export function verifyCallbackCode(received: string | null, expected: string): boolean {
  if (!received) return false;
  const receivedBuf = Buffer.from(received, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (receivedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(receivedBuf, expectedBuf);
}
