// Pemetaan status mentah PUDU -> status WCS (Mission.status / Task.status).
// Fungsi murni, tanpa akses database. Dipecah CALL vs DELIVERY karena
// kosakata keduanya BERBEDA dan sebagian bertumpukan secara menyesatkan
// (mis. CALL "COMPLETE"/"CALL_COMPLETE" vs DELIVERY "COMPLETED") --
// PUDU_OFFICIAL_EXCERPT.md: InitiateCallTask (Res.data.state),
// GetCallList (Res.data.list.status), CallStatus-notifyCustomCall
// (Params.data.state) untuk CALL; DeliveryTask-notifyDeliveryTask
// (Params.data.task_status) untuk DELIVERY. Status PUDU yang belum ada di
// tabel TIDAK melempar error: dikembalikan recognized=false supaya
// pemanggil mencatat Event peringatan dan tetap menyimpan status mentahnya
// (lihat task-status.ts).

export interface StatusMapResult {
  missionStatus: string;
  taskStatus: string;
  failureCode?: string;
  recognized: boolean;
}

type MappingRow = Omit<StatusMapResult, "recognized">;

function lookup(map: Record<string, MappingRow>, rawStatus: string): StatusMapResult {
  const row = map[rawStatus.trim().toUpperCase()];
  if (!row) return { missionStatus: "", taskStatus: "", recognized: false };
  return { ...row, recognized: true };
}

// CALL (InitiateCallTask / notifyCustomCall / GetCallList), excerpt:
// "CALLING": calling, "CALL_SUCCESS": robot merespons sukses (BUKAN
// selesai), "QUEUEING" (respons API) / "QUEUING" (callback, ejaan beda di
// dokumen resmi sendiri), "CALL_FAILED": gagal, "CALL_COMPLETE": selesai
// (GetCallList memakai "COMPLETE" di contoh respons -- alias, dicatat
// terpisah sesuai excerpt, bukan ditebak sama), "QUEUING_CANCEL" /
// "TASK_CANCEL": dibatalkan WCS/sistem, "ROBOT_CANCEL": dibatalkan robot
// (lebih spesifik dari TASK_CANCEL -- lihat task-status.ts). "PAUSE" dan
// "ARRIVE" cuma dilaporkan robot P-ONE.
const CALL_STATUS_MAP: Record<string, MappingRow> = {
  QUEUEING: { missionStatus: "ACCEPTED", taskStatus: "DISPATCHED" },
  QUEUING: { missionStatus: "ACCEPTED", taskStatus: "DISPATCHED" },
  CALLING: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  CALL_SUCCESS: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  ARRIVE: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  PAUSE: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  CALL_COMPLETE: { missionStatus: "COMPLETED", taskStatus: "COMPLETED" },
  // Alias dari contoh respons resmi GetCallList ("status": "COMPLETE"),
  // dokumen sendiri tidak konsisten antara daftar nilai (CALL_COMPLETE) dan
  // contoh (COMPLETE) -- didaftarkan terpisah, bukan ditebak sama persis.
  COMPLETE: { missionStatus: "COMPLETED", taskStatus: "COMPLETED" },
  CALL_FAILED: { missionStatus: "FAILED", taskStatus: "FAILED", failureCode: "RESOURCE_ERROR" },
  QUEUING_CANCEL: { missionStatus: "CANCELLED", taskStatus: "CANCELLED" },
  TASK_CANCEL: { missionStatus: "CANCELLED", taskStatus: "CANCELLED" },
  ROBOT_CANCEL: { missionStatus: "CANCELLED", taskStatus: "CANCELLED" },
};

// DELIVERY (DeliveryTask / notifyDeliveryTask task_status), excerpt:
// "ON_THE_WAY": sedang jalan, "CANCEL": dibatalkan, "FAILED": gagal (robot
// menolak task, diupdate cloud), "COMPLETED": selesai, "PAUSE": berhenti
// sementara. Status per-destinasi (AWAIT/ON_THE_WAY/ARRIVED/CANCEL/COMPLETE)
// TIDAK memengaruhi status Task -- disimpan mentah di PuduTaskStop saja
// (lihat parsers.ts handleNotifyDeliveryTask).
const DELIVERY_STATUS_MAP: Record<string, MappingRow> = {
  ON_THE_WAY: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  PAUSE: { missionStatus: "RUNNING", taskStatus: "RUNNING" },
  COMPLETED: { missionStatus: "COMPLETED", taskStatus: "COMPLETED" },
  CANCEL: { missionStatus: "CANCELLED", taskStatus: "CANCELLED" },
  FAILED: { missionStatus: "FAILED", taskStatus: "FAILED", failureCode: "RESOURCE_ERROR" },
};

export function mapCallStatus(rawStatus: string): StatusMapResult {
  return lookup(CALL_STATUS_MAP, rawStatus);
}

export function mapDeliveryStatus(rawStatus: string): StatusMapResult {
  return lookup(DELIVERY_STATUS_MAP, rawStatus);
}

// Baris pertama tabel resmi InitiateCallTask ("response sukses saat create
// task") bukan token status, melainkan kondisi awal saat PuduTask baru
// dibuat (sebelum ada field status dari PUDU) -- dipakai saat insert, bukan
// lewat mapCallStatus(). TIDAK dipanggil di mana pun hari ini (lihat
// TASK_STATE_MACHINE.md bagian 5) -- di luar scope task ini untuk disambungkan.
export const INITIAL_TASK_STATE: MappingRow = {
  missionStatus: "SUBMITTED",
  taskStatus: "DISPATCHED",
};
