import { describe, expect, it } from "vitest";
import type { PrismaClient } from "../../generated/prisma/client";
import type { EquipmentAdapter } from "./contract";

/**
 * Rangkaian test kontrak bersama -- dijalankan terhadap adapter PUDU
 * (dengan mock HTTP) dan adapter fake lewat config yang berbeda,
 * memeriksa PERILAKU KONTRAK yang sama. Tidak menguji detail implementasi
 * vendor (format HMAC, dll -- itu test khas masing-masing adapter).
 */
export interface ContractTestSuiteConfig {
  /** Nama adapter, dipakai sebagai label describe(). */
  name: string;
  /** true kalau rangkaian ini harus di-skip (mis. TEST_DATABASE_URL kosong). */
  skip?: boolean;
  /** Prisma client (test db) dipakai sebagai `tx` -- tiap test boleh menulis bebas, dibersihkan test lain lewat truncate di beforeEach pemanggil. */
  db: PrismaClient;
  getAdapter: () => EquipmentAdapter | Promise<EquipmentAdapter>;
  /** Siapkan satu Robot + Mission valid untuk dispatch/cancel. */
  setup: () => Promise<{ robotId: string; missionId: string }>;
  /** Pesan "raw" yang harus lolos autentikasi (hasilnya queue atau handled, bukan unauthorized/unavailable). */
  validRawMessage: () => { headers: Record<string, string | null>; rawBody: string };
  /** Pesan "raw" yang harus gagal autentikasi. */
  unauthorizedRawMessage: () => { headers: Record<string, string | null>; rawBody: string };
}

export function runAdapterContractTests(config: ContractTestSuiteConfig): void {
  describe.skipIf(config.skip)(`Kontrak adapter: ${config.name}`, () => {
    it("capabilities() mengembalikan bentuk AdapterCapabilities", async () => {
      const adapter = await config.getAdapter();
      const caps = adapter.capabilities();
      expect(typeof caps.canCancel).toBe("boolean");
      expect(typeof caps.canReportPosition).toBe("boolean");
      expect(Array.isArray(caps.supportedDispatchKinds)).toBe(true);
    });

    it("dispatch() mengembalikan externalTaskId dan status netral (string, bukan kosong)", async () => {
      const adapter = await config.getAdapter();
      const { robotId, missionId } = await config.setup();

      const result = await adapter.dispatch(config.db, {
        robotId,
        missionId,
        kind: "CALL",
        targetPoint: "P1",
      });

      expect(typeof result.externalTaskId).toBe("string");
      expect(result.externalTaskId.length).toBeGreaterThan(0);
      expect(typeof result.status).toBe("string");
    });

    it("cancel() pada missionId yang tidak punya task vendor tidak melempar error", async () => {
      const adapter = await config.getAdapter();
      await expect(adapter.cancel(config.db, { missionId: "00000000-0000-0000-0000-000000000000" })).resolves.not.toThrow();
    });

    it("handleInbound('raw') dengan pesan sah tidak mengembalikan unauthorized/unavailable", async () => {
      const adapter = await config.getAdapter();
      const msg = config.validRawMessage();

      const result = await adapter.handleInbound(config.db, {
        kind: "raw",
        headers: msg.headers,
        rawBody: msg.rawBody,
        receivedAt: new Date(),
      });

      expect(result.kind).not.toBe("unauthorized");
      expect(result.kind).not.toBe("unavailable");
    });

    it("handleInbound('raw') dengan pesan tidak sah mengembalikan unauthorized", async () => {
      const adapter = await config.getAdapter();
      const msg = config.unauthorizedRawMessage();

      const result = await adapter.handleInbound(config.db, {
        kind: "raw",
        headers: msg.headers,
        rawBody: msg.rawBody,
        receivedAt: new Date(),
      });

      expect(result.kind).toBe("unauthorized");
    });

    it("handleInbound('queued') dengan messageType tak dikenal melempar error (bukan diam-diam diabaikan)", async () => {
      const adapter = await config.getAdapter();
      await expect(
        adapter.handleInbound(config.db, {
          kind: "queued",
          messageType: "messageType-tidak-pernah-ada-xyz",
          data: {},
          integrationLogId: "00000000-0000-0000-0000-000000000000",
          occurredAt: new Date(),
        }),
      ).rejects.toThrow();
    });
  });
}
