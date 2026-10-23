import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createUserFixture } from "@/test/fixtures";

// Role (DAN userId) yang "login" bisa diganti per test lewat authState (lihat
// pola yang sama di alarms/route.test.ts) -- /users butuh menguji role yang
// diizinkan (WCS_ADMINISTRATOR) DAN yang ditolak (role lain -> 403). userId
// harus user NYATA karena POST/PATCH menulis AuditLog (FK ke User).
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

describe.skipIf(!hasTestDatabase())("GET/POST /api/users", () => {
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

  it("RBAC.md Section 3: GET/POST /users ditolak 403 untuk role selain WCS Administrator", async () => {
    authState.roleName = "WAREHOUSE_OPERATOR";
    vi.resetModules();
    const { GET, POST } = await import("./route");

    const getRes = await GET(makeRequest("http://localhost/api/users"));
    expect(getRes.status).toBe(403);

    const postRes = await POST(
      makeRequest("http://localhost/api/users", {
        method: "POST",
        body: JSON.stringify({ username: "x", password: "password123", fullName: "X", role: "WAREHOUSE_OPERATOR" }),
      }),
    );
    expect(postRes.status).toBe(403);
  });

  it("POST membuat user baru (WCS Administrator) -> 201, role & audit log tercatat", async () => {
    await testDb!.role.create({ data: { name: "WAREHOUSE_OPERATOR", permissions: {} } });

    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest("http://localhost/api/users", {
        method: "POST",
        body: JSON.stringify({
          username: "operator1",
          password: "password123",
          fullName: "Operator Satu",
          role: "WAREHOUSE_OPERATOR",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.username).toBe("operator1");
    expect(body.role).toBe("WAREHOUSE_OPERATOR");
    expect(body.active).toBe(true);
    expect(body).not.toHaveProperty("passwordHash");

    const audit = await testDb!.auditLog.findFirst({ where: { action: "USER_CREATED" } });
    expect(audit).not.toBeNull();
    expect(audit!.targetId).toBe(body.userId);
  });

  it("POST dengan username yang sudah dipakai -> 409", async () => {
    const role = await testDb!.role.create({ data: { name: "WAREHOUSE_OPERATOR", permissions: {} } });
    await testDb!.user.create({
      data: {
        userId: "00000000-0000-0000-0000-0000000000aa",
        id: "00000000-0000-0000-0000-0000000000aa",
        username: "dupe",
        fullName: "Dupe",
        email: "dupe@users.smartwcs.internal",
        passwordHash: "x",
        roleId: role.roleId,
      },
    });

    vi.resetModules();
    const { POST } = await import("./route");
    const res = await POST(
      makeRequest("http://localhost/api/users", {
        method: "POST",
        body: JSON.stringify({ username: "dupe", password: "password123", fullName: "Dupe 2", role: "WAREHOUSE_OPERATOR" }),
      }),
    );
    expect(res.status).toBe(409);
  });

  it("GET list mengembalikan user tanpa field password", async () => {
    // beforeEach sudah membuat satu user admin (acting user) -- jadi list
    // berisi 2 baris: admin itu + op2 di bawah.
    const role = await testDb!.role.create({ data: { name: "WAREHOUSE_OPERATOR", permissions: {} } });
    await testDb!.user.create({
      data: {
        userId: "00000000-0000-0000-0000-0000000000bb",
        id: "00000000-0000-0000-0000-0000000000bb",
        username: "op2",
        fullName: "Op Dua",
        email: "op2@users.smartwcs.internal",
        passwordHash: "x",
        roleId: role.roleId,
      },
    });

    vi.resetModules();
    const { GET } = await import("./route");
    const res = await GET(makeRequest("http://localhost/api/users"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    const op2 = body.find((u: { username: string }) => u.username === "op2");
    expect(op2).not.toHaveProperty("passwordHash");
  });
});
