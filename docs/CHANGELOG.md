# Changelog Dokumentasi & Kontrak

Mencatat perubahan pada `docs/` (ADR, ERD, Functional Boundary, Use Case, RBAC, API Specification, OpenAPI), `CLAUDE.md`, dan `README.md`. Entri terbaru di atas. Acuan utama: PRD Smart WCS v0.1 (`docs/PRD Smart WCS.pdf`).

Format: `[file] perubahan` -- dasar perubahan.

## 2026-10-22

### Header Content-MD5 dan encoding query klien PUDU (putaran ketiga, branch `fix/pudu-sesuai-dokumen-resmi`)

`pudu-signing-golden.json` (baru, `src/test/fixtures/pudu-official/`) --
dihitung dari contoh KODE JavaScript resmi PUDU (halaman Authentication
Access), bukan teks excerpt. Tes golden (`signing-golden.test.ts`)
mengonfirmasi `buildSigningString`/`computeContentMd5`/
`buildPathAndParameters`/`signRequest` byte-persis benar -- TIDAK diubah.

**Bug ditemukan dan diperbaiki (semua di `client.ts`/`signing.ts`
pembungkus, bukan fungsi signing murni):**
- Header `Content-MD5` tidak pernah benar-benar dikirim -- dihitung untuk
  signing string tapi tidak diteruskan sebagai header HTTP. Request
  ber-body (dispatch, cancel, laporan posisi) kemungkinan besar ditolak
  401 di produksi walau signature-nya sendiri benar.
- Query URL diencode `URLSearchParams` (spasi jadi `+`), bukan
  `encodeURIComponent` (spasi jadi `%20`) seperti kode resmi.
  `buildEncodedQueryString()` baru ditambahkan di `signing.ts`.
- **Ditemukan saat menulis tes level klien** (di luar 2 bug yang
  diketahui sebelum mulai): path yang ditandatangani cuma `path` relatif
  method, tidak menyertakan bagian path `baseUrl` (`/pudu-entry` di
  produksi) -- akan membuat SEMUA signature produksi salah, ketutupan di
  semua tes lama karena `baseUrl` tes selalu tanpa path.

**Terjawab**: jumlah baris kosong signing string (nol ekstra, sesuai
pembacaan literal yang sudah dipakai), formula Content-MD5 (dikonfirmasi
byte-persis). **Masih belum terverifikasi**: penerimaan gateway PUDU
sungguhan (tidak ada API key asli), urutan nilai array pada query (kode
resmi tidak mengurutkan, teks dokumen bagian A menyebut "diurutkan").

`docs/PUDU_INTEGRATION.md` bagian 3 dan 9 diperbarui.

### Integrasi PUDU diselaraskan dengan contoh JSON resmi bagian C/D (putaran kedua, branch `fix/pudu-sesuai-dokumen-resmi`)

`docs/pudu-official/PUDU_OFFICIAL_EXCERPT.md` ditambah bagian C (contoh
respons Open API & payload callback resmi, ~2150 baris) dan bagian D
(`NotifyRobotReportPosition`, API+callback terpisah) -- putaran pertama
hari ini (di bawah) cuma punya bagian A+B.

**Bug diperbaiki:**
- `notifyRobotReportPosition`: body resmi `{ sn, payload: { interval,
  times } }`, bukan field rata seperti sebelumnya. Validasi sn/interval/
  times sebelum memanggil jaringan.
- Perbandingan `message` envelope sekarang tidak peka huruf besar/kecil --
  contoh resmi `StoreRobotList` memakai `"success"` huruf kecil, akan
  keliru dianggap error bisnis oleh perbandingan case-sensitive sebelumnya.
- `deliveryTask` tipe `data.code` diperbaiki ke number (contoh resmi `0`).
- `point_type` pada dispatch CALL: tidak lagi mengirim string kosong untuk
  field wajib PUDU -- dispatch ditolak kalau `mode` elemen peta
  kosong/null, bukan ditebak.
- API peta (`StoreMapList`, `AvailableMaps` (baru), `CurrentMap`,
  `GetMapDetailV2`, `GetCurrentMapPoints`) sekarang memvalidasi `data`
  lewat skema zod berdasar contoh resmi -- ketahuan `CurrentMap` pakai
  kunci koordinat `vector`, `GetMapDetailV2` pakai `vector_list` (dua
  kunci berbeda, dulu diasumsikan sama). Peta yang responsnya tidak cocok
  skema dilewati (log + lanjut), bukan menggagalkan sinkronisasi shop lain.

**Fitur baru:**
- Parser callback `robotEmergencyRecover` -- mengisi
  `PuduRobotState.emergencyRecoveredAt`, menutup Alarm terkait kalau ada.
- 32 fixture JSON resmi (`src/test/fixtures/pudu-official/`) dari contoh
  bagian C/D, salah ketik dokumen sumber dibersihkan dan didokumentasikan.
  33 test baru memakainya (callback lewat `handleInbound`, respons Open
  API lewat `PuduClient` dengan fetch palsu).

**Masih terbuka** (dicatat di `PUDU_INTEGRATION.md` bagian 9, tidak
ditebak): sumber persis `point_type` (`mode` vs `type` elemen peta), arti
3 angka `vector`/`vector_list`, arti `is_used` (1/2), satuan `spent_time`
level-task, `remain_time` untuk T600 spesifik, signing string/Content-MD5
byte-persis (menunggu API key nyata, sesuai aturan keras task ini).

`docs/PUDU_INTEGRATION.md`, `docs/ERD.md`, `prisma/schema.prisma`
(komentar `///` saja -- `prisma validate` dan `prisma migrate diff
--exit-code` dikonfirmasi tidak ada perubahan SQL) diperbarui.

### Integrasi PUDU disesuaikan dengan dokumentasi resmi (branch `fix/pudu-sesuai-dokumen-resmi`)

**docs/pudu-official/PUDU_OFFICIAL_EXCERPT.md (baru)** -- kutipan langsung
dari situs dokumentasi resmi PUDU Open Platform (10 API/callback:
`InitiateCallTask`, `CancelCallTask`, `CompleteCallTask`, `GetCallList`,
`notifyCustomCall`, `GetRobotStatusV2`, `robotStatus`, `notifyRobotStatus`,
`notifyRobotPose`, `notifyDeliveryTask`). Sumber kebenaran lebih tinggi
dari `PUDU_INTEGRATION.md` untuk 10 nama itu; 37 API/callback lain masih
berdasar `PUDU_INTEGRATION.md` ("usulan, verifikasi dengan data nyata").

**Bug dikonfirmasi dan diperbaiki** (`client.ts`, `signing.ts`, `index.ts`,
`parsers.ts`, `status-map.ts`, `pose.ts`): envelope respons
`{trace_id, message, data}` ditegakkan (field task_id dulu dibaca dari
level atas, bukan `data`); HTTP 2xx dengan `message != "SUCCESS"` sekarang
error bisnis (retry cuma untuk kode transien); `map_name`/`point_type`
(Required) diresolve dari `PuduMapElement`, bukan dikirim kosong; kosakata
status CALL vs DELIVERY dipisah (dulu satu tabel campur, `CALL_SUCCESS`
salah dipetakan ke COMPLETED); `robot_response_code` int32 (dulu wajib
string); `notifyDeliveryTask.task_status` dibuat opsional (robot versi
lama tidak mengirim); `notifyRobotPose` menyaring pesan out-of-order lewat
`notify_timestamp`; `dispatch()` CALL sekarang cek `run_state` robot
sebelum memanggil PUDU (OFFLINE/DISABLE ditolak, BUSY tetap dikirim).

**Bug tambahan ditemukan saat verifikasi** (di luar 8 poin awal):
`computeContentMd5` salah formula (base64 digest biner, seharusnya
base64-dari-hex-string); `buildSigningString` menyisipkan baris kosong
ekstra sebelum HTTPMethod; `charge_type` divalidasi string padahal int32;
status SWITCH_MAP/RECHARGE keliru ikut tabel status CALL+DELIVERY
gabungan sebelum dipecah; callback_type tanpa parser retry selamanya tanpa
pernah SUCCESS (sekarang `IGNORED` sekali, `IgnoredMessageTypeError`).

**Fitur baru**: `NotifyRobotReportPosition` dikirim ulang berkala supaya
callback posisi tidak berhenti; sinkronisasi `PuduMap`/`PuduMapElement`
lewat `StoreMapList`+`GetMapDetailV2` (soft delete elemen hilang);
rekonsiliasi task CALL yang nyangkut lewat `GetCallList`, menyerah dan
menandai `TASK_TIMEOUT` sendiri setelah batas waktu; 3 parser callback
baru (`notifyRobotMoveState`, `notifyRobotPower`, `notifyRechargeStatus`).
`docs/PUDU_INTEGRATION.md`, `docs/TASK_STATE_MACHINE.md`, `docs/ERD.md`,
`prisma/schema.prisma` (komentar `///` saja, tidak ada migrasi -- `prisma
validate` dan `prisma migrate diff` dikonfirmasi tidak ada perubahan SQL)
diperbarui mengikuti semua temuan di atas.

**Tidak dikerjakan** (di luar scope, diputuskan pemilik proyek atau
menunggu persetujuan terpisah): traffic control area, lifting/transport,
robot pembersih, uji ke robot PUDU asli (tidak ada API key), Better Auth,
pg-boss, WebSocket, dispatch nyata dari API/UI WCS.

## 2026-10-21

### State machine Task/Mission, endpoint Event/Alarm/Monitoring (branch `feat/state-machine-event-monitoring`)

**docs/TASK_STATE_MACHINE.md (baru)** -- ditulis dari kode (`apply-status-change.ts`,
`status-map.ts`), bukan dari PRD/OpenAPI. Temuan: tidak ada validasi
transisi apa pun di kode (semua `(fromStatus, toStatus)` diterima begitu
saja); `retryCount` tidak pernah dibaca/ditambah; `INITIAL_TASK_STATE` di
`status-map.ts` tidak pernah dipakai; `Mission` tidak pernah dibuat kode
produksi (cuma fixture test); `VALIDATED`/`QUEUED`/`ASSIGNED`/`RETRY` di
enum `TaskStatus` OpenAPI tidak pernah diproduksi kode mana pun.

**Event & Alarm (FR-08)** -- `GET /api/events` (+filter `taskId`/paginasi,
perluasan dari openapi-smart-wcs.yaml), `GET /api/events/{id}` (tidak ada
di spesifikasi, ditambah), `GET /api/alarms` (+filter lewat relasi Event),
`POST /api/alarms/{id}/acknowledge` (ACTIVE->ACKNOWLEDGED),
`POST /api/alarms/{id}/clear` (ACKNOWLEDGED->CLEARED saja; ACTIVE->CLEARED
langsung ditolak 409). RBAC soal siapa boleh clear/acknowledge belum
ditegakkan (`src/lib/auth.ts` masih stub, tanpa role).

**Monitoring (FR-09)** -- `GET /api/monitoring/overview` dan
`GET /api/monitoring/connections` (bentuk persis openapi-smart-wcs.yaml).
3 endpoint perluasan (tidak ada di YAML/API_SPECIFICATION.md):
`GET /api/monitoring/fleet` (ringkasan armada dari `PuduRobotState` --
`RobotStatus` netral tidak pernah ditulis kode produksi mana pun, selalu
kosong), `GET /api/robots/{id}/pose-history` (riwayat posisi dari
`PuduPoseLog`, `from`/`to` wajib karena tabel dipartisi per bulan),
`GET /api/warehouse-map` (path ini disebut API_SPECIFICATION.md tapi tidak
punya schema sama sekali di openapi-smart-wcs.yaml).

**Perbaikan utang kecil** -- `docs/ADAPTER_CONTRACT.md` Section 5
dikoreksi (pencocokan adapter itu *nama sama persis* case-insensitive,
bukan "mengandung" substring; `"PUDU T600"` tidak cocok). Entri "ERD v3"
yang dobel di bawah ini digabung jadi satu (sisa artefak merge sebelumnya:
judul lama "43 API" ketiban isi v3.1/46-tabel). Angka "44 tabel" di entri
Stack hardening diganti 46 (migration yang diverifikasi saat itu sudah
diganti migration ERD v3.1). `vitest.config.ts` diganti jadi
`vitest.config.mts` (hilangkan peringatan ESM-di-CommonJS, isi config
tidak berubah).

**Tidak diperbaiki** -- 36 error ESLint pre-existing semuanya ada di
`src/app/master-data/page.tsx` dan `src/components/**`, yang dilarang
disentuh task ini (UI dikerjakan orang lain) -- dibiarkan, dilaporkan.

### Kontrak adapter netral vendor (refactor `refactor/adapter-contract`)

Backend PUDU yang sudah jalan (`feat/backend-pudu-tanpa-api-key`: callback,
worker, klien HMAC, pemetaan status, API Task/master data) dirapikan
supaya PUDU jadi satu implementasi dari kontrak netral, bukan ditempel
langsung ke route/worker. Refactor murni -- perilaku tidak berubah (tsc 0
error, eslint tidak naik dari baseline, 84 test lama tetap lolos tanpa
diubah asersinya).

**`src/modules/equipment-adapter/{contract,types,registry}.ts` (baru)** --
`EquipmentAdapter` (`dispatch`, `cancel`, `syncResources`, `handleInbound`,
`capabilities`); tipe hasil netral (status mentah vendor tidak boleh keluar
dari folder adapter); registri pilih adapter lewat `Robot.vendor` (case-
insensitive) atau `Integration.name` (bukan kolom rahasia) -- tidak ada
perubahan skema.

**`pudu/index.ts` (baru)** -- membungkus kode PUDU yang sudah ada (client,
parsers, status-map, sync) di balik kontrak, tanpa menulis ulang logika.
`cancelCallTask` ditambahkan ke `client.ts` (dibutuhkan `cancel()`,
belum ada sebelumnya).

**Layanan netral dipindah keluar dari `pudu/`** -- `src/modules/task/apply-status-change.ts`
dan `src/modules/event/record-event.ts` (dari `task-status.ts`/`parsers.ts`),
`src/modules/equipment-adapter/{unknown-location,provision-robot}.ts` (dari
`unknown-robot.ts`), `src/modules/equipment-adapter/worker-core.ts` (pindah
dari `pudu/`, sekarang menerima `adapter` lewat parameter alih-alih
mengimpor dispatch map PUDU langsung).

**ESLint `no-restricted-imports`** -- kode di luar `pudu/` dilarang
mengimpor dari situ langsung, kecuali `adapters.ts` dan test di dalam
`pudu/` sendiri.

**`fake/` (baru)** -- adapter tiruan (robot in-memory, tanpa tabel sendiri)
sebagai bukti kenetralan: `contract.test-suite.ts` dijalankan identik
terhadap PUDU (mock HTTP) dan fake, plus satu test E2E dengan
`PUDU_BASE_URL`/`PUDU_API_APP_KEY`/dst dikosongkan total -- POST
`/api/tasks` -> dispatch lewat registri -> callback fake -> Mission/Task
berubah status + `TaskStatusHistory` tertulis, tanpa menyentuh PUDU sama
sekali.

**Dokumen baru** -- `docs/ADAPTER_CONTRACT.md`: operasi kontrak, tipe hasil
netral, cara registri memilih adapter, langkah menambah vendor baru.

**Tidak dilakukan (sesuai batasan)** -- `prisma/schema.prisma`/migration
tidak disentuh; tidak ada dependency baru; UI/data mock tidak disentuh;
Better Auth dan `pg-boss` belum dikerjakan (fase berikutnya, perlu
persetujuan terpisah).

## 2026-10-19

### Stack hardening: Better Auth, worker+pg-boss (keputusan), env/logger/test/Docker (implementasi)

Perbaikan hasil evaluasi tech stack pasca setup `fix/erd-v3-pudu-docs`: satu bug infra (volume Postgres 18), empat fondasi yang belum ada (validasi env, logger, test framework, Dockerfile aplikasi), dan dua keputusan arsitektur dicatat di ADR tapi belum diimplementasikan (Better Auth, worker terpisah).

**docker-compose.yml** -- volume Postgres di-mount ke `/var/lib/postgresql` (bukan `.../data`); image `postgres:18` menyimpan data di `/var/lib/postgresql/18/docker` dengan layout baru, mount lama bikin container menolak start. Diverifikasi: `data_directory` ada di `/var/lib/postgresql/18/`, data bertahan setelah `docker compose down` (tanpa `-v`) + `up`, 46 tabel dan 3 partisi `PuduPoseLog` tetap setelah migration dideploy ulang.

**src/lib/env.ts (baru)** -- validasi env dengan Zod 4: `DATABASE_URL` wajib, `PORT`/`NODE_ENV`/`LOG_LEVEL` dengan default, `AUTH_SECRET` dan semua `PUDU_*` opsional (UI masih statis, nilainya belum ada -- jadi wajib saat adapter dibuat). Pesan error hanya menyebut nama variabel, tidak pernah nilainya. `server.ts` dipindah dari akses `process.env` langsung ke `env`.

**src/lib/logger.ts (baru)** -- pino tunggal, level dari `LOG_LEVEL`, JSON di production dan `pino-pretty` di development, redaksi `authorization`/`signature`/`apiAppSecret`/`password`/`token`. `server.ts` dipindah dari `console.log` ke `logger` untuk pesan startup dan koneksi Socket.IO.

**Vitest (baru)** -- `vitest.config.ts` (environment node, alias `@` -> `src`), script `test`/`test:watch`. Test pertama: `src/lib/env.test.ts` (env valid, `DATABASE_URL` kosong ditolak, `PUDU_*` boleh kosong, pesan error tidak memuat nilai) dan `src/lib/logger.test.ts` (field redaksi tidak muncul di output, termasuk satu level nested). Tidak ada test untuk HMAC/mapping status/callback PUDU -- kodenya belum ada.

**chore(deps)** -- `next-auth@5.0.0-beta.32` dihapus (tidak ada pemakaian di `src/`/`server.ts`, dicek lewat grep). Auth.js cuma dapat patch keamanan sejak Auth.js dipegang tim Better Auth (Sep 2025) dan v5 tidak pernah GA. `AUTH_SECRET` di `.env.example` dibiarkan (dipakai `env.ts`), komentar diupdate ke Better Auth.

**Dockerfile, .dockerignore (baru)** -- multi-stage (`deps` -> `build` -> `runner`) berbasis `node:24-alpine`; tidak pakai `output: "standalone"` karena custom server (`server.ts` lewat `tsx`). Stage `build` pakai `DATABASE_URL` dummy supaya `next build` lolos validasi `env.ts` tanpa koneksi database sungguhan. **Belum lolos diverifikasi** -- `docker build` gagal di lingkungan development karena disk C: penuh (Docker Desktop crash pertengahan build, "error reading from server: EOF"); perlu diuji ulang setelah disk dibebaskan.

**ADR.md** -- Section 9 baru (empat subsection): 9.1 Better Auth menggantikan Auth.js v5 (diputuskan, belum diimplementasikan); 9.2 worker terpisah (`worker.ts`) + pg-boss untuk cron/retry, antrean callback tetap lewat `IntegrationLog` dengan `FOR UPDATE SKIP LOCKED`, real-time lewat `LISTEN/NOTIFY` atau `@socket.io/postgres-adapter` (mekanisme persis diputuskan saat `worker.ts` dibuat), tanpa Redis/BullMQ; 9.3 MQTT dan OPC UA ditunda sampai tahap PLC (pilot PUDU lewat HTTPS); 9.4 Keputusan Terbuka -- sumber kebenaran kontrak API (YAML vs Zod, dua opsi ditulis tanpa dipilih); 9.5 catatan Node 24 maintenance 2026-10-20 (tetap didukung, migrasi ke Node 26 dijadwalkan ulang, bukan darurat).

**CLAUDE.md** -- semua penyebutan "Auth.js v5 beta" diganti "Better Auth (diputuskan, belum diimplementasikan)"; stack ditambah Vitest/pino/validasi env; dua aturan kerja baru (konfigurasi lewat `env.ts`, dilarang `process.env` langsung; log lewat `logger.ts`, dilarang `console.log` di server); versi `node-opcua` dikoreksi dari 2.179.x ke 2.187.x, tetap ditandai "belum dipakai".

**Tidak diinstal/diimplementasikan** (sengaja, keputusan dicatat tapi eksekusi di tahap berikutnya): `better-auth`, `pg-boss`, `@socket.io/postgres-adapter`, `mqtt`, `node-opcua`. UI tetap statis (data mock); tidak ada API route, kode auth, adapter PUDU, atau `worker.ts` yang dibuat di perubahan ini.

### ERD v3.1 + integrasi PUDU Cloud API (T600, 47 API) + perapian repo

Dasar: eksplorasi dokumentasi PUDU Open Platform (47 API & callback dipetakan field per field, 40 di scope T600), audit data model terhadap best practice, dan uji skema di PostgreSQL 16 dengan simulasi alur data PUDU (binding, sync peta, delivery task, callback ganda, error, 600 data posisi).

**ERD.md (ditulis ulang, v3.1)** -- 46 tabel (35 inti + 11 adapter PUDU), dibangkitkan dari model yang sama dengan `prisma/schema.prisma`.

- Semua kolom waktu jadi `TIMESTAMPTZ` (UTC).
- `IntegrationLog` jadi antrean callback: status `PENDING/SUCCESS/FAILED/IGNORED`, kolom baru `traceId`, `messageType`, `robotId`, `callbackCodeValid`, `httpStatus`, `responseCode`, `attempts`, `nextAttemptAt`, `processedAt`; UNIQUE (integrationId, direction, traceId) untuk idempotensi retry PUDU.
- `Event`: kolom baru `externalErrorId`, `externalLevel`, `integrationLogId`, `payload`, `taskId`. `TaskStatusHistory`: kolom baru `integrationLogId`.
- UNIQUE baru: `Task (source, externalRef)` (sebelumnya hanya catatan), `Robot.equipmentId`, `User.username`, `Role.name`.
- 11 tabel PUDU: `PuduShop`, `PuduRobotGroup`, `PuduRobot`, `PuduRobotState`, `PuduRobotStatusLog`, `PuduPoseLog` (dipartisi bulanan), `PuduMap` (terhubung ke Warehouse/Zone), `PuduRobotMap`, `PuduMapElement` (soft delete), `PuduTask` (1:1 Mission), `PuduTaskStop`.
- Bagian baru: tabel constraint/index/aturan hapus, dan "Di mana data PUDU disimpan".

**Pembaruan dari sampel response/callback nyata + 4 API baru (`GetStoreList`, `StoreRobotList`, `GetBoundRobotGroups`, `GetRobotsInGroup`)**
- Tabel baru `PuduShop` dan `PuduRobotGroup`; `PuduRobot` dan `PuduMap` memakai FK `puduShopId` (bukan string `shopId`), `PuduRobot` punya `productCode`, `puduRobotGroupId`.
- Master data netral vendor: `Robot.name`, `Robot.serialNumber` (UNIQUE, nullable, diisi dari `sn` PUDU), `Equipment.name`. Pemetaan status vendor ke status umum dijelaskan di `PUDU_INTEGRATION.md`.
- `PuduRobotState`/`PuduRobotStatusLog`: `isCharging`, `remainTime`, `vendorStatusAt`. `PuduMap`: `mapCode`, `width`, `height`, `resolution`, `originX/Y/Z`; UNIQUE jadi (`puduShopId`, `mapName`). `PuduMapElement`: `vendorElementId` (UNIQUE bersama `puduMapId`). `PuduTask`: `isOverTime`, `spentTime`. `PuduTaskStop`: `estimatedTime` (netral satuan), `vendorStopId`, `destType`, `spendTime`, `isTimeout`, `puduMapId`. `PuduRobotMap.isUsed` jadi integer mentah.
- Satuan `estimated_time`/`spend_time`/`spent_time`/`remain_time` dan arti `is_used`, `is_charging` belum terverifikasi; disimpan mentah dan dicatat di pertanyaan terbuka.

**prisma/schema.prisma** -- dari kosong jadi 46 model; lolos validator Prisma (0 warning). **prisma/sql/pudu_pose_log_partition.sql** -- partisi bulanan `PuduPoseLog` (dipasang manual di migration awal).

**PUDU_INTEGRATION.md (baru)** -- base URL per region, autentikasi HMAC, alur callback (simpan dulu, balas 200, worker mengurai), alur end-to-end, keputusan API (tidak ada API register dan on/off robot; shop, robot, grup ditarik lewat 4 API list berpaginasi, pose report maks 1000x, traffic control auto-allow, scope T600 tanpa lifting/transport), usulan pemetaan status PUDU ke WCS, katalog 47 API, lampiran pemetaan 344 field ke kolom.

**ADR** -- Section 7.1 baru: pengecualian LAN-first untuk PUDU Cloud API (butuh internet) beserta mitigasinya; model pilot diputuskan T600 lewat Cloud API; risiko baru (ketergantungan internet, tidak ada API register robot); referensi Spring yang tersisa di Section 3 dan 8.2 disesuaikan ke Next.js; catatan 4 dokumen turunan yang belum ada di repo.

**FUNCTIONAL_BOUNDARY** -- catatan keputusan sementara di area abu-abu #1 (baterai) dan #3 (traffic control: WCS selalu ALLOW).

**CLAUDE.md** -- tabel dokumen ditambah `PUDU_INTEGRATION.md` dan `prisma/schema.prisma`; bagian Status implementasi ditulis ulang sesuai kondisi repo; aturan kerja baru untuk schema, migration, dan adapter PUDU.

**Kode** -- 4 error ESLint di `src/app/tasks/page.tsx` diperbaiki (export CSV/JSON dipindah ke helper di luar render, `useMemo` diurutkan sebelum handler, persentase KPI aman saat total 0); import tak terpakai dibersihkan; README modul task dan equipment-adapter diperbarui; `.env.example` ditambahkan; `@types/node` disamakan dengan Node 24; font Geist dipindah dari `next/font/google` ke paket `geist` (dibundel lokal) supaya `next build` tidak butuh internet, sesuai ADR Section 7; `wcs-smart-docs-package.zip` (duplikat `docs/`) dihapus. Tersisa 1 warning ESLint yang disengaja: form Create Task belum punya input quantity (`setQuantity` belum dipakai).

## 2026-10-06

### Pelengkapan dokumen untuk scope baru + update versi dependency (status: masih Proposed)

**CLAUDE.md**
- Tabel dokumen wajib dibaca: status 4 file (`FUNCTIONAL_BOUNDARY.md`, `USE_CASE.md`, `RBAC.md`, `openapi-smart-wcs.yaml`) diperbarui dari "belum direvisi" jadi "Revisi 2026-10-06".
- Section Stack: versi dependency di-update (lihat ADR di bawah), aturan kerja nomor 2 dan 3 disesuaikan karena openapi-smart-wcs.yaml dan RBAC.md sekarang sudah mencakup modul/role baru.

**ADR**
- Section 2 (Decision summary): versi dependency dicek ulang per 6 Oktober 2026 dan di-update -- Next.js 14+ -> 16 (LTS; 14 EOL, 15 mendekati EOL), Node.js 20 LTS -> 24 LTS (Node 26 jadi Active LTS 28 Okt 2026), PostgreSQL dipin ke 18 (19 masih beta), Prisma dipin ke 7.x (8 masih RC), Auth.js diperjelas sebagai v5 beta (`next-auth@beta`) bukan v4, plus versi mqtt.js/node-opcua/Socket.IO/TanStack Query.
- Section 3: catatan sumber versi ditambahkan (npm registry + endoflife.date, per 6 Okt 2026).
- Section 5: 2 risiko baru -- Auth.js v5 masih beta (perlu keputusan eksplisit auth stable vs App Router-native), transisi Node LTS di tengah jadwal Phase 1.

**FUNCTIONAL_BOUNDARY**
- ERP ditambahkan sebagai sistem eksternal baru di matrix tanggung jawab dan batas detail (FR-13: WCS cuma terima & simpan, bukan planning engine).
- 3 open item baru: update stock vs ERP, validasi kapasitas sebelum delivery, boundary antar 4 Interface Operator baru.

**USE_CASE**
- 4 aktor baru (ERP, PUDU Cloud API, Operator Produksi, Operator Box/Packaging, Operator Delivery) ditambahkan ke daftar aktor.
- UC-13 s/d UC-16 didetailkan penuh (precondition/main flow/alternate flow/postcondition), mengikuti format UC-01 s/d UC-12.

**RBAC**
- 3 role baru ditambahkan ke Section 1 (Role & Aktor) dan matriks akses baru Section 2.1 untuk 4 modul baru.
- Section 3: 11 aturan endpoint baru untuk modul ERP/Production Line/Packaging/Delivery.
- Section 4: 3 open question baru, termasuk keputusan role baru vs sub-permission yang masih jadi working assumption.

**openapi-smart-wcs.yaml**
- Versi dinaikkan ke `0.4.0-proposed`. 4 tag baru (ERP Integration, Production Line Interface, Packaging Interface, Delivery Interface), 14 path baru, 10 schema baru (`ProductionPlan`, `CustomerOrder`, `ProductionLineRequestType`, `ProductionLineRequest`, `ProductionLineRequestCreateRequest`, `PackagingRequest`, `PackagingRequestCreateRequest`, `DeliveryStatus`, `DeliveryRequest`, `DeliveryRequestCreateRequest`). `Role` enum ditambah 3 nilai baru. Tervalidasi lewat `yaml.safe_load` (62 path, 54 schema total).

## 2026-10-05

### Revisi besar: tech stack Next.js full-stack + perluasan scope end-to-end (status: Proposed, belum dikonfirmasi)

Dipicu oleh referensi arsitektur operasional (`Draft_WCS.pptx`) yang menunjukkan dua hal belum tercermin di dokumen Phase 0: (1) implementasi sudah memakai Next.js, bukan Spring Boot; (2) scope sebenarnya end-to-end dari ERP/customer order sampai delivery, bukan cuma task dispatching di dalam warehouse. **Kedua perubahan berstatus Proposed** -- PRD v0.1 belum diperbarui, menunggu konfirmasi formal Astra/Winteq sebelum Phase 1 lanjut.

**ADR**
- Section 2 (Decision summary): backend Spring Boot (Java) -> Next.js (Node.js/TypeScript); ORM Spring Data JPA -> Prisma; real-time WebSocket/STOMP -> Socket.IO/`ws` di custom Node server; MQTT client Paho -> mqtt.js; OPC UA Eclipse Milo -> node-opcua (ditandai Proposed, bukan Decided -- lihat risiko); Auth Spring Security -> Auth.js/JWT custom; frontend React+Vite -> menyatu ke Next.js yang sama dengan backend.
- Section 1.1 baru: perluasan scope end-to-end, empat FR diusulkan (FR-13 ERP Integration, FR-14 Production Line Interface, FR-15 Packaging Interface, FR-16 Delivery-to-Customer Interface).
- Section 3, 4, 5, 6 diperbarui: justifikasi tiap keputusan baru, tabel alternatif dibalik (Spring Boot/Milo jadi alternatif tidak dipilih), risiko baru (OPC UA node-opcua kurang matang, WebSocket butuh custom server, tim perlu ramp-up Node/TS, dua jalur demand ERP+WMS perlu functional boundary jelas), checklist next steps bertambah (PoC node-opcua, validasi custom server, konfirmasi FR baru ke PRD).

**ARCHITECTURE**
- Diagram konteks (Section 1): WCS Core disebut juga "Middleware", posisi di antara ERP dan RMS/RCS; 4 modul baru (ERP Integration, Production Line Interface, Packaging Interface, Delivery Interface) sebagai task source baru; ERP terhubung langsung (bukan garis putus-putus lewat WMS saja).
- Tabel ISA-95 (Section 2): tambah baris Production, Packaging, Delivery.
- Tabel interface (Section 3): 4 baris baru (ERP->WCS, Operator Produksi/Box/Delivery <-> WCS); baris existing diberi anotasi tooling baru (node-opcua, mqtt.js, Socket.IO/`ws`, Prisma).
- Section 4: header WebSocket/STOMP -> Socket.IO/`ws`, nama topik dipertahankan sama sebagai kontrak.

**ERD**
- Kelompok baru "ERP & Production Integration Data": entity `Line`, `ProductionPlan`, `CustomerOrder`, `ProductionLineRequest`, `PackagingRequest`, `DeliveryRequest` -- semuanya di luar PRD Section 9 (beda dari entity usulan sebelumnya yang mengisi gap di PRD yang sudah ada; enam entity ini scope-nya sama sekali baru).
- Catatan desain: pola `taskId` nullable mengikuti `MaterialRequest` yang sudah ada; open question soal `Task.source` perlu enum baru atau tidak untuk 4 task source baru ini.

**API_SPECIFICATION**
- 4 modul baru (Ringkasan Modul, UC-13 s/d UC-16, tabel endpoint per modul): ERP Integration (3 endpoint), Production Line Interface (4), Packaging Interface (3), Delivery Interface (4) -- total 14 endpoint draft, **belum masuk `openapi-smart-wcs.yaml`** sehingga total resmi masih 93 endpoint/60 schema sampai YAML direvisi.
- Section 4: 5 schema baru (`ProductionPlan`, `CustomerOrder`, `ProductionLineRequest`, `PackagingRequest`, `DeliveryRequest`).

**Belum dikerjakan (menunggu konfirmasi Astra/Winteq):**
- Update `openapi-smart-wcs.yaml` dengan 4 modul/14 endpoint/5 schema baru di atas.
- Update PRD v0.1 untuk memformalkan FR-13 s/d FR-16.
- PoC `node-opcua` untuk FR-07 (lihat ADR Section 5).
- Keputusan RBAC: role baru untuk Operator Produksi/Box/Delivery atau sub-permission dari role yang sudah ada.
- `ADAPTER_CONTRACT.md`, `API_CONVENTIONS.md`, `TASK_STATE_MACHINE.md`, `DATA_DICTIONARY.md` belum disentuh -- perlu direview ulang terhadap perubahan stack dan scope ini.

## 2026-10-02

### Melengkapi Phase 0 (OpenAPI v0.3.0 → v0.4.0)

Menutup gap Phase 0 hasil penilaian terhadap PRD (output: arsitektur, functional boundary, data model, API standard, aturan WES). Prinsip dari PRD; angka dan mekanisme rinci ditandai "Usulan" di masing-masing dokumen.

**Dokumen baru**
- `docs/ARCHITECTURE.md`: diagram komponen (Mermaid), pemetaan ISA-95 (PRD §4), tabel interface (PRD §10), kontrak real-time STOMP/MQTT, aturan dispatching (FR-03), target non-fungsional (PRD §8), kriteria WES lengkap Simple/Intermediate/Complex plus aturan penentuan (PRD §5.1, §5.2).
- `docs/ADAPTER_CONTRACT.md`: interface `ExecutionAdapter`, tipe data, capability, aturan perilaku, pemetaan error ke `failureCode`, blueprint Pudu (VDA5050 vs API proprietary), checklist konformansi. (CLAUDE.md sebelumnya merujuk kontrak ini ke "ADR Section 3" yang hanya menyebut 4 nama.)
- `docs/API_CONVENTIONS.md`: versioning, autentikasi (JWT dan API key per Integration, scope per systemType), format dan katalog error, pagination, idempotensi, kontrak event keluar ke WMS (outbox, HMAC, at-least-once).
- `docs/DATA_DICTIONARY.md`: nilai baku enum/kode dan satuan data, dengan kolom dasar (PRD/OpenAPI/Usulan).

**OpenAPI (v0.4.0, 93 endpoint, 60 schema)**
- 16 endpoint baru: CRUD `/nodes` dan `/edges` (FR-04, UC-05); `GET /warehouse-map` (FR-09); `GET /inventory` dan `POST /inventory/sync` (FR-01); `GET /material-movements` (FR-01); `GET /tasks/{id}/missions` (FR-06, traceability); `GET /reports/alarm-pareto` (FR-10); `POST /material-requests/{id}/retry` (FR-12, UC-08); `POST /integrations/{id}/rotate-key` (FR-11).
- 14 schema baru: `Capabilities`, `Node`, `NodeCreateRequest`, `Edge`, `EdgeCreateRequest`, `WarehouseMap`, `InventoryItem`, `InventorySyncRequest`, `InventorySyncResult`, `MaterialMovement`, `Mission`, `AlarmParetoItem`, `ApiKeyResult`, `OutboundEvent`.
- Security scheme `apiKeyAuth` (`X-API-Key`); 10 operasi menerima JWT atau API key, `POST /inventory/sync` hanya API key.
- Respons `401` dan `403` dideklarasikan di semua operasi yang diamankan (91 operasi); `Error` mendapat `details` dan `traceId`.
- Pagination `page`/`pageSize` dengan respons `{items,total}` untuk `/events`, `/alarms`, `/material-requests`, dan tiga log (sebelumnya array polos); endpoint baru yang volumenya tinggi mengikuti pola yang sama.
- `Location.nodeId`, `Equipment.capabilities` (di schema dan request); `Alarm.clearedBy/clearedAt` sudah dari entri sebelumnya.
- KPI `metric`: ditambah `TASK_RETRY_RATE`, `TRAVEL_TIME`, `IDLE_TIME` (PRD FR-10).
- Diverifikasi: YAML valid, 334 `$ref` terselesaikan, dan 93 operasi cocok persis (metode, path, modul) dengan `API_SPECIFICATION.md`. Schema `OutboundEvent` didokumentasikan tapi tidak dirujuk operasi mana pun (payload keluar, bukan request/response).

**ERD**
- Entity baru: `InventoryItem` (operational inventory view, FR-01; bentuknya usulan karena PRD §9 tidak mendefinisikannya) dan `OutboxEvent`.
- Field baru: `Equipment.capabilities` (JSONB), `Mission.externalMissionId/attempt/createdAt/updatedAt`, `MaterialMovement.containerId/quantity/resourceType/resourceId` (PRD §3 Traceability: equipment dan hasil proses), `Integration.apiKeyHash/apiKeyRotatedAt`. Nilai status `Equipment` dan `Mission` diisi.
- **V1 migration**: `equipment.capabilities JSONB NOT NULL DEFAULT '{}'` ditambahkan (V1 belum pernah dijalankan, jadi diubah langsung, bukan lewat V2).

**RBAC**
- Baris endpoint baru; `POST /tasks` dan `PATCH /tasks/{id}/status` kini lewat API key; Section 5 baru (scope API key WMS dan RCS/PLC).
- **Keputusan dari PRD:** `POST /material-requests` hanya untuk Operator. PRD FR-12 menyebut request dibuat lewat WCS Interface dan PRD §6.1 mendefinisikan WMS sebagai pemberi *task*, bukan material request. UC-08 dan API_SPECIFICATION yang menyebut WMS sebagai aktor disesuaikan; WMS mengirim kebutuhan lewat `POST /tasks` (UC-01).

**Lainnya**
- **Use Case**: UC-08 aktor hanya Operator; UC-11 menyebut sinkronisasi inventory; baris aktor WMS diperbarui.
- **ADR**: referensi ke `ADAPTER_CONTRACT.md`; checklist Section 6 diperbarui (draft OpenAPI, ERD, dan repo ditandai selesai; dua item review baru); Section 9 baru (daftar dokumen turunan).
- **Functional Boundary**: area abu-abu #1 diberi catatan asumsi sementara.
- **CLAUDE.md**: tabel dokumen wajib, aturan #5 menunjuk `ADAPTER_CONTRACT.md`, jumlah endpoint jadi 93.
- **API_SPECIFICATION**: 93 endpoint, 60 schema, tabel modul dan pemetaan UC diperbarui.

### State machine, retry, dan idempotensi task (status: diusulkan)

Phase 0 gap: aturan retry/state machine dan idempotensi `POST /tasks`. Prinsipnya dari PRD (§11, FR-02, FR-03, FR-06, §8, §14); angka dan mekanisme rinci adalah usulan engineering dan ditandai begitu di dokumennya.

- **Baru**: `docs/TASK_STATE_MACHINE.md` -- tabel transisi, kebijakan retry (otomatis hanya untuk kegagalan sementara, maks 3 kali, jeda 5/15/45 detik; retry manual oleh Supervisor), penanganan komunikasi putus, katalog `failureCode`, idempotensi lewat `externalRef`, daftar properti konfigurasi, dan tabel pemisah "dari PRD" vs "usulan".
- **ERD**: `Task.externalRef` (unik bersama `source`), `Task.retryCount`, dan nilai `failureCode`.
- **OpenAPI**: schema baru `FailureCode`; `externalRef` di `Task` dan `TaskCreateRequest`; `retryCount` di `Task`; `POST /tasks` mendapat respons 200 (duplikat identik) dan 409 (`IDEMPOTENCY_PAYLOAD_MISMATCH`); deskripsi `PATCH /tasks/{id}/status` (callback ganda), `/cancel`, dan `/retry`. Total 77 endpoint, 46 schema. YAML sudah diparse dan semua `$ref` terselesaikan.
- **Use Case**: UC-01 menambah `externalRef` di payload dan alternate flow 1a; UC-03 alternate 6a menunjuk ke kebijakan retry.
- **Functional Boundary**: area abu-abu #2 diberi catatan usulan sementara (status FAILED dari RCS dianggap final), belum dikonfirmasi Winteq/Pudu.
- **API_SPECIFICATION**: jumlah schema jadi 46, field Task diperbarui. **CLAUDE.md**: dokumen baru masuk tabel dokumen wajib.
- Belum ditentukan: nilai timeout dan durasi RUNNING per `taskType`, serta apakah RCS sudah reassign robot lain sebelum melapor FAILED.

### Sinkronisasi ERD dengan OpenAPI v0.3.0

Phase 0 gap A (lihat penilaian Phase 0 di percakapan): schema OpenAPI yang belum punya padanan di ERD.

**ERD -- entity baru**
- `MaterialRequest` (PRD FR-12, UC-08). Nilai `status` masih mengikuti OpenAPI sementara (keputusan terbuka).
- `Discrepancy` (PRD FR-01, UC-11).
- `Integration` (UC-10), dengan `credentials` JSONB terenkripsi dan write-only. Ditempatkan di Security Data karena di luar daftar entity PRD 9.1-9.4; bukan bagian migration V1.
- `DiagnosticLog` tidak dibuat sebagai tabel: tampilan atas `Event` dengan sourceType EQUIPMENT/ROBOT.

**ERD -- field baru atau diubah**
- `Event.errorCode` (nullable); `Event.sourceType` dinormalkan ke huruf besar EQUIPMENT/ROBOT/TASK.
- `Alarm.clearedBy`, `Alarm.clearedAt` -- UC-06 langkah 7 mencatat waktu clear tapi tidak ada kolomnya.
- `EquipmentStatus.x, y` -- sudah ada di OpenAPI (PRD FR-09), belum di ERD.
- `RobotStatus.currentTaskId` -- sudah ada di OpenAPI, belum di ERD.
- `IntegrationLog`: `systemName` diganti `integrationId` (FK Integration); ditambah `status`, `errorMessage`; `direction` jadi INBOUND/OUTBOUND.
- `User`: ditambah `fullName`, `active`, `createdAt`. `Role.name`: 5 nilai tetap sesuai enum OpenAPI.
- `AuditLog`: `userId` jadi nullable (login gagal); ditambah `username`, `targetType`, `targetId`, `result`, `ipAddress`; `details` diganti `beforeValue`/`afterValue`.
- Catatan desain: daftar kolom JSONB diperbarui; catatan bahwa operational inventory view (PRD FR-01) belum dimodelkan karena PRD §9 tidak mendefinisikan entity-nya.

**OpenAPI**
- `Alarm`: ditambah `clearedBy`, `clearedAt`.

**Dampak ke implementasi**
- `V1__init_master_data.sql` tidak terpengaruh (hanya 10 tabel master data PRD 9.1). Entity baru di atas masuk migration V2 dan seterusnya.

### Implementasi: migration master data

- **Baru**: `backend/src/main/resources/db/migration/V1__init_master_data.sql` -- 10 tabel master data (warehouse, zone, node, location, edge, material, equipment, robot, station, route) mengikuti ERD terbaru, termasuk `location.node_id`, `station.location_id/name`, dan Route berbasis Location.
- Keputusan yang tidak ditentukan ERD/PRD, ditulis di komentar SQL agar bisa ditinjau: `UNIQUE (zone_id, code)` pada location, `UNIQUE` pada `material.sku`, `UNIQUE` pada route (zone, from, to, resource_type), CHECK `from <> to` pada edge dan route, CHECK nilai `station_type` dan `resource_type`, default `equipment.status = 'OFFLINE'`, FK `ON DELETE RESTRICT`.
- Belum divalidasi ke Postgres sungguhan (Docker Desktop engine tidak merespons saat dicoba). Jalankan lewat `docker compose up` atau `mvn spring-boot:run` untuk memastikan Flyway menerimanya.
- **CLAUDE.md, README.md**: status implementasi diperbarui (V1 sudah ada; V2 dst. untuk tabel Transaction/Event/Security masuk daftar "Belum ada").

### Rekonsiliasi dokumen dengan PRD v0.1

**ADR**
- Baris VDA5050 di tabel keputusan: dari "dikonfirmasi didukung native" menjadi standar acuan opsional per vendor (Pudu T600 native, T300 belum terverifikasi). Kalimat terkait di Section 3 disesuaikan. -- PRD §13 "jika diperlukan", §10 WCS-RCS "vendor API".
- Backend: "Java 17/21 LTS" menjadi "Spring Boot 3.3.4 (Java 21 LTS)". Checklist Section 6 diubah jadi konfirmasi ke tim Astra. -- `backend/pom.xml` sudah Java 21.

**ERD**
- Task: ditambah kolom `source` (WMS/WES/MANUAL/API) beserta catatan bahwa `source`/`destination` di PRD 9.5 berarti lokasi asal/tujuan. -- PRD FR-02, §9.5, §11.
- Station: ditambah `locationId` (FK Location), `name`, dan nilai `stationType` (PICKUP/DROPOFF/CHARGING/STAGING). -- PRD §9.5 "location/station", OpenAPI.
- Alarm.status: dari "Active/Acknowledge/Clear" menjadi `ACTIVE/ACKNOWLEDGED/CLEARED`. -- PRD FR-08, OpenAPI.

**Functional Boundary**
- Baris "Task priority & scheduling lintas-proses" dipecah: penentuan prioritas (WMS Ya, WES Ya saat ada) dan scheduling/batching (WES saja). -- PRD §4, §5.1.

**Use Case**
- UC-11: status `DONE` menjadi `COMPLETED`. -- PRD §11.
- UC-05: pelaku di ringkasan dari "Supervisor" menjadi "WCS Administrator". -- PRD §6.1.

**RBAC**
- Maintenance/Engineer dikeluarkan dari `POST /alarms/{id}/acknowledge` dan `POST /alarms/{id}/clear` agar konsisten dengan matriks Section 2 dan catatan Section 4. -- PRD §6.1 (Maintenance "mengecek" alarm).
- Jumlah modul 11 menjadi 12, versi spec v0.2.0 menjadi v0.3.0. Catatan "belum ada endpoint" untuk password self-service dan audit log dihapus.
- Ditambah baris matriks dan endpoint untuk Audit & Security Log (Administrator dan Supervisor Read). -- UC-12, OpenAPI v0.3.0.
- Ditambah keputusan terbuka #4 (siapa boleh clear alarm, bentrok dengan UC-06 langkah 6) dan #5 (cakupan audit log Supervisor).

**OpenAPI**
- `IntegrationProtocol`: ditambah `MODBUS_TCP`. -- PRD FR-07.
- Deskripsi server: referensi "ADR Section 4" dibetulkan ke "ADR Section 7".

**API_SPECIFICATION / CLAUDE.md**
- Jumlah modul 13 menjadi 12 (dihitung dari tag OpenAPI).
- CLAUDE.md: klaim `V1__init_master_data.sql` "sudah ada" dihapus dan dipindah ke daftar "Belum ada". -- file tidak ada di repo; README sudah benar.

### Penambahan untuk kebutuhan PRD yang belum tercakup

- **ERD**: tabel baru `TaskStatusHistory` (historyId, taskId, fromStatus, toStatus, reason, changedBy, changedAt). -- PRD FR-02 "history dan timestamp setiap perubahan status", §14 Traceability.
- **OpenAPI**: endpoint baru `GET /tasks/{taskId}/history` dan schema `TaskStatusHistory`. Total 77 endpoint, 45 schema.
- **ERD & OpenAPI**: field `eventType` pada `Event`. -- PRD FR-08 "ID, waktu, sumber, jenis, severity, pesan".
- **API_SPECIFICATION / CLAUDE.md**: angka disesuaikan menjadi 77 endpoint, 45 schema; Task Management 7 endpoint.

### Skema Route dan peta

- **ERD**: Route dari berbasis Node (`originNodeId`/`destinationNodeId`) menjadi berbasis Location (`zoneId`, `fromLocationId`, `toLocationId`, `resourceType`, `isActive`), sesuai OpenAPI. -- PRD §9.5 (task menunjuk Location/Station), FR-04 (path planning AMR oleh RCS).
- **ERD**: `Location.nodeId` (FK Node, nullable) ditambahkan sebagai penghubung Location dengan graf peta Node/Edge. -- PRD FR-09 (warehouse map dan posisi robot).
- **ERD**: catatan desain baru tentang pemisahan Route (Location) dan peta (Node/Edge). `RobotStatus.lastNodeId` sengaja ditunda sampai protokol adapter Pudu jelas.
- OpenAPI tidak berubah; endpoint Node/Edge ditambah saat peta dikerjakan.

### Masih terbuka (belum diputuskan)

- Siapa yang boleh clear alarm: Supervisor saja (RBAC) atau juga Operator (UC-06 langkah 6).
- Akses audit log untuk Supervisor.
- Status Material Request: set UC-08 (PENDING/VALIDATED/TASK_CREATED/REJECTED/FAILED) atau `TaskStatus` seperti OpenAPI sekarang.
- PRD internal: penamaan Phase 2-4 berbeda antara §13 (roadmap) dan §13.1 (jadwal); KPI FR-10 memuat metrik (travel/idle time, retry rate, alarm Pareto) yang tidak ada di tabel §12 (OpenAPI mengikuti FR-10 yang lebih lengkap).
- Akses Maintenance ke `GET /tasks/{taskId}/history` dan `/missions` (saat ini mengikuti modul Task Management: None).
- **Menunggu konfirmasi Astra/Winteq/Pudu** (dokumen sudah memuat usulan awal, ditandai "Usulan"):
  - Angka target non-fungsional (`ARCHITECTURE.md` bagian 6).
  - Kebijakan retry, timeout, dan masa tenggang komunikasi (`TASK_STATE_MACHINE.md`); apakah RCS Pudu sudah reassign robot lain sebelum melapor FAILED.
  - Ambang battery dispatch dan siapa yang memutuskan charging (Functional Boundary, area abu-abu #1).
  - Model Pudu (T300/T600) dan dukungan VDA5050; detail protokol per vendor (`ADAPTER_CONTRACT.md` bagian 7, 9).
  - 5 area abu-abu Functional Boundary lainnya (retry di layer mana, traffic multi-vendor, staleness inventory, konflik safety vs throughput).
  - Bentuk `InventoryItem` (PRD tidak mendefinisikan entity ini), cakupan scope API key, mekanisme HMAC pada event keluar.
  - Review seluruh dokumen Phase 0 oleh tim engineering (ADR masih Draft).
  - Penilaian kategori WES per project (`ARCHITECTURE.md` bagian 7).
