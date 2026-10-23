import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createUserFixture } from "@/test/fixtures";

// Tidak di-mock (lihat alasan sama di auth/login/route.test.ts) -- endpoint
// ini butuh cookie sesi Better Auth sungguhan (login dulu di setiap test),
// requireAuth asli sudah cukup mengenali cookie itu tanpa perlu di-mock.
const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("PATCH /api/users/me/password", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function loginAndGetCookie(username: string, password: string) {
    const { auth } = await import("@/lib/auth");
    const res = await auth.api.signInUsername({ body: { username, password }, asResponse: true });
    return res.headers.get("set-cookie")!.split(";")[0];
  }

  it(
    "oldPassword benar -> 200, password baru bisa login; oldPassword salah -> 401",
    async () => {
      await createUserFixture(testDb!, { roleName: "WAREHOUSE_OPERATOR", username: "pwuser" });
      const cookie = await loginAndGetCookie("pwuser", "test-password-123");

      vi.resetModules();
      const { PATCH } = await import("./route");

      const badRes = await PATCH(
        new Request("http://localhost/api/users/me/password", {
          method: "PATCH",
          headers: { cookie },
          body: JSON.stringify({ oldPassword: "salah", newPassword: "password-baru-456" }),
        }),
      );
      expect(badRes.status).toBe(401);

      const okRes = await PATCH(
        new Request("http://localhost/api/users/me/password", {
          method: "PATCH",
          headers: { cookie },
          body: JSON.stringify({ oldPassword: "test-password-123", newPassword: "password-baru-456" }),
        }),
      );
      expect(okRes.status).toBe(200);

      const { auth } = await import("@/lib/auth");
      const signIn = await auth.api.signInUsername({
        body: { username: "pwuser", password: "password-baru-456" },
        asResponse: true,
      });
      expect(signIn.status).toBe(200);
    },
    15000,
  );
});
