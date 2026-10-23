import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createUserWithPassword } from "@/modules/security/users";

const testDb = hasTestDatabase() ? createTestDb() : null;
const ORIGINAL_ENV = { ...process.env };

describe.skipIf(!hasTestDatabase())("Better Auth integration (login + session)", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function setupRole() {
    return testDb!.role.create({ data: { name: "WAREHOUSE_OPERATOR", permissions: {} } });
  }

  // Timeout dinaikkan (default vitest 5000ms) -- scrypt (hashPassword DAN
  // verifyPassword, dua kali per test) sengaja CPU/memory-hard by design,
  // kadang lewat 5s di bawah beban (full test suite jalan bersamaan).
  it("user dibuat lewat createUserWithPassword bisa login via sign-in/username, session.user.id == userId", async () => {
    const role = await setupRole();
    const user = await testDb!.$transaction((tx) =>
      createUserWithPassword(tx, { username: "testop1", fullName: "Test Operator", password: "sandi-aman-123", roleId: role.roleId }),
    );
    expect(user.id).toBe(user.userId);

    const { auth } = await import("./auth");
    const signInResponse = await auth.api.signInUsername({
      body: { username: "testop1", password: "sandi-aman-123" },
      asResponse: true,
    });
    expect(signInResponse.status).toBe(200);
    const body = await signInResponse.json();
    expect(body.user.id).toBe(user.userId);
    expect(typeof body.token).toBe("string");

    const setCookie = signInResponse.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();

    const session = await auth.api.getSession({ headers: new Headers({ cookie: setCookie!.split(";")[0] }) });
    expect(session?.user.id).toBe(user.userId);
  }, 15000);

  it("password salah ditolak (401/UNAUTHORIZED), tidak membocorkan apakah username ada", async () => {
    const role = await setupRole();
    await testDb!.$transaction((tx) =>
      createUserWithPassword(tx, { username: "testop2", fullName: "Test Operator 2", password: "sandi-aman-123", roleId: role.roleId }),
    );

    const { auth } = await import("./auth");
    const res = await auth.api.signInUsername({
      body: { username: "testop2", password: "salah-password" },
      asResponse: true,
    });
    expect(res.status).toBe(401);
  }, 15000);
});
