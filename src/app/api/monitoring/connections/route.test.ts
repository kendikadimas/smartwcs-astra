import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createIntegrationFixture } from "@/test/fixtures";

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
