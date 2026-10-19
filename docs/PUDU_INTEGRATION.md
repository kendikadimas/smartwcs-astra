# Integrasi PUDU Open Platform (Cloud API)

> **[Baru 2026-10-19]** Ringkasan keputusan integrasi robot PUDU untuk Smart WCS, hasil eksplorasi dokumentasi resmi PUDU Open Platform dan katalog 43 API. Baca dokumen ini sebelum menulis kode di `src/modules/equipment-adapter/pudu`. Data model ada di `ERD.md` (bagian PUDU Adapter Data) dan `prisma/schema.prisma`.

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
| 1 | Registrasi robot ke akun & shop | *(tidak ada API)* | Manual di portal PUDU oleh distributor/admin |
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

- **Tidak ada API register robot dan tidak ada API list robot.** `sn` robot diinput admin di WCS (atau terisi dari callback `robotBinding`). FR-06 (registrasi robot) bergantung pada input manual.
- **`group_id` tidak bisa didapat dari API** -- dibuat dan dicatat manual dari portal PUDU. `GetGroupRobotStatusV2` opsional; default pakai `GetRobotStatusV2` per robot.
- **Tidak ada API untuk menyalakan/mematikan robot.** Yang tersedia hanya `OneKeyRechargeV2` (kirim robot ke charging dock) dan status online/offline lewat callback.
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
| 12 | `GetGroupRobotStatusV2` | WCS→PUDU | `GET /open-platform-service/v2/status/get_by_group_id` | Opsional | butuh PuduRobot.groupId |
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

## 9. Pertanyaan terbuka ke PUDU / Winteq

- **Private Cloud vs Cloud API.** Pilot memakai Cloud API (butuh internet). Docs PUDU punya menu "PUDU Private Cloud API" yang kemungkinan bisa on-premise dan sesuai prinsip LAN-first -- perlu ditanyakan sebelum produksi (lihat ADR 7.1).
- Nama persis `callback_type` untuk traffic control area.
- Nilai `callback_type` `notifySwitchMap` (tabel field di docs PUDU tertulis `notifyRobotMoveState`, kemungkinan salah tulis).
- Daftar lengkap nilai `task_status`/`state` untuk call dan delivery task (untuk memfinalkan pemetaan di bagian 7).
- Format persis `Content-MD5` (contoh JS dan Java di docs PUDU berbeda cara encode) -- pastikan lewat healthCheck dengan request POST.

## Lampiran: field PUDU ke kolom database

Setiap field param, response, dan callback untuk 36 API dalam scope T600. `IntegrationLog.payload` berarti hanya disimpan di payload mentah (tidak perlu kolom sendiri).

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
| `shop_id` | `PuduRobot.shopId` |
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

**2. CancelCallTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `sn` | `PuduRobot.sn` |
| `is_auto_back` | `IntegrationLog.payload` |
| `message` | `IntegrationLog.responseCode` |

**3. CompleteCallTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `next_call_task` | `PuduTask.requestPayload` |
| `next_call_result.task_id` | `PuduTask.previousPuduTaskId` |
| `message` | `IntegrationLog.responseCode` |

**4. GetCallList** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `task_id` | `PuduTask.vendorTaskId` |
| `shop_id` | `PuduRobot.shopId` |
| `status` | `PuduTask.status` |
| `create_time` | `PuduTask.vendorCreatedAt` |
| `total` | `IntegrationLog.payload` |

**5. DeliveryTask** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.type` | `PuduTask.requestPayload` |
| `delivery_sort` | `PuduTask.deliverySort` |
| `execute_task` | `PuduTask.requestPayload` |
| `trays[].destinations` | `PuduTaskStop.pointName` |
| `task_id` | `PuduTask.vendorTaskId` |
| `task_status` | `PuduTask.status` |
| `queue_no` | `PuduTask.queueNo` |

**6. DeliveryCommands** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `task_id` | `PuduTask.vendorTaskId` |
| `payload.action` | `IntegrationLog.payload` |
| `data.code` | `IntegrationLog.responseCode` |
| `data.message` | `IntegrationLog.errorMessage` |

**7. Delivery Task List** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `task_status` | `PuduTask.status` |
| `trays` | `PuduTaskStop.trayNo` |
| `delivery_mode` | `PuduTask.deliveryMode` |

**11. GetRobotStatusV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `mac` | `PuduRobot.mac` |
| `battery` | `PuduRobotState.battery` |
| `move_state` | `PuduRobotState.moveState` |
| `charge_stage` | `PuduRobotState.chargeStage` |
| `run_state` | `PuduRobotState.runState` |
| `charge_type` | `PuduRobotState.chargeType` |

**12. GetGroupRobotStatusV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `group_id` | `PuduRobot.groupId` |
| `sn` | `PuduRobot.sn` |
| `battery` | `PuduRobotStatusLog.battery` |
| `move_state` | `PuduRobotStatusLog.moveState` |
| `run_state` | `PuduRobotStatusLog.runState` |

**13. robotErrorWarning** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `callback_type` | `IntegrationLog.messageType` |
| `sn` | `IntegrationLog.robotId` |
| `error_type` | `Event.errorCode` |
| `error_level` | `Event.externalLevel` |
| `error_detail` | `Event.message` |
| `error_id` | `Event.externalErrorId` |

**14. robotErrorNotice** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `callback_type` | `IntegrationLog.messageType` |
| `sn` | `IntegrationLog.robotId` |
| `error_type` | `Event.errorCode` |
| `error_level` | `Event.externalLevel` |
| `extend_info` | `Event.payload` |
| `extend_info.task_id` | `Event.taskId` |

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

**18. mapElementChange** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `map_name` | `PuduMap.mapName` |
| `shop_id` | `PuduMap.shopId` |
| `timestamp` | `PuduMap.lastChangedAt` |

**19. notifyRobotPose** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `x` | `PuduPoseLog.x` |
| `y` | `PuduPoseLog.y` |
| `yaw` | `PuduPoseLog.yaw` |
| `nearest_point` | `PuduPoseLog.nearestPoint` |
| `notify_timestamp` | `PuduPoseLog.recordedAt` |

**20. notifyRobotMoveState** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `state` | `PuduRobotStatusLog.moveState` |
| `notify_timestamp` | `PuduRobotStatusLog.recordedAt` |

**21. notifyCustomCall** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `state` | `PuduTask.status` |
| `queue` | `PuduTask.queueNo` |
| `robot_response_code` | `PuduTask.robotResponseCode` |
| `message` | `PuduTask.robotResponseMessage` |

**22. notifyDeliveryTask** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `task_status` | `PuduTask.status` |
| `status` | `PuduTaskStop.status` |
| `estimated_time` | `PuduTaskStop.estimatedTimeSec` |
| `complete_type` | `PuduTaskStop.completeType` |

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

**27. notifyRechargeStatus** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `task_id` | `PuduTask.vendorTaskId` |
| `status` | `PuduTask.status` |
| `map_name` | `PuduTask.puduMapId` |
| `point` | `PuduTask.targetPoint` |

**28. OneKeyRechargeV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `task_id` | `PuduTask.vendorTaskId` |
| `desc` | `IntegrationLog.errorMessage` |

**29. NotifyRobotReportPosition** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `payload.interval` | `PuduRobotState.poseReportInterval` |
| `payload.times` | `PuduRobotState.poseReportTimes` |
| `message` | `IntegrationLog.responseCode` |

**30. StoreMapList** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `shop_id` | `PuduMap.shopId` |
| `list[].map_name` | `PuduMap.mapName` |
| `count` | `IntegrationLog.payload` |

**31. AvailableMaps** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobotMap.puduRobotId` |
| `list[].name` | `PuduRobotMap.puduMapId` |
| `floor` | `PuduMap.floor` |
| `is_used` | `PuduRobotMap.isUsed` |
| `shop_id` | `PuduMap.shopId` |

**32. CurrentMap** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `name` | `PuduRobotState.currentPuduMapId` |
| `floor` | `PuduMap.floor` |
| `elements[]` | `PuduMapElement.geometry` |
| `shop_id` | `PuduMap.shopId` |

**33. GetMapDetailV2** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `map_name` | `PuduMap.mapName` |
| `url` | `PuduMap.imageUrl` |
| `element_list[]` | `PuduMapElement.name` |
| `zone_list[]` | `PuduMap.zones` |

**34. GetRealtimeMapPosition** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `name` | `PuduRobotState.currentPuduMapId` |
| `floor` | `PuduMap.floor` |
| `position` | `PuduPoseLog.x` |
| `position.z` | `PuduPoseLog.z` |

**35. GetCurrentMapPoints** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `name` | `PuduMapElement.name` |
| `type` | `PuduMapElement.pointType` |
| `x` | `PuduMapElement.x` |
| `y` | `PuduMapElement.y` |
| `z` | `PuduMapElement.z` |

**38. robotBinding** (PUDU→WCS)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `name` | `PuduRobot.name` |
| `shop_id` | `PuduRobot.shopId` |
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

**42. SwitchMap** (WCS→PUDU)

| Field | Kolom |
| --- | --- |
| `sn` | `PuduRobot.sn` |
| `map_info.map_name` | `PuduTask.puduMapId` |
| `trace_id` | `IntegrationLog.traceId` |
| `data.task_id` | `PuduTask.vendorTaskId` |
| `data.code` | `IntegrationLog.responseCode` |
| `data.message` | `IntegrationLog.errorMessage` |

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
