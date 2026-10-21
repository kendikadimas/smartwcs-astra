# Integrasi PUDU Open Platform (Cloud API)

> **[Baru 2026-10-19]** Ringkasan keputusan integrasi robot PUDU untuk Smart WCS, hasil eksplorasi dokumentasi resmi PUDU Open Platform dan katalog 47 API. Baca dokumen ini sebelum menulis kode di `src/modules/equipment-adapter/pudu`. Data model ada di `ERD.md` (bagian PUDU Adapter Data) dan `prisma/schema.prisma`.

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

Traffic control area adalah callback dua arah: setelah menerima permintaan `seize`/`release` (dengan `msg_id`), WCS wajib memanggil balik PUDU dengan `action_result`. Scope 1 selalu `allow`. Nama `callback_type`-nya belum terkonfirmasi (lihat bagian 9).

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

## 7. Pemetaan status PUDU ke status WCS (usulan, verifikasi dengan data nyata)

Status mentah PUDU disimpan apa adanya di `PuduTask.status`. Adapter menerjemahkannya ke `Mission.status` dan `Task.status` (enum `TaskStatus` OpenAPI). Nilai di bawah berasal dari katalog dan **harus dicek ulang dengan payload callback sungguhan** sebelum dianggap final.

| Status PUDU (contoh) | Mission.status | Task.status |
| --- | --- | --- |
| response sukses saat create task | SUBMITTED | DISPATCHED |
| QUEUEING | ACCEPTED | DISPATCHED |
| CALLING, sedang mengantar, ON_THE_WAY | RUNNING | RUNNING |
| CALL_SUCCESS, COMPLETE / COMPLETED | COMPLETED | COMPLETED |
| CANCEL | CANCELLED | CANCELLED |
| FAIL / FAILED, atau error yang menghentikan task | FAILED | FAILED (failureCode RESOURCE_ERROR) |
| PAUSE | RUNNING (tetap) | RUNNING |

## 8. Katalog API dan scope T600

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

- **Private Cloud vs Cloud API.** Pilot memakai Cloud API (butuh internet). Docs PUDU punya menu "PUDU Private Cloud API" yang kemungkinan bisa on-premise dan sesuai prinsip LAN-first -- perlu ditanyakan sebelum produksi (lihat ADR 7.1).
- Nama persis `callback_type` untuk traffic control area.
- Nilai `callback_type` `notifySwitchMap` (tabel field di docs PUDU tertulis `notifyRobotMoveState`, kemungkinan salah tulis).
- Daftar lengkap nilai `task_status`/`state` untuk call dan delivery task (untuk memfinalkan pemetaan di bagian 7).
- Satuan `estimated_time`, `spend_time`, `spent_time`, `remain_time`; arti `is_used` 1/2 dan `is_charging` -1. Disimpan mentah dengan nama kolom netral, diuji dengan robot nyata lalu dikunci.
- Tipe `shop_id`/`company_id` di docs `GetStoreList` tertulis int, tetapi contoh response berupa string. Disimpan sebagai string.
- Format persis `Content-MD5` (contoh JS dan Java di docs PUDU berbeda cara encode) -- pastikan lewat healthCheck dengan request POST.

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
| `point_type` | `PuduTask.pointType` |
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

**5. DeliveryTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.type` | `PuduTask.requestPayload` |
| `delivery_sort` | `PuduTask.deliverySort` |
| `execute_task` | `PuduTask.requestPayload` |
| `trays[].destinations` | `PuduTaskStop.pointName` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `data.code` | `IntegrationLog.responseCode` |
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

**29. NotifyRobotReportPosition** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.interval` | `PuduRobotState.poseReportInterval` |
| `payload.times` | `PuduRobotState.poseReportTimes` |
| `message` | `IntegrationLog.responseCode` |
| `trace_id` | `IntegrationLog.traceId` |

**30. StoreMapList** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `list[].map_name` | `PuduMap.mapName` |
| `count` | `IntegrationLog.payload` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `shop_id (param)` | `PuduShop.shopId` |

**31. AvailableMaps** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `shop_id` | `PuduShop.shopId` |
| `trace_id` | `IntegrationLog.traceId` |
| `message` | `IntegrationLog.responseCode` |
| `list[].name` | `PuduMap.mapName` |
| `list[].floor` | `PuduMap.floor` |
| `list[].is_used` | `PuduRobotMap.isUsed` |
| `sn (param)` | `PuduRobotMap.puduRobotId` |

**32. CurrentMap** (WCS→PUDU)

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
| `elements[].vector[0]` | `PuduMapElement.x` |
| `elements[].vector[1]` | `PuduMapElement.y` |
| `elements[].vector[2]` | `PuduMapElement.z` |
| `elements[].width` | `PuduMapElement.geometry` |
| `elements[].max_speed` | `PuduMapElement.geometry` |
| `name (peta aktif robot)` | `PuduRobotState.currentPuduMapId` |

**33. GetMapDetailV2** (WCS→PUDU)

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
| `element_list[].vector_list` | `PuduMapElement.geometry` |
| `element_list[].clean_path_list` | `PuduMapElement.geometry` |

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

**35. GetCurrentMapPoints** (WCS→PUDU)

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
