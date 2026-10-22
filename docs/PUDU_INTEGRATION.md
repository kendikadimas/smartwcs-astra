# Integrasi PUDU Open Platform (Cloud API)

> **[Baru 2026-10-19]** Ringkasan keputusan integrasi robot PUDU untuk Smart WCS, hasil eksplorasi dokumentasi resmi PUDU Open Platform dan katalog 47 API. Baca dokumen ini sebelum menulis kode di `src/modules/equipment-adapter/pudu`. Data model ada di `ERD.md` (bagian PUDU Adapter Data) dan `prisma/schema.prisma`.
>
> **[Revisi 2026-10-22]** `docs/pudu-official/PUDU_OFFICIAL_EXCERPT.md`
> (kutipan langsung dari situs dokumentasi resmi PUDU) sekarang **sumber
> kebenaran lebih tinggi** dari dokumen ini. Awalnya cuma bagian A+B (10
> API/callback: `InitiateCallTask`, `CancelCallTask`, `CompleteCallTask`,
> `GetCallList`, `notifyCustomCall`, `GetRobotStatusV2`, `robotStatus`,
> `notifyRobotStatus`, `notifyRobotPose`, `notifyDeliveryTask`); **sekarang
> ditambah bagian C** (contoh respons/payload resmi untuk hampir semua API
> lain, termasuk seluruh API peta -- `StoreMapList`, `AvailableMaps`,
> `CurrentMap`, `GetMapDetailV2`, `GetCurrentMapPoints` -- dan callback
> `robotBinding`/`UnBinding`/`Activate`, `robotStatus`,
> `robotEmergencyRecover`, `mapElementChange`, `notifyRobotMoveState`,
> `notifyRobotPower`, `notifyRechargeStatus`, `notifySwitchMap`,
> `DeliveryTask`, `GetStoreList`, `StoreRobotList`, `GetBoundRobotGroups`,
> `GetRobotsInGroup`) dan **bagian D** (`NotifyRobotReportPosition`, API
> dan callback terpisah dengan halaman sendiri). Kalau dokumen ini berbeda
> dengan excerpt bagian A/B/C/D untuk nama yang dicakupnya, excerpt yang
> benar. Yang TIDAK dicakup excerpt sama sekali (`DeliveryCommands`,
> `Delivery Task List`, lifting/transport, `OneKeyRechargeV2`,
> `GetRealtimeMapPosition`, `GetGroupRobotStatusV2`, `SwitchMap` sebagai
> API WCS→PUDU, `SendCustomDisplayContent`) tetap pakai dokumen ini saja,
> ditandai "usulan, verifikasi dengan data nyata". Lihat laporan akhir
> `fix/pudu-sesuai-dokumen-resmi` (dua putaran: pertama bagian A+B, kedua
> bagian C+D) untuk daftar lengkap apa yang sudah/belum dicocokkan.

## 1. Ringkasan

| Hal | Keputusan |
| --- | --- |
| Produk PUDU | **PUDU Cloud API** (Open Platform, lewat internet). Lihat ADR Section 7.1 soal dampaknya ke prinsip LAN-first. |
| Robot pilot | **PUDU T600** (lini industrial). Lifting, transport, dan robot group tidak dipakai di scope ini. |
| Arah komunikasi | Open API: WCS -> PUDU (perintah & query, HTTPS + HMAC). Callback: PUDU -> WCS (event, HTTPS POST ke URL publik WCS). |
| Kunci robot | `sn` (serial number). Contoh robot pilot: `8310A6813060001`. |
| Kunci task | `task_id` dari PUDU disimpan di `PuduTask.vendorTaskId` dan disalin ke `Mission.externalMissionId`. |
| Traffic control area | Scope 1: WCS **selalu membalas ALLOW**. Tidak ada logika keputusan traffic di WCS. |

## 2. Base URL per region

Domain publik tetap PUDU Open Platform. Indonesia memakai node **Overseas**. Path API dari katalog ditempel setelah base URL.

| Region | Base URL |
| --- | --- |
| Overseas (Japan/Korea/Singapore) -- dipakai | `https://css-open-platform.pudutech.com/pudu-entry` |
| China | `https://open-platform.pudutech.com/pudu-entry` |
| Germany | `https://csg-open-platform.pudutech.com/pudu-entry` |
| United States | `https://csu-open-platform.pudutech.com/pudu-entry` |

Contoh URL lengkap:

```
https://css-open-platform.pudutech.com/pudu-entry/open-platform-service/v2/status/get_by_sn?sn=8310A6813060001
```

Base URL disimpan di env `PUDU_BASE_URL` dan di `Integration.credentials`. Jangan hardcode.

## 3. Autentikasi: HMAC signature (bukan Bearer token)

> **[Revisi 2026-10-22, putaran ketiga]** Signing string, formula
> Content-MD5, dan susunan path+query yang DITANDATANGANI sekarang
> **diverifikasi byte-persis** terhadap contoh KODE JavaScript resmi PUDU
> (halaman Authentication Access, bukan cuma teks excerpt yang ambigu) --
> lewat `src/test/fixtures/pudu-official/pudu-signing-golden.json` +
> `signing-golden.test.ts` (4 kasus: POST body, POST body kosong, GET
> query dengan nilai kosong & karakter khusus, GET tanpa query). **Jumlah
> baris kosong TERJAWAB**: nol baris kosong ekstra -- cuma satu baris
> kosong alami dari slot Content-MD5 yang kosong (kasus GET), persis
> pembacaan literal "6 bagian dipisah `\n`" yang sudah dipakai kode sejak
> putaran pertama. Dua bug BARU ditemukan dan diperbaiki di `client.ts`
> (BUKAN di fungsi signing murni, yang semuanya terbukti sudah benar):
> header `Content-MD5` tidak pernah benar-benar dikirim (dihitung tapi
> tidak diteruskan sebagai header), dan query URL dienkode
> `URLSearchParams` (spasi jadi `+`) bukan `encodeURIComponent` (spasi
> jadi `%20`) seperti kode resmi. Satu bug ketiga ditemukan saat menulis
> tes tingkat klien: path yang ditandatangani cuma `path` relatif method,
> tidak menyertakan bagian path `baseUrl` (`/pudu-entry`) -- diperbaiki.
> **Masih belum terverifikasi**: penerimaan oleh gateway PUDU sungguhan
> (butuh API key asli + `healthCheck`), dan urutan nilai array pada query
> (kode resmi TIDAK mengurutkan isi array, walau teks dokumen bagian A
> menyebut "diurutkan" -- belum ada kasus nyata yang memakai query array
> untuk dibuktikan, lihat bagian 9).

Setiap request wajib ditandatangani dengan `ApiAppKey` + `ApiAppSecret`. Keduanya didapat dari portal distributor PUDU (Application Center > Open Platform) setelah pengajuan disetujui PUDU. Tanpa kredensial ini, semua request ditolak -- termasuk dari Postman.

**Langkah membuat signature:**

1. Buat *signing string* dari 6 bagian dipisah `\n` (tanpa `\n` di akhir):
   ```
   <Headers>
   <HTTPMethod>
   <Accept>
   <Content-Type>
   <Content-MD5>
   <PathAndParameters>
   ```
   - `Headers`: header yang ikut ditandatangani, key diurutkan leksikografis, format `key: value\n` per baris. **Wajib menyertakan `x-date`** (format GMT, mis. `Mon, 19 Oct 2026 01:00:00 GMT`).
   - `HTTPMethod` huruf besar. `Accept` dan `Content-Type` sebaiknya selalu diisi `application/json` (kalau kosong, beberapa HTTP client mengisi default `*/*` dan signature gagal).
   - `Content-MD5`: hanya untuk request ber-body non-form; kosongkan untuk GET. Ikuti persis contoh JavaScript resmi PUDU.
   - `PathAndParameters`: path (termasuk `/pudu-entry`, tanpa prefix environment `release`/`test`/`prepub`) + query diurutkan leksikografis. Parameter tanpa nilai ditulis key-nya saja. Kalau tidak ada query, tanpa `?`.
2. Hitung `HMAC-SHA1(signing_string, ApiAppSecret)` (atau `hmac-sha256`), lalu encode Base64.
3. Kirim header:
   ```
   x-date: <GMT date>
   Accept: application/json
   Content-Type: application/json
   Authorization: hmac id="<ApiAppKey>", algorithm="hmac-sha1", headers="x-date", signature="<base64>"
   ```
4. **Uji pertama selalu ke healthCheck**: `GET <base>/data-open-platform-service/v1/api/healthCheck`. Kalau signature salah, gateway membalas HTTP 401 dan menyertakan *StringToSign* versi server di header response -- bandingkan dengan signing string lokal untuk debugging.

Implementasi: satu fungsi `signRequest()` di `src/modules/equipment-adapter/pudu/client.ts`, dites dengan unit test terhadap contoh di dokumentasi PUDU sebelum dipakai ke API lain.

## 4. Callback (PUDU -> WCS)

- URL callback WCS didaftarkan di platform distributor PUDU. PUDU memberi `callback_code`. **Callback tidak aktif secara default** -- harus diajukan dan dikonfigurasi PUDU dulu.
- Request dari PUDU: `POST <URL WCS>`, header `Content-Type: application/json`, `TraceId` (ID unik request), `CallbackCode` (kode rahasia). Body: `{ "callback_type": "...", "data": { ... } }`.
- **Timeout 5 detik, retry maksimal 3x.** HTTP 200 dianggap sukses.

**Alur wajib endpoint callback** (`POST /api/integrations/pudu/callback`):

1. Bandingkan header `CallbackCode` dengan `PUDU_CALLBACK_CODE`. Salah -> simpan dengan `callbackCodeValid=false`, status `IGNORED`, balas 401.
2. `INSERT` ke `IntegrationLog` (direction `INBOUND`, status `PENDING`, `traceId` = header TraceId, `messageType` = callback_type, `payload` = body) dengan `ON CONFLICT (integrationId, direction, traceId) DO NOTHING`.
3. Balas **HTTP 200 segera**. Jangan proses apa pun yang berat di handler.
4. Worker di proses `server.ts` mengambil baris `PENDING` (`SELECT ... FOR UPDATE SKIP LOCKED`), mengurai ke tabel tujuan (lihat Lampiran), set `SUCCESS` + `processedAt`, atau `FAILED` + `attempts++` + `nextAttemptAt`. Setelah itu emit event Socket.IO ke dashboard.
5. **Pengecualian `notifyRobotPose`**: frekuensinya tinggi (hingga 1/detik/robot), jadi boleh langsung di-upsert ke `PuduRobotState` dan insert ke `PuduPoseLog` tanpa disimpan mentah di `IntegrationLog`.

Traffic control area adalah callback dua arah: setelah menerima permintaan `seize`/`release` (dengan `msg_id`), WCS wajib memanggil balik PUDU dengan `action_result`. Scope 1 selalu `allow`. Nama `callback_type`-nya belum terkonfirmasi (lihat bagian 9). **[Revisi 2026-10-22]** Diputuskan pemilik proyek: traffic control TIDAK dikerjakan di `fix/pudu-sesuai-dokumen-resmi` -- kalau callback ini (atau `callback_type` lain yang memang tidak punya parser, mis. lifting/transport) masuk, worker mencatatnya `IGNORED` sekali (satu Event INFO, dedup per `callback_type`) dan TIDAK retry selamanya seperti sebelumnya (lihat `src/modules/equipment-adapter/worker-core.ts` `IgnoredMessageTypeError`).

**Development (tanpa IP publik):** jalankan `cloudflared tunnel --url http://localhost:3000` untuk mendapat URL `https://<acak>.trycloudflare.com` gratis tanpa domain. Tunnel bersifat outbound sehingga tetap jalan di belakang CGNAT (mis. hotspot HP) dan tidak membuka port jaringan internal. URL berubah setiap tunnel dijalankan ulang -- untuk produksi pakai named tunnel dengan domain tetap. Hanya path `/api/integrations/pudu/callback` yang perlu diakses PUDU.

## 5. Alur end-to-end

| # | Langkah | API / callback | Catatan |
| --- | --- | --- | --- |
| 1 | Registrasi robot ke akun & shop | *(tidak ada API)* lalu `GetStoreList`, `StoreRobotList`, `GetBoundRobotGroups` | Registrasi fisik manual di portal PUDU. Setelah itu WCS menarik shop, robot (sn, mac, nama, product_code), dan grup lewat API. Semua endpoint list berpaginasi (`limit`/`offset`) |
| 2 | Robot di-bind ke shop | callback `robotBinding` | WCS menyimpan `sn`, `shop_id` ke `PuduRobot` |
| 3 | Robot aktif / online | callback `robotActivate`, `robotStatus` |  |
| 4 | Mapping area & tandai titik | *(tidak ada API)* | Di PUDU App. WCS hanya menerima `mapElementChange` lalu sync lewat `StoreMapList`, `GetMapDetailV2`, `GetCurrentMapPoints` |
| 5 | Pilih peta aktif (opsional) | `SwitchMap` -> callback `notifySwitchMap` | Async; kode gagal 70001-70005. Validasi dulu di `PuduRobotMap` |
| 6 | Mulai lapor posisi | `NotifyRobotReportPosition` -> callback `notifyRobotPose` | interval min 1 detik, `times` maks 1000 -> wajib dikirim ulang |
| 7 | Kirim task | `InitiateCallTask` (ke 1 titik) / `DeliveryTask` (multi tray & destinasi) | `DeliveryCommands` untuk START/PAUSE/RESUME/COMPLETE/CANCEL task yang sedang jalan |
| 8 | Pantau progres | callback `notifyCustomCall` / `notifyDeliveryTask`, error `robotErrorNotice` |  |
| 9 | Task selesai | callback dengan status final |  |
| 10 | Balik ke dock (opsional) | `OneKeyRechargeV2` -> callback `notifyRechargeStatus` |  |

## 6. Keputusan dan batasan dari eksplorasi API

- **Tidak ada API register robot, tetapi ada API list.** `GetStoreList` -> `PuduShop`; `StoreRobotList` -> `PuduRobot` (sn, mac, nickname, product_code, first_active_time); jadi `sn` tidak perlu diinput manual. Semua berpaginasi (`limit` default 10, `offset` default 0); loop sampai `list` kosong atau `count` tercapai. Header `Language` default Mandarin, kirim `Language` yang eksplisit supaya nama toko konsisten.
- **`group_id` didapat dari `GetBoundRobotGroups`** (per `shop_id`) -> `PuduRobotGroup`; anggota grup dari `GetRobotsInGroup` -> `PuduRobot.puduRobotGroupId`. `GetGroupRobotStatusV2` opsional; default pakai `GetRobotStatusV2` per robot. Contoh response PUDU `GetBoundRobotGroups` punya key salah ketik `"shop_id:"` (dengan titik dua); parser harus toleran.
- **Tidak ada API untuk menyalakan/mematikan robot.** Yang tersedia hanya `OneKeyRechargeV2` (kirim robot ke charging dock) dan status online/offline lewat callback.
- **Status untuk dashboard bersifat netral vendor.** Status mentah PUDU (`run_state`, `move_state`, dsb.) disimpan apa adanya di `Pudu*`; adapter memetakannya ke status umum (`RobotStatus.status`, `Equipment.status`). Kosakata tampilan UI (mis. Idle/Running/Charging/Fault) dipetakan di lapisan itu, bukan dengan tabel baru. `sn` PUDU disalin ke `Robot.serialNumber` dan `nickname` ke `Robot.name`.
- **Posisi real-time** = `NotifyRobotReportPosition` (aktifkan) + callback `notifyRobotPose` (x, y, yaw, nearest_point). `GetRealtimeMapPosition` hanya fallback (data di-cache sekitar 10 detik). Job terjadwal wajib mengirim ulang `NotifyRobotReportPosition` sebelum `interval x times` habis.
- **Dua kanal error:** `robotErrorNotice` realtime, `robotErrorWarning` tertunda sekitar 10 menit. Dedup dengan `Event.externalErrorId` (error_id).
- **Call task vs delivery task:** `InitiateCallTask` memanggil robot ke satu titik; `DeliveryTask` membawa barang multi-tray ke beberapa destinasi (status per destinasi). `DeliveryCommands` bukan task baru, tapi kontrol task delivery yang sedang berjalan.
- **`SwitchMap` async:** response pertama hanya berarti perintah diterima; selesai/gagal diketahui dari `notifySwitchMap`.
- **Lifting, transport, `notifyLiftingStatus`, robot group:** di luar scope T600, tidak dimodelkan sebagai tabel. Kalau kelak ada robot lain, tambah nilai `PuduTask.taskKind`.
- **KPI granular** (travel time, idle time, waktu tunggu) tidak dikirim PUDU sebagai angka jadi -- dihitung WCS dari timestamp `TaskStatusHistory`, `PuduTaskStop`, dan `PuduRobotStatusLog`.

## 7. Pemetaan status PUDU ke status WCS

> **[Revisi 2026-10-22]** Sebelumnya satu tabel gabungan CALL+DELIVERY --
> **salah**, kosakata keduanya beda dan sebagian bertumpukan secara
> menyesatkan (`CALL_SUCCESS` dulu dipetakan ke COMPLETED, padahal artinya
> cuma "robot merespons", bukan "task selesai"). Dipecah dua tabel sesuai
> `src/modules/equipment-adapter/pudu/status-map.ts` (`mapCallStatus()` /
> `mapDeliveryStatus()`). Status mentah PUDU disimpan apa adanya di
> `PuduTask.status`; adapter menerjemahkan ke `Mission.status`/`Task.status`.

### CALL (`InitiateCallTask`, `notifyCustomCall`, `GetCallList`) -- state/status **DIKONFIRMASI** `PUDU_OFFICIAL_EXCERPT.md`

| Status PUDU | Mission.status | Task.status | Catatan |
| --- | --- | --- | --- |
| QUEUEING (respons API) / QUEUING (callback) | ACCEPTED | DISPATCHED | Ejaan beda di dokumen resmi sendiri |
| CALLING | RUNNING | RUNNING | |
| CALL_SUCCESS | RUNNING | RUNNING | Robot MERESPONS sukses, BUKAN task selesai (dulu salah dipetakan ke COMPLETED) |
| ARRIVE, PAUSE | RUNNING | RUNNING | Cuma dilaporkan robot P-ONE |
| CALL_COMPLETE | COMPLETED | COMPLETED | Nilai resmi di daftar enum |
| COMPLETE | COMPLETED | COMPLETED | Alias dari contoh respons `GetCallList` -- dokumen resmi sendiri tidak konsisten (daftar nilai vs contoh) |
| CALL_FAILED | FAILED | FAILED (failureCode RESOURCE_ERROR) | |
| QUEUING_CANCEL, TASK_CANCEL | CANCELLED | CANCELLED | |
| ROBOT_CANCEL | CANCELLED | CANCELLED | Dibatalkan ROBOT, bukan WCS/sistem -- dibedakan di dokumen resmi tapi WCS belum membedakan efeknya |

Baris pertama tabel lama ("response sukses saat create task" -> SUBMITTED/DISPATCHED) bukan token status PUDU, melainkan kondisi awal sebelum ada field status -- `INITIAL_TASK_STATE` di `status-map.ts`, **tidak dipanggil di mana pun** (lihat `TASK_STATE_MACHINE.md` bagian 5).

### DELIVERY (`DeliveryTask`, `notifyDeliveryTask`) -- task_status **BELUM diverifikasi untuk API inisiasi** (`DeliveryTask` tidak ada di excerpt), tapi **DIKONFIRMASI** untuk callback `notifyDeliveryTask`

| Status PUDU (`task_status`) | Mission.status | Task.status | Catatan |
| --- | --- | --- | --- |
| ON_THE_WAY | RUNNING | RUNNING | |
| PAUSE | RUNNING | RUNNING | |
| COMPLETED | COMPLETED | COMPLETED | |
| CANCEL | CANCELLED | CANCELLED | |
| FAILED | FAILED | FAILED (failureCode RESOURCE_ERROR) | Robot menolak task, diupdate cloud |

`task_status` **opsional** -- robot versi lama tidak mengirimnya (dikonfirmasi excerpt); kalau absen, status Task/Mission tidak diubah, cuma destinasi (`PuduTaskStop`) yang disimpan. Status per-destinasi (`AWAIT`/`ON_THE_WAY`/`ARRIVED`/`CANCEL`/`COMPLETE`) tidak memetakan ke status Task, disimpan mentah saja.

### SWITCH_MAP, RECHARGE -- belum ada tabel status

`notifySwitchMap` dan `notifyRechargeStatus` memanggil `applyPuduTaskStatus` dengan `taskKind: "OTHER"` -- **selalu `recognized=false`**, status mentah tersimpan di `PuduTask.status` tapi tidak pernah mengubah `Task.status`/`Mission.status`. Dulu (sebelum tabel dipecah) kedua ini keliru dicocokkan ke tabel CALL+DELIVERY gabungan, yang bisa salah tafsir kode yang kebetulan sama namanya. Kosakata status resmi untuk SWITCH_MAP (kode 7000x) dan RECHARGE belum ada di excerpt maupun eksplorasi awal -- di luar scope untuk diisi tebakan.

## 8. Katalog API dan scope T600

> **[Revisi 2026-10-22, putaran kedua]** Status implementasi per
> 2026-10-22 (branch `fix/pudu-sesuai-dokumen-resmi`, setelah bagian C+D):
> diimplementasikan di `client.ts` -- #1 `InitiateCallTask`, #2
> `CancelCallTask`, #3 `CompleteCallTask` (disiapkan, belum dipanggil
> pemanggil manapun), #4 `GetCallList` (dipakai rekonsiliasi), #5
> `DeliveryTask`, #11 `GetRobotStatusV2`, #28 `OneKeyRechargeV2` **tidak**,
> #29 `NotifyRobotReportPosition` (body diperbaiki ke bentuk resmi bagian
> D), #30 `StoreMapList`, #31 `AvailableMaps` (**baru** putaran kedua --
> diminta eksplisit, sebelumnya tidak ada), #33 `GetMapDetailV2`, #32
> `CurrentMap` (disiapkan, tidak dipanggil `syncResources()` --
> `GetMapDetailV2` sudah cukup), #35 `GetCurrentMapPoints` (disiapkan,
> idem), #44 `GetStoreList`, #45 `StoreRobotList`, #46
> `GetBoundRobotGroups`, #47 `GetRobotsInGroup`. Semua 5 API peta +
> `AvailableMaps` sekarang memvalidasi `data` lewat skema zod
> (`map-schemas.ts`) berdasarkan bentuk resmi bagian C, bukan tebakan.
> Callback dengan parser: #13 `robotErrorWarning`, #14 `robotErrorNotice`,
> #15 `robotStatus`, #16 `robotEmergencyRecover` (**baru** putaran kedua),
> #17 `notifyRobotStatus`, #18 `mapElementChange`, #19 `notifyRobotPose`,
> #20 `notifyRobotMoveState`, #21 `notifyCustomCall`, #22
> `notifyDeliveryTask`, #25 `notifyRobotPower`, #27 `notifyRechargeStatus`,
> #38 `robotBinding`, #39 `robotUnBinding`, #40 `robotActivate`, #43
> `notifySwitchMap`. **Masih belum ada parser** (masuk jalur
> `IgnoredMessageTypeError`, lihat bagian 4): #24 Traffic control area
> (sengaja). #6 `DeliveryCommands`, #12 `GetGroupRobotStatusV2`, #41
> `SendCustomDisplayContent`, #42 `SwitchMap` belum diimplementasikan sama
> sekali. #8-10, #23, #26, #36, #37 (lifting/transport/cleanbot) sengaja
> tidak dikerjakan (di luar scope T600).

| No | API / callback | Arah | Endpoint | Scope | Catatan |
| --- | --- | --- | --- | --- | --- |
| 1 | `InitiateCallTask` | WCS→PUDU | `POST /open-platform-service/v1/custom_call` | Ya |  |
| 2 | `CancelCallTask` | WCS→PUDU | `POST /open-platform-service/v1/custom_call/cancel` | Ya |  |
| 3 | `CompleteCallTask` | WCS→PUDU | `POST /open-platform-service/v1/custom_call/complete` | Ya | next_call_result.task_id jadi PuduTask baru |
| 4 | `GetCallList` | WCS→PUDU | `GET /open-platform-service/v1/call/list` | Ya | rekonsiliasi kalau ada callback hilang |
| 5 | `DeliveryTask` | WCS→PUDU | `POST /open-platform-service/v1/delivery_task` | Ya | trays[].destinations[] jadi stop |
| 6 | `DeliveryCommands` | WCS→PUDU | `POST /open-platform-service/v1/delivery_action` | Ya | action di payload |
| 7 | `Delivery Task List` | WCS→PUDU | `GET /open-platform-service/v1/delivery/list` | Ya | rekonsiliasi |
| 8 | `LiftingTask` | WCS→PUDU | `POST /open-platform-service/v1/lifting_task` | Tidak | Tidak didukung T600 |
| 9 | `LiftingCommands` | WCS→PUDU | `POST /open-platform-service/v1/lifting_action` | Tidak | Tidak didukung T600 |
| 10 | `Lifting Task List` | WCS→PUDU | `GET /open-platform-service/v1/lifting/list` | Tidak | Tidak didukung T600 |
| 11 | `GetRobotStatusV2` | WCS→PUDU | `GET /open-platform-service/v2/status/get_by_sn` | Ya | fallback |
| 12 | `GetGroupRobotStatusV2` | WCS→PUDU | `GET /open-platform-service/v2/status/get_by_group_id` | Opsional | group_id dari GetBoundRobotGroups |
| 13 | `robotErrorWarning` | PUDU→WCS | callback | Ya | tertunda 10 menit |
| 14 | `robotErrorNotice` | PUDU→WCS | callback | Ya | realtime |
| 15 | `robotStatus` | PUDU→WCS | callback | Ya | online/offline |
| 16 | `robotEmergencyRecover` | PUDU→WCS | callback | Ya | clear alarm terkait |
| 17 | `notifyRobotStatus` | PUDU→WCS | callback | Ya | RobotStatus = versi ternormalisasi |
| 18 | `mapElementChange` | PUDU→WCS | callback | Ya | memicu sync GetMapDetailV2 |
| 19 | `notifyRobotPose` | PUDU→WCS | callback | Ya | frekuensi tinggi; payload mentah opsional di IntegrationLog |
| 20 | `notifyRobotMoveState` | PUDU→WCS | callback | Ya |  |
| 21 | `notifyCustomCall` | PUDU→WCS | callback | Ya |  |
| 22 | `notifyDeliveryTask` | PUDU→WCS | callback | Ya |  |
| 23 | `notifyLiftingTask` | PUDU→WCS | callback | Tidak | Tidak didukung T600 |
| 24 | `Traffic control area` | Dua arah | callback | Ya | msg_id & area_id di payload; WCS balas ALLOW |
| 25 | `notifyRobotPower` | PUDU→WCS | callback | Ya |  |
| 26 | `notifyLiftingStatus` | PUDU→WCS | callback | Tidak | Tidak didukung T600 |
| 27 | `notifyRechargeStatus` | PUDU→WCS | callback | Ya |  |
| 28 | `OneKeyRechargeV2` | WCS→PUDU | `GET /open-platform-service/v2/recharge` | Ya |  |
| 29 | `NotifyRobotReportPosition` | WCS→PUDU | `POST /open-platform-service/v1/position_command` | Ya | poseReportInterval/Times/StartedAt |
| 30 | `StoreMapList` | WCS→PUDU | `GET /data-open-platform-service/v1/api/maps` | Ya |  |
| 31 | `AvailableMaps` | WCS→PUDU | `GET /map-service/v1/open/list` | Ya | is_used jadi currentMapId |
| 32 | `CurrentMap` | WCS→PUDU | `GET /map-service/v1/open/current` | Ya |  |
| 33 | `GetMapDetailV2` | WCS→PUDU | `GET /map-service/v1/open/map` | Ya | zone_list ke PuduMap.zones |
| 34 | `GetRealtimeMapPosition` | WCS→PUDU | `GET /open-platform-service/v1/robot/get_position` | Ya | cache 10 detik |
| 35 | `GetCurrentMapPoints` | WCS→PUDU | `GET /map-service/v1/open/point` | Ya |  |
| 36 | `TransportTask` | WCS→PUDU | - | Tidak | Bukan model T600 |
| 37 | `notifyTransportTask` | PUDU→WCS | callback | Tidak | Bukan model T600 |
| 38 | `robotBinding` | PUDU→WCS | callback | Ya |  |
| 39 | `robotUnBinding` | PUDU→WCS | callback | Ya |  |
| 40 | `robotActivate` | PUDU→WCS | callback | Ya |  |
| 41 | `SendCustomDisplayContent` | WCS→PUDU | `POST /open-platform-service/v1/custom_content` | Opsional | isi layar robot |
| 42 | `SwitchMap` | WCS→PUDU | `POST /open-platform-service/v1/switch_map` | Ya | kode 7000x di responseCode |
| 43 | `notifySwitchMap` | PUDU→WCS | callback | Ya |  |
| 44 | `GetStoreList` | WCS→PUDU | `GET /data-open-platform-service/v1/api/shop` | Ya | berpaginasi (limit/offset); header Language |
| 45 | `StoreRobotList` | WCS→PUDU | `GET /data-open-platform-service/v1/api/robot` | Ya | daftar robot per toko; berpaginasi |
| 46 | `GetBoundRobotGroups` | WCS→PUDU | `GET /open-platform-service/v1/robot/group/list` | Ya | sumber group_id |
| 47 | `GetRobotsInGroup` | WCS→PUDU | `GET /open-platform-service/v1/robot/list_by_device_and_group` | Ya | anggota grup |

## 9. Pertanyaan terbuka ke PUDU / Winteq

> **[Revisi 2026-10-22, dua putaran]** Status per poin diperbarui dua kali:
> pertama setelah bagian A+B didapat, kedua (bagian bawah) setelah bagian
> C+D (contoh respons/payload lengkap) didapat. Poin yang **TERJAWAB**
> dipindah ke bawah dengan jawabannya; sisanya **masih terbuka** (tidak
> ada contoh apa pun di excerpt yang menjelaskannya).

**Terjawab (bagian A+B):**
- ~~Arti `is_charging`~~ -> **1 = charging, -1 = tidak charging** (GetRobotStatusV2 & notifyRobotStatus).
- ~~Satuan `charge_type`~~ -> int32, **1 = kabel, 2 = dock** (BUKAN string seperti disimpan kode sebelumnya -- kolom DB tetap String karena tidak ada migrasi).
- ~~Daftar nilai `state`/`status` untuk CALL~~ -> terjawab lengkap (lihat bagian 7) -- untuk DELIVERY cuma `task_status` level-task yang terjawab (callback `notifyDeliveryTask`), status per-destinasi juga terjawab.
- ~~Timeout task~~ -> task call gagal otomatis 30 menit sejak dibuat (`InitiateCallTask` poin 1).
- ~~Aturan `priority`~~ -> 1 (tertinggi) sampai 5, default/di luar rentang = 5.
- ~~Satuan `estimated_time`/`spend_time` per destinasi delivery~~ -> **milidetik** (`notifyDeliveryTask` Params.data.trays.destinations).
- ~~Model yang didukung CALL/DELIVERY/status~~ -> PuduT600 & PuduT600Underride termasuk yang didukung.

**Terjawab (bagian C+D, putaran kedua):**
- ~~Bentuk body `NotifyRobotReportPosition`~~ -> `{ sn, payload: { interval, times } }` (bukan field rata -- bug diperbaiki, lihat Fase B `fix/pudu-sesuai-dokumen-resmi` putaran 2).
- ~~Bentuk respons API peta~~ -> `StoreMapList`/`AvailableMaps`/`CurrentMap`/`GetMapDetailV2`/`GetCurrentMapPoints` semua terkonfirmasi (lihat Lampiran #30-35 dan fixture `src/test/fixtures/pudu-official/`). **CurrentMap pakai kunci `vector`, GetMapDetailV2 pakai `vector_list`** -- dua kunci berbeda untuk data serupa, dulu belum pasti sama.
- ~~Bentuk respons `GetStoreList`/`StoreRobotList`/`GetBoundRobotGroups`/`GetRobotsInGroup`~~ -> terkonfirmasi, termasuk fakta `message` BISA huruf kecil (`StoreRobotList` contoh resmi: `"success"`) -- perbandingan `message` di `client.ts` sekarang tidak peka huruf besar/kecil (bug ditemukan saat verifikasi, bukan dari daftar poin awal).
- ~~Tipe `data.code` DeliveryTask~~ -> number (`0`), bukan string -- bug diperbaiki.
- ~~Tipe `shop_id` StoreRobotList/CurrentMap/AvailableMaps~~ -> **number** di contoh resmi (beda dari `GetStoreList.list[].shop_id` yang STRING -- dua tipe berbeda untuk field bernama sama, tergantung endpoint).

**Masih terbuka (TIDAK ada contoh/penjelasan di excerpt mana pun, jangan ditebak):**
- **Private Cloud vs Cloud API.** Pilot memakai Cloud API (butuh internet). Docs PUDU punya menu "PUDU Private Cloud API" yang kemungkinan bisa on-premise dan sesuai prinsip LAN-first -- perlu ditanyakan sebelum produksi (lihat ADR 7.1).
- Nama persis `callback_type` untuk traffic control area (sengaja tidak dikerjakan, diputuskan pemilik proyek).
- Satuan `spent_time` level-task (DELIVERY, berbeda dari `estimated_time`/`spend_time` per-destinasi yang sudah terjawab milidetik) -- contoh resmi `notifyDeliveryTask` punya field ini (`100`) tapi tidak menyebut satuannya.
- **`remain_time` masih kontradiktif** -- excerpt `GetRobotStatusV2` bilang menit (T300 saja), excerpt `notifyRobotStatus` bilang detik (P1 saja). **T600 (robot pilot WCS) tidak disebut sama sekali di kedua excerpt itu.**
- **`point_type` untuk InitiateCallTask (field WAJIB)** -- sumber nilainya di kode adalah `mode` elemen peta (`""`/`"return_point"` pada contoh resmi `GetMapDetailV2`/`CurrentMap`), BELUM terbukti itu nilai yang PUDU minta untuk titik gudang biasa (dokumen cuma contoh `"table"` untuk restoran). Elemen peta juga punya `type` (`source`/`charging_pile`/`chargeWorkStation`/`area`/`elevator`) sebagai kandidat lain yang mungkin lebih cocok -- **tidak dipilih sepihak**, kode menolak dispatch kalau `mode` kosong (lihat `dispatch()` di `index.ts`) alih-alih menebak.
- **Arti 3 angka `vector`/`vector_list`** -- contoh resmi titik biasa punya 3 angka, tapi elemen bertipe `area` punya 8 angka (polygon) -- tidak terbukti 3 angka pertama itu x/y/yaw atau sesuatu yang lain (`GetCurrentMapPoints` justru punya x/y/z EKSPLISIT terpisah, bukan array -- API lain yang mestinya setara). Disimpan ke kolom x/y/z PuduMapElement apa adanya (3 pertama), array lengkap di `geometry`.
- **Arti `is_used` (1 atau 2) di `AvailableMaps`** -- disimpan mentah, tidak ditafsirkan jadi boolean/currentMapId.
- `DeliveryCommands`, `Delivery Task List`, `OneKeyRechargeV2`, `GetRealtimeMapPosition`, `GetGroupRobotStatusV2`, `SwitchMap` (API WCS→PUDU), `SendCustomDisplayContent` -- **tidak ada di excerpt sama sekali** (bagian A, B, C, ataupun D), belum diimplementasikan.
- ~~Format persis `Content-MD5`~~ -- **TERJAWAB putaran ketiga**: `Base64(hex(MD5(body)))`, dikonfirmasi byte-persis lewat golden fixture dari kode resmi (bukan cuma teks excerpt). Header `Content-MD5` sekarang juga benar-benar DIKIRIM (bug putaran ketiga -- dihitung tapi tidak diteruskan sebagai header sebelumnya).
- ~~Jumlah baris kosong pasti dalam signing string~~ -- **TERJAWAB putaran ketiga**: nol baris kosong ekstra (cuma satu baris kosong alami dari Content-MD5 kosong untuk GET), dikonfirmasi golden fixture.
- **Masih belum terverifikasi** (putaran ketiga): penerimaan oleh gateway PUDU SUNGGUHAN -- golden fixture dihitung dari logika kode resmi, bukan dari respons gateway asli (tidak ada ApiAppKey/Secret asli untuk diuji end-to-end lewat `healthCheck`). Urutan nilai array pada query (kode resmi contoh TIDAK mengurutkan isi array, teks dokumen bagian A menyebut "diurutkan" -- dua sumber resmi berbeda belum dicocokkan, dan tidak ada kasus nyata query-array di golden fixture untuk diuji).

## Lampiran: field PUDU ke kolom database

Setiap field param, response, dan callback untuk 40 API dalam scope T600. `IntegrationLog.payload` berarti hanya disimpan di payload mentah (tidak perlu kolom sendiri).

| Field (semua callback) | Kolom |
| --- | --- |
| `Header TraceId` | `IntegrationLog.traceId` |
| `Header CallbackCode` | `IntegrationLog.callbackCodeValid` |
| `callback_type` | `IntegrationLog.messageType` |
| `body callback` | `IntegrationLog.payload` |

**1. InitiateCallTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `shop_id` | `PuduShop.shopId` |
| `map_name` | `PuduMap.mapName` |
| `point` | `PuduTask.targetPoint` |
| `point_type` | `PuduTask.pointType`. **[2026-10-22] PERTANYAAN TERBUKA ke PUDU:** field ini wajib diisi (excerpt: "Point type, e.g., table"), tapi kode mengambil nilainya dari `PuduMapElement.pointType`, yang sumbernya adalah `mode` elemen peta (contoh resmi: `"return_point"`, kosong `""` untuk `charging_pile`/`area`/`elevator`). **Belum terverifikasi** `mode` == nilai yang PUDU minta di sini -- elemen peta juga punya `type` (`source`/`charging_pile`/`chargeWorkStation`/`area`/`elevator`) yang bisa jadi kandidat lain, dokumen tidak menjelaskan mana yang benar untuk titik gudang biasa. Kode menolak dispatch (bukan menebak) kalau `pointType` kosong/null -- lihat `src/modules/equipment-adapter/pudu/index.ts` `dispatch()`. |
| `call_mode` | `PuduTask.callMode` |
| `priority` | `PuduTask.priority` |
| `do_not_queue` | `PuduTask.requestPayload` |
| `robot_group_ids` | `PuduTask.requestPayload` |
| `task_id` | `PuduTask.vendorTaskId` |
| `queue` | `PuduTask.queueNo` |
| `state` | `PuduTask.status` |
| `remark` | `PuduTask.remark` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |

**2. CancelCallTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `sn` | `PuduRobot.sn` |
| `is_auto_back` | `IntegrationLog.payload` |
| `message` | `IntegrationLog.responseCode` |
| `trace_id` | `IntegrationLog.traceId` |

**3. CompleteCallTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `next_call_task` | `PuduTask.requestPayload` |
| `next_call_result.task_id` | `PuduTask.previousPuduTaskId` |
| `message` | `IntegrationLog.responseCode` |
| `trace_id` | `IntegrationLog.traceId` |

**4. GetCallList** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `total` | `IntegrationLog.payload` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `list[].task_id` | `PuduTask.vendorTaskId` |
| `list[].shop_id` | `PuduShop.shopId` |
| `list[].map_name` | `PuduTask.puduMapId` |
| `list[].point` | `PuduTask.targetPoint` |
| `list[].sn` | `PuduRobot.sn` |
| `list[].queue` | `PuduTask.queueNo` |
| `list[].create_time` | `PuduTask.vendorCreatedAt` |
| `list[].finish_time` | `PuduTask.finishedAt` |
| `list[].status` | `PuduTask.status` |
| `list[].remark` | `PuduTask.remark` |
| `list[].product_code` | `PuduRobot.productCode` |

**5. DeliveryTask** (WCS→PUDU) -- **[2026-10-22]** Bentuk REQUEST masih BELUM diverifikasi (tidak ada halaman API resmi di bagian B untuk ini, cuma callback `notifyDeliveryTask`-nya). Bentuk RESPONS **DIKONFIRMASI bagian C** (fixture `DeliveryTask.json`) -- `data.code` adalah **number** (contoh resmi: `0`), bukan string seperti tipe TypeScript sebelumnya (bug diperbaiki).

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.type` | `PuduTask.requestPayload` |
| `delivery_sort` | `PuduTask.deliverySort` |
| `execute_task` | `PuduTask.requestPayload` |
| `trays[].destinations` | `PuduTaskStop.pointName` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `data.code` | `IntegrationLog.responseCode` (number, bukan string) |
| `data.message` | `IntegrationLog.errorMessage` |
| `data.task_id` | `PuduTask.vendorTaskId` |
| `data.task_status` | `PuduTask.status` |
| `data.queue_no` | `PuduTask.queueNo` |

**6. DeliveryCommands** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `task_id` | `PuduTask.vendorTaskId` |
| `payload.action` | `IntegrationLog.payload` |
| `data.code` | `IntegrationLog.responseCode` |
| `data.message` | `IntegrationLog.errorMessage` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |

**7. Delivery Task List** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `total` | `IntegrationLog.payload` |
| `list[].task_id` | `PuduTask.vendorTaskId` |
| `list[].type` | `IntegrationLog.payload` |
| `list[].delivery_sort` | `PuduTask.deliverySort` |
| `list[].execute_task` | `PuduTask.requestPayload` |
| `list[].sn` | `PuduRobot.sn` |
| `list[].trays[]` | `PuduTaskStop.pointName` |
| `list[].task_status` | `PuduTask.status` |
| `list[].create_time` | `PuduTask.vendorCreatedAt` |
| `list[].delivery_mode` | `PuduTask.deliveryMode` |

**11. GetRobotStatusV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `data.sn` | `PuduRobot.sn` |
| `data.mac` | `PuduRobot.mac` |
| `data.timestamp` | `PuduRobotState.vendorStatusAt` |
| `data.battery` | `PuduRobotState.battery` |
| `data.is_charging` | `PuduRobotState.isCharging` |
| `data.move_state` | `PuduRobotState.moveState` |
| `data.charge_stage` | `PuduRobotState.chargeStage` |
| `data.remain_time` | `PuduRobotState.remainTime` |
| `data.product_code` | `PuduRobot.productCode` |
| `data.run_state` | `PuduRobotState.runState` |
| `data.charge_type` | `PuduRobotState.chargeType` |
| `sn (param) atau mac (param)` | `PuduRobot.sn` |

**12. GetGroupRobotStatusV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `group_id (param)` | `PuduRobotGroup.groupId` |
| `data[].sn` | `PuduRobot.sn` |
| `data[].mac` | `PuduRobot.mac` |
| `data[].timestamp` | `PuduRobotStatusLog.recordedAt` |
| `data[].battery` | `PuduRobotStatusLog.battery` |
| `data[].is_charging` | `PuduRobotStatusLog.isCharging` |
| `data[].move_state` | `PuduRobotStatusLog.moveState` |
| `data[].charge_stage` | `PuduRobotStatusLog.chargeStage` |
| `data[].remain_time` | `PuduRobotStatusLog.remainTime` |
| `data[].product_code` | `PuduRobot.productCode` |
| `data[].run_state` | `PuduRobotStatusLog.runState` |
| `data[].charge_type` | `PuduRobotState.chargeType` |

**13. robotErrorWarning** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `callback_type` | `IntegrationLog.messageType` |
| `sn` | `IntegrationLog.robotId` |
| `error_type` | `Event.errorCode` |
| `error_level` | `Event.externalLevel` |
| `error_detail` | `Event.message` |
| `error_id` | `Event.externalErrorId` |
| `timestamp` | `Event.occurredAt` |

**14. robotErrorNotice** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `callback_type` | `IntegrationLog.messageType` |
| `sn` | `IntegrationLog.robotId` |
| `error_type` | `Event.errorCode` |
| `error_level` | `Event.externalLevel` |
| `extend_info.task_id` | `Event.taskId` |
| `timestamp` | `Event.occurredAt` |
| `error_detail` | `Event.message` |
| `error_id` | `Event.externalErrorId` |
| `language` | `Event.payload` |
| `extend_info.battery` | `Event.payload` |
| `extend_info.floor` | `Event.payload` |
| `extend_info.mac` | `Event.payload` |
| `extend_info.map_name` | `Event.payload` |
| `extend_info.map_point` | `Event.payload` |
| `extend_info.sn` | `Event.payload` |
| `extend_info.task_type` | `Event.payload` |
| `extend_info.position.x/y/yaw` | `Event.payload` |

**15. robotStatus** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `callback_type` | `IntegrationLog.messageType` |
| `sn` | `IntegrationLog.robotId` |
| `run_status` | `PuduRobotState.online` |
| `timestamp` | `PuduRobotStatusLog.recordedAt` |

**16. robotEmergencyRecover** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `timestamp` | `PuduRobotState.emergencyRecoveredAt` |

**17. notifyRobotStatus** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `battery` | `PuduRobotStatusLog.battery` |
| `charge_stage` | `PuduRobotStatusLog.chargeStage` |
| `move_state` | `PuduRobotStatusLog.moveState` |
| `run_state` | `PuduRobotStatusLog.runState` |
| `notify_timestamp` | `PuduRobotStatusLog.recordedAt` |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `timestamp` | `IntegrationLog.occurredAt` |
| `is_charging` | `PuduRobotStatusLog.isCharging` |
| `remain_time` | `PuduRobotStatusLog.remainTime` |
| `charge_type` | `PuduRobotState.chargeType` |

**18. mapElementChange** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `map_name` | `PuduMap.mapName` |
| `shop_id` | `PuduShop.shopId` |
| `timestamp` | `PuduMap.lastChangedAt` |

**19. notifyRobotPose** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `x` | `PuduPoseLog.x` |
| `y` | `PuduPoseLog.y` |
| `yaw` | `PuduPoseLog.yaw` |
| `nearest_point` | `PuduPoseLog.nearestPoint` |
| `notify_timestamp` | `PuduPoseLog.recordedAt` |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `timestamp` | `IntegrationLog.payload` |

**20. notifyRobotMoveState** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `state` | `PuduRobotStatusLog.moveState` |
| `notify_timestamp` | `PuduRobotStatusLog.recordedAt` |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `timestamp` | `IntegrationLog.payload` |

**21. notifyCustomCall** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `state` | `PuduTask.status` |
| `queue` | `PuduTask.queueNo` |
| `robot_response_code` | `PuduTask.robotResponseCode` |
| `message` | `PuduTask.robotResponseMessage` |
| `shop_id` | `PuduShop.shopId` |
| `map_name` | `PuduTask.puduMapId` |
| `point` | `PuduTask.targetPoint` |
| `point_type` | `PuduTask.pointType` |
| `sn` | `PuduRobot.sn` |

**22. notifyDeliveryTask** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `task_status` | `PuduTask.status` |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `timestamp` | `IntegrationLog.payload` |
| `notify_timestamp` | `PuduTask.lastNotifiedAt` |
| `delivery_mode` | `PuduTask.deliveryMode` |
| `is_over_time` | `PuduTask.isOverTime` |
| `spent_time` | `PuduTask.spentTime` |
| `trays[].destinations[].destination` | `PuduTaskStop.pointName` |
| `trays[].destinations[].type` | `PuduTaskStop.destType` |
| `trays[].destinations[].id` | `PuduTaskStop.vendorStopId` |
| `trays[].destinations[].estimated_time` | `PuduTaskStop.estimatedTime` |
| `trays[].destinations[].spend_time` | `PuduTaskStop.spendTime` |
| `trays[].destinations[].status` | `PuduTaskStop.status` |
| `trays[].destinations[].timeout` | `PuduTaskStop.isTimeout` |
| `trays[].destinations[].complete_type` | `PuduTaskStop.completeType` |
| `trays[].destinations[].map_info.map_name` | `PuduTaskStop.puduMapId` |

**24. Traffic control area** (Dua arah)

| Field | Kolom |
| --- | --- |
| `sn` | `IntegrationLog.robotId` |
| `area_id` | `IntegrationLog.payload` |
| `task_id` | `IntegrationLog.payload` |
| `action` | `IntegrationLog.payload` |
| `distance` | `IntegrationLog.payload` |
| `position` | `IntegrationLog.payload` |
| `msg_id` | `IntegrationLog.payload` |
| `action_result` | `IntegrationLog.payload` |

**25. notifyRobotPower** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `power` | `PuduRobotStatusLog.battery` |
| `charge_stage` | `PuduRobotStatusLog.chargeStage` |
| `notify_timestamp` | `PuduRobotStatusLog.recordedAt` |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `timestamp` | `IntegrationLog.payload` |

**27. notifyRechargeStatus** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `map_name` | `PuduTask.puduMapId` |
| `point` | `PuduTask.targetPoint` |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `point_type` | `PuduTask.pointType` |
| `state` | `PuduTask.status` |
| `notify_timestamp` | `PuduTask.lastNotifiedAt` |
| `timestamp` | `IntegrationLog.payload` |

**28. OneKeyRechargeV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `task_id` | `PuduTask.vendorTaskId` |
| `desc` | `IntegrationLog.errorMessage` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |

**29. NotifyRobotReportPosition** (WCS→PUDU) -- **[2026-10-22] DIKONFIRMASI bagian D.** Body resmi `{ sn, payload: { interval, times } }` (BUKAN field rata seperti versi awal implementasi -- bug diperbaiki). `interval` bulat >= 1 detik, `times` bulat maks 1000, respons cuma `{trace_id, message}` (tidak ada `data`).

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.interval` | `PuduRobotState.poseReportInterval` |
| `payload.times` | `PuduRobotState.poseReportTimes` |
| `message` | `IntegrationLog.responseCode` |
| `trace_id` | `IntegrationLog.traceId` |

**30. StoreMapList** (WCS→PUDU) -- **[2026-10-22] DIKONFIRMASI bagian C** (fixture `StoreMapList.json`).

| Field | Kolom |
| --- | --- |
| `list[].map_name` | `PuduMap.mapName` |
| `count` | `IntegrationLog.payload` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `shop_id (param)` | `PuduShop.shopId` |

**31. AvailableMaps** (WCS→PUDU) -- **[2026-10-22] DIKONFIRMASI bagian C** (fixture `AvailableMaps.json`). `is_used` disimpan MENTAH (1 atau 2) -- artinya masih tidak dijelaskan dokumen resmi, jangan ditafsirkan jadi `currentMapId` tanpa konfirmasi lebih lanjut dari PUDU (baris di bawah menyebut rencana itu, belum diimplementasikan).

| Field | Kolom |
| --- | --- |
| `shop_id` | `PuduShop.shopId` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `list[].name` | `PuduMap.mapName` |
| `list[].floor` | `PuduMap.floor` |
| `list[].is_used` | `PuduRobotMap.isUsed` |
| `sn (param)` | `PuduRobotMap.puduRobotId` |

**32. CurrentMap** (WCS→PUDU) -- **[2026-10-22] DIKONFIRMASI bagian C** (fixture `CurrentMap.json`): koordinat di kunci **`vector`** (array angka, bukan `vector_list` seperti GetMapDetailV2 -- dua kunci BEDA untuk data yang serupa, dikonfirmasi lewat contoh resmi, bukan tebakan).

| Field | Kolom |
| --- | --- |
| `name` | `PuduMap.mapName` |
| `floor` | `PuduMap.floor` |
| `shop_id` | `PuduShop.shopId` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `elements[].type` | `PuduMapElement.elementType` |
| `elements[].id` | `PuduMapElement.vendorElementId` |
| `elements[].name` | `PuduMapElement.name` |
| `elements[].mode` | `PuduMapElement.pointType` |
| `elements[].group` | `PuduMapElement.geometry` |
| `elements[].vector[0..2]` | `PuduMapElement.x/y/z` (3 angka pertama saja -- arti persisnya BELUM dijelaskan dokumen, lihat bagian 9; array lengkap tetap di `geometry`) |
| `elements[].width` | `PuduMapElement.geometry` |
| `elements[].max_speed` | `PuduMapElement.geometry` |
| `name (peta aktif robot)` | `PuduRobotState.currentPuduMapId` |

**33. GetMapDetailV2** (WCS→PUDU) -- **[2026-10-22] DIKONFIRMASI bagian C** (fixture `GetMapDetailV2.json`): koordinat di kunci **`vector_list`** (BUKAN `vector` seperti CurrentMap). Elemen bertipe `area` pada contoh resmi punya 8 angka di `vector_list` (polygon), bukan 3 seperti titik biasa -- array LENGKAP disimpan di `geometry`, cuma 3 angka pertama diisi ke x/y/z.

| Field | Kolom |
| --- | --- |
| `map_name` | `PuduMap.mapName` |
| `url` | `PuduMap.imageUrl` |
| `zone_list[]` | `PuduMap.zones` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `map_code` | `PuduMap.mapCode` |
| `width` | `PuduMap.width` |
| `height` | `PuduMap.height` |
| `resolution` | `PuduMap.resolution` |
| `origin_list[0]` | `PuduMap.originX` |
| `origin_list[1]` | `PuduMap.originY` |
| `origin_list[2]` | `PuduMap.originZ` |
| `element_list[].id` | `PuduMapElement.vendorElementId` |
| `element_list[].name` | `PuduMapElement.name` |
| `element_list[].type` | `PuduMapElement.elementType` |
| `element_list[].mode` | `PuduMapElement.pointType` |
| `element_list[].vector_list[0..2]` | `PuduMapElement.x/y/z` (3 angka pertama; array lengkap di `geometry`, lihat `src/modules/equipment-adapter/pudu/map-schemas.ts` `extractXYZFromVector`) |
| `element_list[].clean_path_list` | `PuduMapElement.geometry` -- array objek `{x,y,z}` pada contoh resmi (bukan array angka seperti `vector_list`) |

**34. GetRealtimeMapPosition** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `floor` | `PuduMap.floor` |
| `traceId (nama key berbeda dari API lain)` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `map_name` | `PuduMap.mapName` |
| `data.position.x` | `PuduPoseLog.x` |
| `data.position.y` | `PuduPoseLog.y` |
| `data.position.z` | `PuduPoseLog.z` |
| `map_name (peta posisi)` | `PuduRobotState.currentPuduMapId` |

**35. GetCurrentMapPoints** (WCS→PUDU) -- **[2026-10-22] DIKONFIRMASI bagian C** (fixture `GetCurrentMapPoints.json`): x/y/z EKSPLISIT per titik (beda dari CurrentMap/GetMapDetailV2 yang menaruh koordinat dalam array `vector`/`vector_list`).

| Field | Kolom |
| --- | --- |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `total` | `IntegrationLog.payload` |
| `list[].name` | `PuduMapElement.name` |
| `list[].type` | `PuduMapElement.pointType` |
| `list[].x` | `PuduMapElement.x` |
| `list[].y` | `PuduMapElement.y` |
| `list[].z` | `PuduMapElement.z` |

**38. robotBinding** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `shop_id` | `PuduShop.shopId` |
| `timestamp` | `PuduRobot.boundAt` |

**39. robotUnBinding** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `timestamp` | `PuduRobot.unboundAt` |

**40. robotActivate** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `timestamp` | `PuduRobot.activatedAt` |

**41. SendCustomDisplayContent** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.call_mode` | `IntegrationLog.payload` |
| `payload.task_id` | `IntegrationLog.payload` |
| `payload.mode_data` | `IntegrationLog.payload` |
| `trace_id` | `IntegrationLog.traceId` |
| `data.code` | `IntegrationLog.responseCode` |
| `message` | `IntegrationLog.responseCode` |

**42. SwitchMap** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `map_info.map_name` | `PuduTask.puduMapId` |
| `trace_id` | `IntegrationLog.traceId` |
| `data.task_id` | `PuduTask.vendorTaskId` |
| `data.code` | `IntegrationLog.responseCode` |
| `data.message` | `IntegrationLog.errorMessage` |
| `message` | `IntegrationLog.responseCode` |

**43. notifySwitchMap** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `task_id` | `PuduTask.vendorTaskId` |
| `task_status` | `PuduTask.status` |
| `remark` | `PuduTask.remark` |
| `map_info.map_name` | `PuduTask.puduMapId` |
| `notify_timestamp` | `PuduTask.lastNotifiedAt` |
| `timestamp` | `IntegrationLog.payload` |

**44. GetStoreList** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `limit, offset (param, paginasi)` | `IntegrationLog.requestPayload (tidak disimpan)` |
| `count` | `IntegrationLog.payload` |
| `list[].shop_id` | `PuduShop.shopId` |
| `list[].shop_name` | `PuduShop.shopName` |
| `list[].company_id` | `PuduShop.companyId` |
| `list[].company_name` | `PuduShop.companyName` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |

**45. StoreRobotList** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `limit, offset, shop_id, product_code[] (param)` | `IntegrationLog.requestPayload (tidak disimpan)` |
| `count` | `IntegrationLog.payload` |
| `list[].sn` | `PuduRobot.sn, Robot.serialNumber` |
| `list[].mac` | `PuduRobot.mac` |
| `list[].shop_id` | `PuduShop.shopId` |
| `list[].shop_name` | `PuduShop.shopName` |
| `list[].product_code` | `PuduRobot.productCode` |
| `list[].nickname` | `PuduRobot.name, Robot.name` |
| `list[].first_active_time` | `PuduRobot.activatedAt` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |

**46. GetBoundRobotGroups** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `device, shop_id (param)` | `IntegrationLog.requestPayload (tidak disimpan)` |
| `groups[].group_id` | `PuduRobotGroup.groupId` |
| `groups[].group_name` | `PuduRobotGroup.groupName` |
| `groups[].shop_id (key di contoh PUDU tertulis "shop_id:")` | `PuduShop.shopId` |
| `groups[].shop_name` | `PuduShop.shopName` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |

**47. GetRobotsInGroup** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `group_id (param)` | `PuduRobotGroup.groupId` |
| `robots[].mac` | `PuduRobot.mac` |
| `robots[].sn` | `PuduRobot.sn, Robot.serialNumber` |
| `robots[].robot_name` | `PuduRobot.name, Robot.name` |
| `robots[].shop_id` | `PuduShop.shopId` |
| `robots[].shop_name` | `PuduShop.shopName` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
