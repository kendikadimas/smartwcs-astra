/**
 * Adapter mana pun (PUDU hari ini, vendor lain nanti) bisa menolak
 * dispatch()/cancel() dengan melempar error bernama "DispatchRejectedError"
 * + properti `failureCode` (lihat
 * src/modules/equipment-adapter/pudu/error-map.ts). Lapisan task/dispatch
 * ini (di luar folder adapter vendor) TIDAK BOLEH mengimpor kelas error itu
 * langsung (ESLint no-restricted-imports, lihat ADAPTER_CONTRACT.md) --
 * jadi dicek lewat duck-typing (nama + bentuk), bukan `instanceof`.
 *
 * Keputusan sendiri (Bagian 1 Fase D): kontrak error ini belum diformalkan
 * sebagai tipe netral di contract.ts/types.ts (tidak diubah di task ini)
 * -- kalau nanti ada vendor lain yang butuh bentuk error lain, pertimbangkan
 * memindahkan ini ke tipe netral sungguhan, bukan menambah duck-typing baru.
 */
export function getDispatchRejectionFailureCode(error: unknown): string | null {
  if (
    error instanceof Error &&
    error.name === "DispatchRejectedError" &&
    "failureCode" in error &&
    typeof (error as { failureCode?: unknown }).failureCode === "string"
  ) {
    return (error as { failureCode: string }).failureCode;
  }
  return null;
}
