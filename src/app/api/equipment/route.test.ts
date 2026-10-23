import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture } from "@/test/fixtures";

// Bagian 1 Fase C: route sekarang butuh sesi+role sungguhan (requireRole).
// Di-mock di sini supaya test fokus ke logika CRUD, bukan Better Auth --
// auth sendiri sudah diuji di src/lib/auth.test.ts. Equipment POST/PATCH/
// DELETE butuh WCS_ADMINISTRATOR (RBAC.md Section 2 & 3).
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

describe.skipIf(!hasTestDatabase())("CRUD /api/equipment", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("alur penuh: create -> list -> detail -> update (EquipmentUpdateRequest) -> delete -> 404", async () => {
    const location = await createLocationFixture(testDb!);
    vi.resetModules();
    const list = await import("./route");

    const createRes = await list.POST(
      makeRequest("http://localhost/api/equipment", {
        method: "POST",
        body: JSON.stringify({ locationId: location.locationId, equipmentType: "CONVEYOR", vendor: "Generic" }),
      }),
    );
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.status).toBe("OFFLINE");

    const listRes = await list.GET(makeRequest(`http://localhost/api/equipment?zoneId=${location.zoneId}`));
    expect(await listRes.json()).toHaveLength(1);

    vi.resetModules();
    const detail = await import("./[equipmentId]/route");
    const patchRes = await detail.PATCH(
      makeRequest("http://localhost/api/equipment/x", { method: "PATCH", body: JSON.stringify({ status: "ONLINE" }) }),
      { params: Promise.resolve({ equipmentId: created.equipmentId }) },
    );
    expect(patchRes.status).toBe(200);
    expect((await patchRes.json()).status).toBe("ONLINE");

    const deleteRes = await detail.DELETE(makeRequest("http://localhost/api/equipment/x"), {
      params: Promise.resolve({ equipmentId: created.equipmentId }),
    });
    expect(deleteRes.status).toBe(204);

    const notFoundRes = await detail.GET(makeRequest("http://localhost/api/equipment/x"), {
      params: Promise.resolve({ equipmentId: created.equipmentId }),
    });
    expect(notFoundRes.status).toBe(404);
  });
});
