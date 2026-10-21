# Kontrak Adapter Equipment/Robot

> **Baru 2026-10-21.** Ditulis berdasarkan kode yang sudah jadi di
> `src/modules/equipment-adapter/` (refactor `refactor/adapter-contract`),
> bukan rancangan awal. Lihat juga `CLAUDE.md` (aturan kerja #5) dan
> `ADR.md` Section 3.

## 1. Kenapa ada kontrak ini

WCS Core (route callback, `worker.ts`, API Task/master data) hanya boleh
bicara ke robot/equipment lewat satu "bahasa" netral — tidak peduli
mereknya PUDU, atau vendor lain nanti. Analoginya: WCS Core adalah manajer
yang cuma bicara satu bahasa, dan adapter adalah penerjemah per merek.
Manajer tidak pernah belajar bahasa penerjemah tertentu — dia cuma tahu
cara bicara ke "penerjemah" secara umum, dan sistem memilih penerjemah yang
tepat.

Konsekuensinya: kode di luar `src/modules/equipment-adapter/pudu/` **tidak
boleh** mengimpor apa pun dari folder itu secara langsung. Aturan ini
ditegakkan lewat ESLint (`no-restricted-imports` di `eslint.config.mjs`),
kecuali untuk `adapters.ts` (satu-satunya tempat pendaftaran adapter) dan
file test di dalam folder adapter itu sendiri.

## 2. Operasi kontrak (`contract.ts`)

```ts
interface EquipmentAdapter {
  readonly key: string;
  dispatch(tx, command: DispatchCommand): Promise<DispatchResult>;
  cancel(tx, missionRef: MissionRef): Promise<void>;
  syncResources(): Promise<SyncResourcesResult>;
  handleInbound(tx, message: InboundMessage): Promise<InboundResult>;
  capabilities(): AdapterCapabilities;
}
```

Semua operasi yang menyentuh database menerima `tx`
(`Prisma.TransactionClient`), supaya tulisan ke tabel netral
(`Mission`/`Task`/`TaskStatusHistory`/`Event`/`Robot`/`Equipment`) dan
tabel milik vendor (mis. `Pudu*`) tetap satu transaksi dengan pemanggil
(worker atau route).

| Operasi | Untuk apa | Dipakai siapa hari ini |
| --- | --- | --- |
| `dispatch(tx, command)` | Kirim perintah ke robot (CALL ke satu titik, atau DELIVERY multi-destinasi) | Belum ada pemanggil dari API (belum ada fitur "kirim perintah" di UI/API Task) — disiapkan untuk FR-03 Dispatching |
| `cancel(tx, missionRef)` | Batalkan mission yang sedang berjalan di robot | Sama seperti `dispatch`, belum ada pemanggil |
| `syncResources()` | Tarik daftar robot (dan ringkasan lokasi/peta) dari vendor | Belum dijadwalkan (cron) — fungsi siap dipakai `worker.ts` nanti |
| `handleInbound(tx, message)` | Terima pesan masuk, dua bentuk (lihat Section 3), hasilkan efek netral | Route callback (`"raw"`) dan `worker-core.ts` (`"queued"`) |
| `capabilities()` | Apa yang didukung adapter ini (batalkan task, laporan posisi, jenis dispatch) | Belum dipakai pemanggil, disiapkan untuk UI/validasi nanti |

Operasi dibatasi ke yang disebut di atas. **Jangan menambah operasi baru
sebelum ada pemanggil nyata** — lihat `src/modules/equipment-adapter/pudu`
untuk cara menambah kemampuan baru tanpa mengubah kontrak kalau memang
masih bisa dibungkus di dalam operasi yang ada.

## 3. `InboundMessage` — dua bentuk pesan masuk

```ts
type InboundMessage =
  | { kind: "raw"; headers: Record<string, string | null>; rawBody: string; receivedAt: Date }
  | { kind: "queued"; messageType: string; data: unknown; integrationLogId: string | null; occurredAt: Date };
```

- **`"raw"`** — dipakai route callback (`src/app/api/integrations/pudu/callback/route.ts`).
  Adapter menerima header + body mentah, dan **sendiri** yang memverifikasi
  keasliannya (skema autentikasi beda per vendor — PUDU pakai header
  `CallbackCode`, adapter lain bisa pakai apa saja). `headers` sudah
  dalam bentuk huruf kecil semua (hasil iterasi `Headers.entries()`).
- **`"queued"`** — dipakai `worker-core.ts` setelah mengambil baris
  `IntegrationLog` berstatus `PENDING`/`FAILED` (lihat Section 9.2 ADR).
  Adapter mengurai `data` sesuai `messageType` dan menerapkan efek netral.

`InboundResult` punya 6 bentuk (`unavailable`, `unauthorized`, `invalid`,
`queue`, `handled`, `processed`) — route callback memetakan tiap bentuk ke
status HTTP dan cara menyimpan `IntegrationLog`-nya (lihat kode route
untuk detail pemetaan persisnya; perilakunya sengaja identik dengan
sebelum refactor).

## 4. Tipe hasil netral (`types.ts`)

`DispatchCommand`/`DispatchResult`, `MissionRef`, `SyncResourcesResult`,
`AdapterCapabilities` — semua pakai vocabulary WCS (status, tipe dispatch
`CALL`/`DELIVERY`, dst). **Status mentah vendor (mis. token PUDU seperti
`QUEUEING`, `CALL_SUCCESS`) tidak pernah muncul di sini atau di luar folder
adapter masing-masing.** Penerjemahan status mentah -> status netral
dilakukan modul khas vendor (mis. `pudu/status-map.ts`) sebelum hasilnya
diteruskan ke layanan netral `src/modules/task/apply-status-change.ts`.

## 5. Cara registri memilih adapter (`registry.ts`)

Dua kasus, **tidak ada perubahan skema**:

- **Untuk robot**: `Robot.vendor`, dicocokkan **tidak peka huruf besar
  kecil** terhadap kunci adapter (`getAdapterForRobot(robot)`).
- **Untuk integrasi** (mis. menentukan adapter mana yang menangani sebuah
  baris `IntegrationLog`/route callback): `Integration.name` — kolom yang
  sudah ada dan **bukan rahasia** (beda dari `Integration.credentials`
  yang terenkripsi/write-only). `findIntegrationForAdapterKey(tx, key)`
  mencari baris `Integration` yang `name`-nya cocok (case-insensitive)
  dengan kunci adapter.

Kunci adapter PUDU adalah `"pudu"`, cocok dengan `Integration.name = "PUDU"`
(diisi `prisma/seed.ts`) dan `Robot.vendor` apa pun yang mengandung "pudu"
tanpa peduli huruf besar/kecil (mis. `"Pudu"`, `"PUDU"`).

## 6. Pendaftaran adapter (`adapters.ts`)

```ts
// src/modules/equipment-adapter/adapters.ts
import { registerAdapter } from "./registry";
import { puduAdapter } from "./pudu";

registerAdapter(puduAdapter);
```

File ini **satu-satunya** yang boleh mengimpor folder vendor tertentu
(dikecualikan dari aturan ESLint `no-restricted-imports`). `route.ts` dan
`worker.ts` meng-import file ini hanya untuk efek sampingnya (mendaftarkan
adapter), lalu memanggil `getAdapter(key)` dari `registry.ts`.

## 7. Menambah vendor baru

1. Buat folder `src/modules/equipment-adapter/<vendor>/`.
2. Implementasikan `EquipmentAdapter` (lihat `pudu/index.ts` sebagai
   contoh) — bungkus client HTTP/parsing khas vendor itu di dalam folder
   ini. Kode yang sebenarnya netral (menulis `TaskStatusHistory`/`Event`,
   auto-provisioning `Robot`/`Equipment`) panggil layanan yang sudah ada:
   `src/modules/task/apply-status-change.ts`,
   `src/modules/event/record-event.ts`,
   `src/modules/equipment-adapter/provision-robot.ts`.
3. Daftarkan di `adapters.ts`: `registerAdapter(vendorAdapter)`.
4. Pastikan `Robot.vendor` robot vendor itu dan/atau `Integration.name`
   integrasinya cocok dengan `vendorAdapter.key` (case-insensitive).
5. Tulis test kontrak lewat `contract.test-suite.ts` (lihat
   `pudu/contract.test.ts` dan `fake/contract.test.ts` sebagai contoh) —
   tidak perlu menulis ulang skenario generik, cukup siapkan `config`
   (setup fixture, pesan raw sah/tidak sah) khas vendor baru itu.
6. **Jangan** menambah dependency dari route/worker/API ke folder vendor
   baru ini secara langsung — ESLint akan menolak otomatis.

## 8. Yang sengaja TIDAK dibuat

`ADAPTER_CONTRACT.md` ini cuma mencakup kontrak equipment adapter.
`API_CONVENTIONS.md`, `TASK_STATE_MACHINE.md`, `DATA_DICTIONARY.md` masih
belum ada (lihat `CLAUDE.md`) — di luar scope refactor ini.
