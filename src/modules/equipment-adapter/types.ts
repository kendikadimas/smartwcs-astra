// Tipe netral vendor dipakai lintas kontrak adapter dan layanan netral
// (src/modules/task, src/modules/event). Status mentah vendor TIDAK BOLEH
// muncul di sini -- hanya status yang sudah diterjemahkan ke vocabulary WCS
// (Mission.status / Task.status / TaskStatus OpenAPI).

export type DispatchKind = "CALL" | "DELIVERY";

export interface DispatchDestination {
  point: string;
  type?: string;
}

export interface DispatchCommand {
  robotId: string; // Robot.robotId (inti)
  missionId: string; // Mission.missionId, untuk referensi balik dari vendor
  kind: DispatchKind;
  /** Wajib untuk kind="CALL" (satu titik tujuan). */
  targetPoint?: string;
  /** Wajib untuk kind="DELIVERY" (multi-destinasi). */
  destinations?: DispatchDestination[];
  priority?: number;
}

export interface DispatchResult {
  /** ID task di sisi vendor (mis. PuduTask.vendorTaskId), dicatat adapter sendiri -- bukan untuk disimpan WCS core. */
  externalTaskId: string;
  /** Status netral awal (vocabulary WCS), bukan status mentah vendor. */
  status: string;
}

export interface MissionRef {
  missionId: string;
}

export interface SyncResourcesResult {
  robots: Array<{ serialNumber: string; name?: string }>;
  /** Jumlah lokasi/peta vendor yang berhasil disinkronkan -- detail vendor tetap di tabel adapter, cuma ringkasannya yang netral. */
  locationsSynced: number;
}

export interface AdapterCapabilities {
  canCancel: boolean;
  canReportPosition: boolean;
  supportedDispatchKinds: DispatchKind[];
}

/**
 * Pesan masuk ke adapter, dua bentuk:
 * - "raw": langsung dari route callback (header + body mentah), belum
 *   diverifikasi keasliannya oleh WCS core -- adapter yang memverifikasi.
 * - "queued": sudah lolos verifikasi & tersimpan di IntegrationLog (worker
 *   mengambilnya lewat `SELECT ... FOR UPDATE SKIP LOCKED`), adapter cukup
 *   mengurai `data` sesuai `messageType`.
 */
export type InboundMessage =
  | { kind: "raw"; headers: Record<string, string | null>; rawBody: string; receivedAt: Date }
  | { kind: "queued"; messageType: string; data: unknown; integrationLogId: string; occurredAt: Date };

export type InboundResult =
  /** Adapter belum terkonfigurasi (mis. secret kosong) -- dipetakan ke 503. */
  | { kind: "unavailable"; reason: string }
  /** Verifikasi keaslian gagal (mis. CallbackCode salah) -- dipetakan ke 401. */
  | { kind: "unauthorized"; reason: string; traceId: string | null }
  /** Payload tidak valid tapi sumbernya terpercaya -- dipetakan ke 200 (supaya vendor tidak retry data rusak). */
  | { kind: "invalid"; reason: string; traceId: string | null; payload: unknown }
  /** Valid, disimpan ke IntegrationLog (PENDING) untuk diproses worker. */
  | { kind: "queue"; traceId: string | null; messageType: string; payload: unknown }
  /** Sudah diproses tuntas oleh adapter sendiri (mis. notifyRobotPose), tidak perlu disimpan ke IntegrationLog. */
  | { kind: "handled" }
  /** Hasil proses pesan dari antrean (worker) -- efek netral sudah diterapkan oleh adapter. */
  | { kind: "processed" };
