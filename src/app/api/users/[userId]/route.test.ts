import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createUserFixture } from "@/test/fixtures";

// userId harus user NYATA -- PATCH menulis AuditLog (FK ke User).
const authState = vi.hoisted(() => ({ roleName: "WCS_ADMINISTRATOR", userId: "pending" }));
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    requireAuth: vi.fn(async () => ({
      ok: true as const,
      auth: { userId: authState.userId, roleName: authState.roleName },
    })),
  };
});

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("GET/PATCH/DELETE /api/users/[userId]", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
    authState.roleName = "WCS_ADMINISTRATOR";
    authState.userId = (await createUserFixture(testDb!, { roleName: "WCS_ADMINISTRATOR" })).userId;
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("PATCH ubah role & DELETE menonaktifkan (bukan menghapus baris)", async () => {
    const user = await createUserFixture(testDb!, { roleName: "WAREHOUSE_OPERATOR" });
    await testDb!.role.create({ data: { name: "WAREHOUSE_SUPERVISOR", permissions: {} } });

    vi.resetModules();
    const { PATCH, DELETE } = await import("./route");

    const patchRes = await PATCH(
      makeRequest(`http://localhost/api/users/${user.userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: "WAREHOUSE_SUPERVISOR" }),
      }),
      { params: Promise.resolve({ userId: user.userId }) },
    );
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).role).toBe("WAREHOUSE_SUPERVISOR");

    const deleteRes = await DELETE(makeRequest(`http://localhost/api/users/${user.userId}`), {
      params: Promise.resolve({ userId: user.userId }),
    });
    expect(deleteRes.status).toBe(204);

    const stillExists = await testDb!.user.findUnique({ where: { userId: user.userId } });
    expect(stillExists).not.toBeNull();
    expect(stillExists!.active).toBe(false);
  });

  it("role selain WCS Administrator ditolak 403", async () => {
    const user = await createUserFixture(testDb!, { roleName: "WAREHOUSE_OPERATOR" });
    authState.roleName = "MAINTENANCE_ENGINEER";

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest(`http://localhost/api/users/${user.userId}`), {
      params: Promise.resolve({ userId: user.userId }),
    });
    expect(res.status).toBe(403);
  });

  it("404 kalau userId tidak ditemukan", async () => {
    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/users/x"), {
      params: Promise.resolve({ userId: "00000000-0000-0000-0000-000000000099" }),
    });
    expect(res.status).toBe(404);
  });
});
