import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createUserFixture } from "@/test/fixtures";

// Tidak mock @/lib/auth di sini -- route ini ADALAH lapisan auth itu sendiri
// (membungkus Better Auth sungguhan ke bentuk {accessToken, expiresIn} per
// openapi-smart-wcs.yaml), jadi harus diuji lewat Better Auth asli seperti
// src/lib/auth.test.ts, bukan di-mock.
const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", { method: "POST", body: JSON.stringify(body) });
}

describe.skipIf(!hasTestDatabase())("POST /api/auth/login", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it(
    "login sukses -> {accessToken, expiresIn} + Set-Cookie, AuditLog LOGIN_SUCCESS",
    async () => {
      await createUserFixture(testDb!, { roleName: "WCS_ADMINISTRATOR", username: "login_ok" });

      vi.resetModules();
      const { POST } = await import("./route");
      const res = await POST(makeRequest({ username: "login_ok", password: "test-password-123" }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.accessToken).toBe("string");
      expect(body.accessToken.length).toBeGreaterThan(0);
      expect(body.expiresIn).toBeGreaterThan(0);
      expect(res.headers.get("set-cookie")).toBeTruthy();

      const audit = await testDb!.auditLog.findFirst({ where: { action: "LOGIN_SUCCESS" } });
      expect(audit).not.toBeNull();
      expect(audit!.result).toBe("SUCCESS");
    },
    15000,
  );

  it(
    "password salah -> 401, AuditLog LOGIN_FAILED (userId null)",
    async () => {
      await createUserFixture(testDb!, { roleName: "WCS_ADMINISTRATOR", username: "login_bad" });

      vi.resetModules();
      const { POST } = await import("./route");
      const res = await POST(makeRequest({ username: "login_bad", password: "salah-sekali" }));
      expect(res.status).toBe(401);

      const audit = await testDb!.auditLog.findFirst({ where: { action: "LOGIN_FAILED" } });
      expect(audit).not.toBeNull();
      expect(audit!.result).toBe("FAILED");
    },
    15000,
  );

  it("body tanpa password -> 400 VALIDATION_ERROR", async () => {
    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(makeRequest({ username: "x" }));
    expect(res.status).toBe(400);
  });
});
