import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.DATABASE_URL;
  delete process.env.PUDU_BASE_URL;
  delete process.env.PUDU_API_APP_KEY;
  delete process.env.PUDU_API_APP_SECRET;
  delete process.env.PUDU_CALLBACK_CODE;
  delete process.env.PUDU_CALLBACK_URL;
  delete process.env.AUTH_SECRET;
  delete (process.env as Record<string, string | undefined>).NODE_ENV;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("env", () => {
  it("lolos saat env valid dan menerapkan default", async () => {
    process.env.DATABASE_URL = "postgresql://wcs:wcs@localhost:5432/smartwcs";

    const { env } = await import("./env");

    expect(env.DATABASE_URL).toBe("postgresql://wcs:wcs@localhost:5432/smartwcs");
    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("menolak kalau DATABASE_URL kosong", async () => {
    await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
  });

  it("PUDU_* dan AUTH_SECRET boleh kosong", async () => {
    process.env.DATABASE_URL = "postgresql://wcs:wcs@localhost:5432/smartwcs";

    const { env } = await import("./env");

    expect(env.PUDU_BASE_URL).toBeUndefined();
    expect(env.PUDU_API_APP_KEY).toBeUndefined();
    expect(env.PUDU_API_APP_SECRET).toBeUndefined();
    expect(env.PUDU_CALLBACK_CODE).toBeUndefined();
    expect(env.PUDU_CALLBACK_URL).toBeUndefined();
    expect(env.AUTH_SECRET).toBeUndefined();
  });

  it("pesan error menyebut nama variabel, tanpa nilainya", async () => {
    process.env.DATABASE_URL = "postgresql://wcs:wcs@localhost:5432/smartwcs";
    process.env.PORT = "rahasia-tidak-boleh-bocor";

    expect.assertions(2);
    try {
      await import("./env");
    } catch (err) {
      expect(String(err)).toMatch(/PORT/);
      expect(String(err)).not.toContain("rahasia-tidak-boleh-bocor");
    }
  });
});
