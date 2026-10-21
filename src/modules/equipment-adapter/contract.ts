import type { Prisma } from "../../generated/prisma/client";
import type {
  AdapterCapabilities,
  DispatchCommand,
  DispatchResult,
  InboundMessage,
  InboundResult,
  MissionRef,
  SyncResourcesResult,
} from "./types";

/**
 * Kontrak netral vendor untuk integrasi equipment/robot (FR-05/06/07, ADR
 * Section 3). WCS core (route, worker, API) hanya bicara lewat kontrak ini
 * dan registri (registry.ts) -- tidak pernah mengimpor folder vendor
 * tertentu langsung. Operasi dibatasi ke yang benar-benar dipakai hari ini
 * (lihat docs/ADAPTER_CONTRACT.md untuk rincian per operasi); jangan
 * menambah operasi baru di sini sebelum ada pemanggilnya.
 *
 * Semua operasi menerima `tx` (Prisma.TransactionClient) supaya tulisan ke
 * tabel netral (Mission/Task/TaskStatusHistory/Event/Robot/Equipment) dan
 * tabel milik vendor (mis. Pudu*) tetap satu transaksi dengan pemanggil
 * (worker, route).
 */
export interface EquipmentAdapter {
  /** Kunci registri, dicocokkan tidak peka huruf besar-kecil terhadap Robot.vendor / Integration.name. */
  readonly key: string;

  dispatch(tx: Prisma.TransactionClient, command: DispatchCommand): Promise<DispatchResult>;

  cancel(tx: Prisma.TransactionClient, missionRef: MissionRef): Promise<void>;

  syncResources(): Promise<SyncResourcesResult>;

  handleInbound(tx: Prisma.TransactionClient, message: InboundMessage): Promise<InboundResult>;

  capabilities(): AdapterCapabilities;
}
