import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";

// Bagian 1 Fase C: lihat komentar sama di equipment/route.test.ts.
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

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("CRUD /api/materials", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("alur penuh: create -> list -> update -> delete -> 404", async () => {
    vi.resetModules();
    const list = await import("./route");
    const createRes = await list.POST(
      makeRequest("http://localhost/api/materials", {
        method: "POST",
        body: JSON.stringify({ sku: "SKU-1", name: "Material 1", unit: "pcs" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();

    const listRes = await list.GET(makeRequest("http://localhost/api/materials"));
    expect(await listRes.json()).toHaveLength(1);

    vi.resetModules();
    const detail = await import("./[materialId]/route");
    const patchRes = await detail.PATCH(
      makeRequest("http://localhost/api/materials/x", { method: "PATCH", body: JSON.stringify({ name: "Material 1 B" }) }),
      { params: Promise.resolve({ materialId: created.materialId }) },
    );
    expect((await patchRes.json()).name).toBe("Material 1 B");

    const deleteRes = await detail.DELETE(makeRequest("http://localhost/api/materials/x"), {
      params: Promise.resolve({ materialId: created.materialId }),
    });
    expect(deleteRes.status).toBe(204);

    const notFoundRes = await detail.PATCH(
      makeRequest("http://localhost/api/materials/x", { method: "PATCH", body: JSON.stringify({ name: "x" }) }),
      { params: Promise.resolve({ materialId: created.materialId }) },
    );
    expect(notFoundRes.status).toBe(404);
  });
});
