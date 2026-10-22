// Pemetaan kode error bisnis PUDU (PuduApiError.code, lihat client.ts) ke
// failureCode WCS. HANYA memakai nilai failureCode yang SUDAH ADA di
// docs/TASK_STATE_MACHINE.md bagian 5 (RESOURCE_ERROR -- satu-satunya yang
// sudah diproduksi kode -- dan NO_RESOURCE_AVAILABLE/DISPATCH_TIMEOUT/
// TASK_TIMEOUT/COMM_LOST -- disebut PRD tapi belum pernah diproduksi) --
// TIDAK menambah nilai failureCode baru, sesuai aturan keras task ini.
// Pemetaan di bawah ini keputusan sendiri (kode PUDU persis -> failureCode
// WCS belum ada dokumen resminya yang menjodohkan keduanya), ditandai di
// laporan akhir.

const GENERIC_FAILURE_CODE = "RESOURCE_ERROR";

const PUDU_CODE_TO_FAILURE_CODE: Record<string, string> = {
  CLOUD_OPEN_ROBOT_OFFLINE: "NO_RESOURCE_AVAILABLE",
  CLOUD_OPEN_ROBOT_NOT_EXISTS: "NO_RESOURCE_AVAILABLE",
  CLOUD_OPEN_ROBOT_UNREGISTER: "NO_RESOURCE_AVAILABLE",
  CLOUD_OPEN_NO_AVAILABLE_ROBOT: "NO_RESOURCE_AVAILABLE",
  CLOUD_OPEN_ROBOT_BELONG_ERROR: "NO_RESOURCE_AVAILABLE",
  MAP_ROBOT_UNBOUND_MAP: "NO_RESOURCE_AVAILABLE",
  CLOUD_OPEN_TIMEOUT: "DISPATCH_TIMEOUT",
  CLOUD_OPEN_WAIT: "DISPATCH_TIMEOUT",
  CLOUD_OPEN_TASK_EXPIRED: "TASK_TIMEOUT",
  CLOUD_OPEN_IOT_SEND_ERROR: "COMM_LOST",
  CLOUD_OPEN_SENDING_COMMAND_FAILED: "COMM_LOST",
};

/** Kode PUDU yang tidak ada di peta -> failureCode generik (sudah dipakai kode untuk FAIL/FAILED PUDU di status-map.ts). */
export function mapPuduErrorToFailureCode(puduCode: string | undefined): string {
  if (!puduCode) return GENERIC_FAILURE_CODE;
  return PUDU_CODE_TO_FAILURE_CODE[puduCode] ?? GENERIC_FAILURE_CODE;
}

/**
 * Dilempar dispatch()/cancel() saat ditolak SEBELUM atau SESUDAH memanggil
 * PUDU (robot OFFLINE/DISABLE, titik peta tidak ditemukan, atau PUDU
 * membalas error bisnis) -- failureCode dilampirkan supaya pemanggil
 * (nanti, saat dispatch dari API/UI disetujui) bisa menulis Task.failureCode
 * tanpa perlu menerjemahkan ulang pesan error.
 */
export class DispatchRejectedError extends Error {
  constructor(
    message: string,
    public readonly failureCode: string,
    public readonly puduCode?: string,
  ) {
    super(message);
    this.name = "DispatchRejectedError";
  }
}
