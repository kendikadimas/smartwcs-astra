// Pemetaan status mentah PUDU -> status WCS (Mission.status / Task.status).
// Fungsi murni, tanpa akses database. Sumber tabel: PUDU_INTEGRATION.md
// bagian 7 -- "usulan, verifikasi dengan data nyata". Status PUDU yang
// belum ada di tabel itu TIDAK melempar error: dikembalikan sebagai
// recognized=false supaya pemanggil mencatat Event peringatan dan tetap
// menyimpan status mentahnya (lihat task-status.ts).

export interface StatusMapResult {
  missionStatus: string;
  taskStatus: string;
  failureCode?: string;
  recognized: boolean;
}

type MappingRow = Omit<StatusMapResult, "recognized">;

// Kunci diseragamkan huruf besar. Beberapa status PUDU di dokumentasi
// ditulis sebagai beberapa alias untuk hasil yang sama (mis. CALL_SUCCESS /
// COMPLETE / COMPLETED semua -> COMPLETED) -- masing-masing didaftarkan
// sebagai entri terpisah, bukan dicocokkan dengan regex, supaya tabel ini
// tetap jadi daftar nilai eksplisit yang mudah dicek ulang dengan data nyata.
const STATUS_MAP: Record<string, MappingRow> = {
  QUEUEING: { missionStatus: "ACCEPTED", taskStatus: "DISPATCHED" },
  CALLING: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  ON_THE_WAY: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  CALL_SUCCESS: { missionStatus: "COMPLETED", taskStatus: "COMPLETED" },
  COMPLETE: { missionStatus: "COMPLETED", taskStatus: "COMPLETED" },
  COMPLETED: { missionStatus: "COMPLETED", taskStatus: "COMPLETED" },
  CANCEL: { missionStatus: "CANCELLED", taskStatus: "CANCELLED" },
  FAIL: { missionStatus: "FAILED", taskStatus: "FAILED", failureCode: "RESOURCE_ERROR" },
  FAILED: { missionStatus: "FAILED", taskStatus: "FAILED", failureCode: "RESOURCE_ERROR" },
  PAUSE: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
};

// Baris pertama tabel ("response sukses saat create task") bukan token
// status, melainkan kondisi awal saat PuduTask baru dibuat (sebelum ada
// field status dari PUDU) -- lihat INITIAL_TASK_STATE di task-status.ts,
// dipakai saat insert, bukan lewat mapPuduStatus().
export const INITIAL_TASK_STATE: MappingRow = {
  missionStatus: "SUBMITTED",
  taskStatus: "DISPATCHED",
};

export function mapPuduStatus(rawStatus: string): StatusMapResult {
  const row = STATUS_MAP[rawStatus.trim().toUpperCase()];
  if (!row) {
    return { missionStatus: "", taskStatus: "", recognized: false };
  }
  return { ...row, recognized: true };
}
