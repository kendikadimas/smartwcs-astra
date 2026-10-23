import { describe, expect, it, vi } from "vitest";

// Unit test requireRole() -- murni logika guard (login + cek role), tanpa
// DB/Better Auth sungguhan (requireAuth di-mock), beda dari auth.test.ts
// yang menguji integrasi Better Auth sungguhan.
vi.mock("./auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./auth")>();
  return { ...actual, requireAuth: vi.fn() };
});

describe("requireRole", () => {
  it("meneruskan hasil 401 dari requireAuth kalau tidak ada sesi", async () => {
    const { requireAuth } = await import("./auth");
    const { requireRole, ROLE } = await import("./rbac");
    vi.mocked(requireAuth).mockResolvedValue({
      ok: false,
      response: new Response(null, { status: 401 }) as never,
    });

    const result = await requireRole(new Request("http://localhost/x"), [ROLE.WCS_ADMINISTRATOR]);
    expect(result.ok).toBe(false);
  });

  it("403 kalau role login tidak ada di allowedRoles", async () => {
    const { requireAuth } = await import("./auth");
    const { requireRole, ROLE } = await import("./rbac");
    vi.mocked(requireAuth).mockResolvedValue({
      ok: true,
      auth: { userId: "u1", roleName: "WAREHOUSE_OPERATOR" },
    });

    const result = await requireRole(new Request("http://localhost/x"), [ROLE.WCS_ADMINISTRATOR]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("lolos kalau role login ada di allowedRoles", async () => {
    const { requireAuth } = await import("./auth");
    const { requireRole, ROLE } = await import("./rbac");
    vi.mocked(requireAuth).mockResolvedValue({
      ok: true,
      auth: { userId: "u1", roleName: "WCS_ADMINISTRATOR" },
    });

    const result = await requireRole(new Request("http://localhost/x"), [ROLE.WCS_ADMINISTRATOR]);
    expect(result.ok).toBe(true);
  });

  it("allowedRoles kosong -> role apa pun yang login lolos", async () => {
    const { requireAuth } = await import("./auth");
    const { requireRole } = await import("./rbac");
    vi.mocked(requireAuth).mockResolvedValue({
      ok: true,
      auth: { userId: "u1", roleName: "MAINTENANCE_ENGINEER" },
    });

    const result = await requireRole(new Request("http://localhost/x"), []);
    expect(result.ok).toBe(true);
  });
});
