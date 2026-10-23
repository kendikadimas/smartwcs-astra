import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";

const authState = vi.hoisted(() => ({ roleName: "WCS_ADMINISTRATOR" }));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: vi.fn(async () => ({
      ok: true as const,
      auth: { userId: "00000000-0000-0000-0000-000000000001", roleName: authState.roleName },
    })),
  };
});

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("GET /api/roles", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
    authState.roleName = "WCS_ADMINISTRATOR";
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("WCS Administrator -> 200, {roleId, name} per baris", async () => {
    await testDb!.role.create({ data: { name: "WAREHOUSE_OPERATOR", permissions: {} } });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/roles"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("WAREHOUSE_OPERATOR");
    expect(typeof body[0].roleId).toBe("string");
  });

  it("role selain WCS Administrator ditolak 403", async () => {
    authState.roleName = "SYSTEM_INTEGRATOR";
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/roles"));
    expect(res.status).toBe(403);
  });
});
