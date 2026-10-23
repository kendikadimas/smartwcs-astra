import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createIntegrationFixture } from "@/test/fixtures";

// Bagian 1 Fase C: lihat komentar sama di equipment/route.test.ts. Monitoring
// Read terbuka untuk semua role login.
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: vi.fn(async () => ({
      ok: true as const,
      auth: { userId: "00000000-0000-0000-0000-000000000001", roleName: "WCS_ADMINISTRATOR" },
    })),
  };
});

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("GET /api/monitoring/connections", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("mengembalikan systemName/status/lastSeenAt per integration", async () => {
    await createIntegrationFixture(testDb!, { name: "PUDU" });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/monitoring/connections"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].systemName).toBe("PUDU");
    expect(body[0].status).toBe("DISCONNECTED");
  });
});
