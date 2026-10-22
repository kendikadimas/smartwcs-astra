# Task & Mission State Machine

> **Baru 2026-10-21.** Ditulis dari kode yang sudah jadi
> (`src/modules/task/apply-status-change.ts`,
> `src/modules/equipment-adapter/pudu/status-map.ts`,
> `src/modules/equipment-adapter/pudu/task-status.ts`, route
> `src/app/api/tasks/`), **bukan dari PRD/OpenAPI**. Kalau ada perbedaan
> dengan `docs/openapi-smart-wcs.yaml` (enum `TaskStatus` di sana punya
> lebih banyak nilai), itu dicatat sebagai gap di bagian 5, bukan diikuti
> begitu saja.

## 1. Status yang benar-benar dipakai kode

### Task.status

| Status | Siapa yang menulis | Kapan |
| --- | --- | --- |
| `CREATED` | `POST /api/tasks` (`src/app/api/tasks/route.ts`) | Task baru dibuat. Satu-satunya nilai awal yang pernah ditulis kode. |
| `DISPATCHED` | `applyTaskStatusChange` (lewat `mapPuduStatus`) | Status PUDU `QUEUEING` |
| `RUNNING` | `applyTaskStatusChange` | Status PUDU `CALLING`, `ON_THE_WAY`, atau `PAUSE` (PAUSE **tetap** RUNNING, tidak ada status PAUSED tersendiri) |
| `COMPLETED` | `applyTaskStatusChange` | Status PUDU `CALL_SUCCESS`, `COMPLETE`, `COMPLETED` |
| `CANCELLED` | `applyTaskStatusChange` | Status PUDU `CANCEL` |
| `FAILED` | `applyTaskStatusChange` | Status PUDU `FAIL`/`FAILED`, `failureCode` diisi `"RESOURCE_ERROR"` (satu-satunya nilai `failureCode` yang pernah diproduksi kode) |

Nilai lain di enum `TaskStatus` OpenAPI (`VALIDATED`, `QUEUED`, `ASSIGNED`,
`RETRY`) **tidak pernah ditulis kode apa pun** -- lihat bagian 5.

### Mission.status

| Status | Siapa yang menulis | Kapan |
| --- | --- | --- |
| `ACCEPTED` | `applyTaskStatusChange` | Status PUDU `QUEUEING` |
| `RUNNING` | `applyTaskStatusChange` | Status PUDU `CALLING`, `ON_THE_WAY`, `PAUSE` |
| `COMPLETED` | `applyTaskStatusChange` | Status PUDU `CALL_SUCCESS`/`COMPLETE`/`COMPLETED` |
| `CANCELLED` | `applyTaskStatusChange` | Status PUDU `CANCEL` |
| `FAILED` | `applyTaskStatusChange` | Status PUDU `FAIL`/`FAILED` |

`SUBMITTED` (dipakai fixture test, `src/test/fixtures.ts`
`createMissionFixture`) **tidak pernah ditulis kode produksi** -- lihat
`status-map.ts` punya `INITIAL_TASK_STATE` (`missionStatus: "SUBMITTED"`,
`taskStatus: "DISPATCHED"`) yang disebut di komentar sebagai nilai awal
"response sukses saat create task", tapi **konstanta ini tidak dipanggil
di mana pun** (`pudu/index.ts` `dispatch()` tidak memakainya, cuma
meng-upsert `PuduTask` dengan status mentah dari respons PUDU). Ini dicatat
di bagian 5, bukan diperbaiki diam-diam (di luar scope task ini).

## 2. Perpindahan yang diizinkan kode

**Tidak ada validasi transisi apa pun di `applyTaskStatusChange`.** Fungsi
ini membandingkan status lama vs baru cuma untuk memutuskan apakah perlu
menulis `TaskStatusHistory` (`toStatus !== fromStatus`) -- **bukan** untuk
menolak perpindahan yang "tidak masuk akal" (mis. `COMPLETED` -> `RUNNING`
diterima begitu saja kalau itu yang dikirim adapter). Lihat kode:

```ts
// src/modules/task/apply-status-change.ts
if (mission.task.status !== change.taskStatus) {
  await tx.taskStatusHistory.create({ ... });
  await tx.task.update({ where: ..., data: { status: change.taskStatus, failureCode: ... } });
}
```

Jadi secara teknis **semua** `(fromStatus, toStatus)` "diizinkan" oleh kode
hari ini -- tidak ada state machine yang ditegakkan, cuma dicatat.

## 3. Pemicu perubahan status

| Pemicu | Jalur kode | Catatan |
| --- | --- | --- |
| API (`POST /api/tasks`) | `src/app/api/tasks/route.ts` | Hanya set `CREATED` saat buat. **Tidak ada** `PATCH /tasks/{id}/status`, `POST /tasks/{id}/cancel`, atau `POST /tasks/{id}/retry` yang terimplementasi -- ketiganya ada di `openapi-smart-wcs.yaml` tapi belum ada route-nya di `src/app/api/tasks/`. |
| Callback robot (PUDU) | `parsers.ts` (`notifyCustomCall`, `notifyDeliveryTask`, `notifySwitchMap`) -> `applyPuduTaskStatus` -> `mapPuduStatus` -> `applyTaskStatusChange` | Satu-satunya jalur yang benar-benar mengubah `Task.status`/`Mission.status` setelah `CREATED` hari ini. |
| Adapter fake (demo/test) | `fake/index.ts` `handleInbound` kind `"queued"` -> `applyTaskStatusChange` langsung (status sudah netral, tanpa `mapPuduStatus`) | Dipakai `fake/e2e.test.ts`. |
| Timeout | **Tidak ada** | Tidak ada job terjadwal/cron yang mengubah status berdasarkan waktu. `pg-boss` (ADR 9.2) belum diimplementasikan. |

## 4. Tabel pemetaan status vendor PUDU -> WCS

Diambil langsung dari `src/modules/equipment-adapter/pudu/status-map.ts`
(`STATUS_MAP`), berlaku tidak peka huruf besar/kecil:

| Status PUDU | Mission.status | Task.status | failureCode |
| --- | --- | --- | --- |
| `QUEUEING` | `ACCEPTED` | `DISPATCHED` | - |
| `CALLING` | `RUNNING` | `RUNNING` | - |
| `ON_THE_WAY` | `RUNNING` | `RUNNING` | - |
| `CALL_SUCCESS` | `COMPLETED` | `COMPLETED` | - |
| `COMPLETE` | `COMPLETED` | `COMPLETED` | - |
| `COMPLETED` | `COMPLETED` | `COMPLETED` | - |
| `CANCEL` | `CANCELLED` | `CANCELLED` | - |
| `FAIL` | `FAILED` | `FAILED` | `RESOURCE_ERROR` |
| `FAILED` | `FAILED` | `FAILED` | `RESOURCE_ERROR` |
| `PAUSE` | `RUNNING` (tetap) | `RUNNING` | - |

**Status tak dikenal** (tidak ada di tabel di atas): `mapPuduStatus()`
mengembalikan `{ recognized: false }`, **tidak melempar error**.
`applyPuduTaskStatus` lalu mencatat `Event` severity `WARNING`
(`eventType: "PUDU_UNKNOWN_STATUS"`, `sourceType: "ROBOT"`, `sourceId`
= `Robot.robotId`) lewat `recordEvent` -- **tidak** mengubah
`Mission.status`/`Task.status` sama sekali (status mentah tetap tersimpan
di `PuduTask.status` oleh pemanggil `applyPuduTaskStatus`, di luar fungsi
ini).

## 5. Belum diputuskan / gap (JANGAN diisi tebakan)

- **Transisi yang "sah" secara bisnis belum ditegakkan kode apa pun.**
  PRD Section 11 dan `openapi-smart-wcs.yaml` (`PATCH /tasks/{id}/status`
  summary) menyebut urutan
  `CREATED->VALIDATED->QUEUED->ASSIGNED->DISPATCHED->RUNNING->COMPLETED|FAILED`,
  `FAILED->RETRY->QUEUED`, dan "status apa pun bisa pindah ke `CANCELLED`
  selama belum selesai" -- tapi **tidak ada endpoint maupun fungsi yang
  menegakkan ini**. Apakah validasi transisi perlu ditambahkan di
  `applyTaskStatusChange`, dan seperti apa bentuknya, belum diputuskan.
  **Task ini tidak menambah penegakan baru** (instruksi eksplisit) --
  jadi tidak ada test "perpindahan terlarang ditolak" di bawah, karena
  kodenya memang tidak menolak apa pun.
- **`VALIDATED`, `QUEUED`, `ASSIGNED`, `RETRY`** (ada di enum
  `TaskStatus` OpenAPI) tidak pernah diproduksi kode mana pun. Apakah ini
  akan dipakai saat `PATCH /tasks/{id}/status`/`POST /tasks/{id}/retry`
  dibuat, atau dihapus dari enum, belum diputuskan.
- **`retryCount`** (kolom `Task.retryCount`, default `0`) **tidak pernah
  dibaca atau ditambah di kode mana pun.** Mekanisme retry (siapa yang
  menaikkan, kapan, batas maksimum) belum diputuskan -- beda dari retry
  `IntegrationLog` di worker (`PUDU_WORKER_MAX_ATTEMPTS`), yang sudah ada
  dan tidak berhubungan dengan `retryCount` ini.
- **`failureCode`** hari ini hanya pernah diisi `"RESOURCE_ERROR"` (satu
  nilai, dari `FAIL`/`FAILED` PUDU). PRD menyebut nilai lain
  (`NO_RESOURCE_AVAILABLE`, `DISPATCH_TIMEOUT`, `ACK_TIMEOUT`,
  `TASK_TIMEOUT`, `COMM_LOST`) tapi tidak ada kode yang memproduksinya.
- **`INITIAL_TASK_STATE`** di `status-map.ts` (nilai awal Mission/Task
  saat task baru dibuat di PUDU) **ada di kode tapi tidak dipanggil di
  mana pun** -- `dispatch()` di `pudu/index.ts` tidak memakainya. Apakah
  ini memang disengaja atau sisa yang belum disambungkan, belum
  diputuskan; tidak diubah di task ini (bukan scope-nya).
- **Mission belum pernah dibuat kode produksi apa pun** -- hanya fixture
  test yang membuat baris `Mission`. `dispatch()` mengasumsikan
  `missionId` sudah ada (diterima sebagai parameter `DispatchCommand`),
  tapi tidak ada endpoint/kode yang benar-benar membuat `Mission` sebelum
  memanggil `dispatch()`. Siapa yang bertanggung jawab membuat `Mission`
  (API Task, modul dispatch terpisah, atau yang lain) belum diputuskan.
- **RBAC transisi alarm** (`RBAC.md`: Operator cuma boleh *acknowledge*,
  *clear* cuma Supervisor/Maintenance Engineer) belum bisa ditegakkan di
  endpoint Fase C karena `src/lib/auth.ts` masih stub tanpa informasi
  role -- lihat laporan akhir.
