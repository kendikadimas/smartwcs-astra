# Smart WCS Platform — Astra Otoparts (Divisi Winteq)

Konteks untuk Claude Code (atau siapapun/apapun yang mengerjakan repo ini).
**Baca `docs/` dulu sebelum menulis atau mengubah kode** — keputusan arsitektur
dan scope sudah didokumentasikan di sana. Jangan menebak ulang keputusan yang
sudah ada di dokumen ini.

> **[Revisi 2026-10-05/06]** Dua hal besar berubah dari draft Phase 0 awal:
> (1) stack backend pindah dari Spring Boot (Java) ke **Next.js full-stack
> (TypeScript)**, dan (2) scope produk meluas dari WMS→WCS→Equipment jadi
> **end-to-end ERP→Delivery** (4 Functional Requirement baru, FR-13–FR-16,
> dan 3 role operator baru). Detail lengkap dan alasannya ada di `docs/ADR.md`.
> **Status FR-13–FR-16 masih usulan** — menunggu konfirmasi resmi dari
> Astra/Winteq sebelum diimplementasikan sebagai requirement final (lihat PRD
> revisi Section 15 "Open Items"). Jangan anggap final tanpa konfirmasi itu.

## Apa project ini

Warehouse Control System (WCS) vendor-neutral untuk Smart Warehouse, mengacu
ke PRD v0.2 (revisi, duplikat dari PRD v0.1 + tambahan scope end-to-end) dan
model referensi ISA-95/IEC 62264. Scope arsitektur: kategori **Simple** (WMS
kirim task langsung ke WCS tanpa lapisan WES), diperluas dengan orkestrasi
end-to-end: ERP (planning produksi & order delivery) → Request raw material →
Produksi → Packaging → Update stock → Delivery ke customer, via robot vendor
PUDU sebagai pilot.

## Dokumen wajib dibaca (urutan disarankan)

| Dokumen | Isi | Status | Kapan dibaca |
| --- | --- | --- | --- |
| `docs/PRD_Smart_WCS_v0.2_Revisi.docx` | Product requirements lengkap, FR-01–FR-16 | Revisi 0.2 | Sebelum apapun — ini sumber kebenaran scope produk |
| `docs/ADR.md` | Keputusan stack teknologi (Next.js) + justifikasi + risiko, termasuk Section 7.1 (PUDU Cloud API butuh internet) | Revisi 2026-10-19 | Sebelum setup apapun |
| `docs/ERD.md` | Data model v3.1: 46 tabel (inti + ERP usulan + 11 tabel adapter PUDU), constraint, index | **Revisi 2026-10-21 (v3.1)** | Sebelum menyentuh `prisma/schema.prisma` |
| `prisma/schema.prisma` | Implementasi ERD v3 (Prisma 7). **Sumber kebenaran schema** — harus selalu sinkron dengan `ERD.md` | **Baru 2026-10-19** | Sebelum query/migration apa pun |
| `docs/pudu-official/PUDU_OFFICIAL_EXCERPT.md` | Kutipan LANGSUNG dari situs dokumentasi resmi PUDU (10 API/callback: InitiateCallTask, CancelCallTask, CompleteCallTask, GetCallList, notifyCustomCall, GetRobotStatusV2, robotStatus, notifyRobotStatus, notifyRobotPose, notifyDeliveryTask) | **Baru 2026-10-22** | **Sumber kebenaran tertinggi** untuk 10 nama di atas — baca SEBELUM `PUDU_INTEGRATION.md` kalau keduanya beda |
| `docs/PUDU_INTEGRATION.md` | Integrasi PUDU Cloud API: base URL, autentikasi HMAC, alur callback, scope T600, pemetaan status & field ke tabel | Revisi 2026-10-22 | Sebelum menulis kode di `src/modules/equipment-adapter/pudu` — untuk API/callback di luar 10 nama yang dicakup excerpt di atas, dokumen ini masih satu-satunya acuan |
| `docs/ADAPTER_CONTRACT.md` | Kontrak netral vendor (`EquipmentAdapter`): operasi, tipe hasil netral, cara registri memilih adapter, langkah menambah vendor baru | **Baru 2026-10-21** | Sebelum menyentuh `src/modules/equipment-adapter/*` (kontrak/registri) atau menambah adapter vendor baru |
| `docs/TASK_STATE_MACHINE.md` | Status Task/Mission yang benar-benar dipakai kode, pemetaan status PUDU, dan bagian "Belum diputuskan" (retryCount, validasi transisi, dll) | **Baru 2026-10-21** | Sebelum mengubah `apply-status-change.ts`/`status-map.ts` atau menambah endpoint transisi status Task |
| `docs/API_SPECIFICATION.md` | Ringkasan modul + endpoint, termasuk 4 modul baru | Revisi 2026-10-05 | Referensi cepat endpoint |
| `docs/ARCHITECTURE.md` | Gambaran arsitektur sistem | Revisi 2026-10-05 | Sebelum setup struktur project |
| `docs/CHANGELOG.md` | Riwayat perubahan dokumen | Revisi 2026-10-19 | Kalau butuh histori keputusan |
| `docs/FUNCTIONAL_BOUNDARY.md` | Batas tanggung jawab WCS vs WMS/RCS/PLC/ERP | Revisi 2026-10-19 | Sebelum implementasi business logic, termasuk FR-13 |
| `docs/USE_CASE.md` | Use case UC-01–UC-16 (UC-13–16 detail lengkap) | Revisi 2026-10-06 | Sebelum implementasi fitur/endpoint, termasuk modul baru |
| `docs/RBAC.md` | Role & matriks akses, termasuk 3 role baru | Revisi 2026-10-06 | Sebelum implementasi auth/guard |
| `docs/openapi-smart-wcs.yaml` | Kontrak API lengkap (OpenAPI 3.0.3), v0.4.0-proposed | Revisi 2026-10-06 | Saat implementasi route handler/schema |

Kalau ada pertanyaan "endpoint ini field-nya apa", "role ini boleh akses apa",
"kenapa stack-nya begini" — jawabannya ada di salah satu file di atas, bukan
di asumsi. Semua dokumen di atas sudah mencakup 4 modul baru (ERP Integration,
Production Line, Packaging, Delivery) dan 3 role baru, tapi **statusnya tetap
usulan** — ditandai `[Revisi 2026-10-05/06, Usulan]` di masing-masing file,
menunggu konfirmasi resmi Astra/Winteq (lihat PRD Section 15 "Open Items").
Beberapa keputusan turunan (role baru vs sub-permission, detail langkah
pre-assembly yang masih ambigu dari PPT) sengaja dibiarkan sebagai open
question eksplisit di RBAC.md Section 4 dan FUNCTIONAL_BOUNDARY.md — jangan
diasumsikan jawabannya saat implementasi.

## Stack (lihat ADR.md untuk alasan lengkap — jangan ganti tanpa diskusi)

> Versi di bawah dicek ulang 6 Oktober 2026 (npm registry + endoflife.date).
> Jangan anggap berlaku selamanya — cek ulang kalau sudah lama sejak tanggal
> ini, terutama Node.js (Node 24 masuk maintenance 20 Okt 2026, tetap
> didukung; Node 26 jadi Active LTS 28 Okt 2026 — migrasi dijadwalkan
> ulang, bukan darurat, lihat ADR.md Section 9.5).
>
> **[Revisi 2026-10-19]** Auth.js v5 diganti **Better Auth** — lihat
> ADR.md Section 9.1 (diputuskan, belum diimplementasikan).

- Backend + Frontend: **Next.js 16 (App Router, LTS), Node.js 24 LTS, TypeScript**
  — satu codebase, dijalankan lewat **custom Node server** (`server.ts`),
  bukan `next start`/serverless biasa, karena butuh WebSocket persisten.
  Node 26 jadi Active LTS 28 Okt 2026 — upgrade setelah itu kalau timeline
  implementasi melewati tanggal tersebut
- Database: **PostgreSQL 18** + **Prisma ORM 7.x** (Rust-free client, ORM + migration) — jangan pakai PostgreSQL 19 (masih beta) atau Prisma 8 (masih RC) untuk production dulu
- Real-time: **Socket.IO 4.8.x / `ws`** di atas custom Node server (status
  task/equipment/alarm event-driven, bukan polling terus-menerus)
- Equipment/IoT: **mqtt.js 5.x** (MQTT), **node-opcua 2.187.x** (OPC UA untuk
  PLC — masih Proposed, perlu PoC, lihat ADR.md Section 5). Belum dipakai:
  ditunda sampai tahap PLC (ADR.md Section 9.3) — pilot PUDU lewat HTTPS
- API: REST + OpenAPI 3.0 (**zod-to-openapi** / **next-swagger-doc**, Zod 4.x)
- Auth: **Better Auth** (diputuskan, belum diimplementasikan — lihat
  ADR.md Section 9.1), self-hosted, adapter Prisma, plugin admin untuk
  RBAC sesuai `docs/RBAC.md`
- Data-fetching client: **TanStack Query v5**
- Test: **Vitest** — unit test untuk kode server (`src/lib/*`, modul
  domain), bukan test UI/E2E
- Log: **pino** (`pino-pretty` di development) lewat `src/lib/logger.ts`
- Validasi env: **Zod** lewat `src/lib/env.ts`
- Deployment: Docker Compose, **on-premise/LAN-first** — operasi inti (task
  execution, dispatching, monitoring, dashboard) tidak boleh bergantung pada
  internet (lihat ADR.md Section 7). **Pengecualian yang disadari:** kontrol
  robot PUDU pilot lewat PUDU Cloud API butuh internet (ADR.md Section 7.1)
- Equipment integration: **Adapter Framework** — kontrak interface baku
  (register, status, mission command, event), satu implementasi per vendor.
  Vendor pilot adalah **PUDU T600** (Open Platform Cloud API — Open API untuk
  command dari WCS dengan autentikasi HMAC, Callback Notification untuk event
  dari PUDU). Detail di `docs/PUDU_INTEGRATION.md`. Tujuan
  akhir arsitektur ini **multi-vendor** — adapter PUDU adalah blueprint,
  bukan batasan.

## Scope produk (ringkas — detail di PRD dan ADR.md Section 1.1)

**FR-01 s/d FR-12** (baku, PRD v0.1): Master Data, Task Management,
Dispatching, Routing, Equipment Integration, AMR/RCS Integration, PLC
Integration, Event & Alarm, Monitoring, Reporting & KPI, Security & Audit,
Material Request.

**FR-13 s/d FR-16** (usulan, revisi 2026-10-05 — end-to-end):
- FR-13 ERP Integration — sinkronisasi Planning Produksi & Order Delivery dari ERP
- FR-14 Production Line Interface — request raw material & calling robot dari Operator Produksi
- FR-15 Packaging Interface — request box packaging dari Operator Box/Packaging
- FR-16 Delivery-to-Customer Interface — calling robot & tracking delivery dari Operator Delivery

**8 role**: Warehouse Operator, Warehouse Supervisor, WCS Administrator,
Maintenance/Engineer, System Integrator (baku) + Operator Produksi, Operator
Box/Packaging, Operator Delivery (baru, role/RBAC-nya belum diformalkan).

## Status implementasi (per 2026-10-22)

- **Infra:** Next.js 16 + custom server (`server.ts`, Socket.IO di path `/ws`),
  Prisma 7 dengan `@prisma/adapter-pg`, PostgreSQL 18 di `docker-compose.yml`.
  Config Prisma ada di `prisma7.config.ts`.
- **Database:** `prisma/schema.prisma` berisi ERD v3.1 (46 model). Migration
  pertama (`prisma/migrations/`) sudah dibuat dan dipartisi sesuai
  `prisma/sql/pudu_pose_log_partition.sql`.
- **UI:** halaman Overview, Task Management, Master Data, Warehouse Map,
  Dispatch sudah jadi, **sengaja masih memakai data mock** (`src/data/mock*.ts`).
  Halaman lain masih `PlaceholderPage`. Tahap ini memang UI statis — jangan
  sambungkan UI ke database atau PUDU kecuali diminta.
- **Backend:** callback PUDU, worker (termasuk sinkronisasi peta, refresh
  laporan posisi, rekonsiliasi task CALL -- lihat `docs/PUDU_INTEGRATION.md`
  bagian 8), klien HMAC yang field/envelope-nya sudah dicocokkan ke
  `docs/pudu-official/PUDU_OFFICIAL_EXCERPT.md` untuk 10 API/callback (lihat
  CHANGELOG 2026-10-22), kontrak adapter netral
  (`src/modules/equipment-adapter/{contract,types,registry}.ts`, lihat
  `docs/ADAPTER_CONTRACT.md`), API Task + CRUD master data, Event & Alarm
  (FR-08), dan Monitoring (FR-09, lihat `docs/TASK_STATE_MACHINE.md` untuk
  state machine Task/Mission) sudah ada. `dispatch()`/`cancel()` adapter
  PUDU sudah mengikuti aturan resmi (cek `run_state`, resolve
  `map_name`/`point_type`) tapi **belum ada pemanggil nyata** dari
  UI/API -- Auth, `pg-boss`, WebSocket live, dan dispatch nyata dari UI/API
  ke robot belum (perlu persetujuan terpisah).
- **Endpoint API yang sudah ada:** `/api/tasks` (+`/{id}`), `/api/robots`
  (+`/{id}`, `/{id}/pose-history`), `/api/equipment` (+`/{id}`),
  `/api/locations` (+`/{id}`), `/api/zones` (+`/{id}`), `/api/materials`
  (+`/{id}`), `/api/events` (+`/{id}`), `/api/alarms` (+`/{id}/acknowledge`,
  `/{id}/clear`), `/api/monitoring/{overview,connections,fleet}`,
  `/api/warehouse-map`, `/api/integrations/pudu/callback`. Belum ada:
  endpoint transisi status Task (`PATCH /tasks/{id}/status`, `/cancel`,
  `/retry`), auth, Integration CRUD.
- **Dokumen yang dirujuk tapi belum ada di repo:**
  `API_CONVENTIONS.md`, `DATA_DICTIONARY.md`. Jangan mengasumsikan isinya
  (lihat catatan di ADR.md Section 9).

## Aturan kerja untuk Claude Code di repo ini

1. **Jangan buat ulang keputusan arsitektur.** Kalau terasa ada yang janggal
   di stack/desain, tanyakan dulu — jangan diam-diam ganti ke pendekatan lain.
2. **Setiap endpoint baru (termasuk 4 modul baru) harus konsisten dengan
   `openapi-smart-wcs.yaml`** (v0.4.0-proposed, sudah mencakup ERP
   Integration/Production Line/Packaging/Delivery) **dan `API_SPECIFICATION.md`.**
   Keduanya source of truth kontrak API. Kalau ada perbedaan antara
   keduanya, flag dan tanyakan — jangan pilih salah satu secara diam-diam.
3. **Setiap endpoint butuh guard sesuai role.** `RBAC.md` sudah mencakup 3
   role baru (Section 1 dan 2.1), tapi role baru vs sub-permission masih
   status **working assumption**, bukan keputusan final (lihat RBAC.md
   Section 4 poin 4). Kalau implementasi auth/guard untuk role baru mulai
   terasa berat untuk diubah nanti, tanyakan dulu sebelum lanjut.
4. **Modular monolith dengan bounded context jelas**: pisahkan folder/module
   per domain (Task, Equipment/Adapter, Event, Security, ERP Integration,
   Production Line, Packaging, Delivery, dst).
5. **Equipment/robot baru = adapter baru**, bukan mengubah WCS Core. Ikuti
   kontrak interface di ADR.md Section 3 (Equipment Integration).
6. **WCS tidak boleh jadi source of truth inventory** (WMS tetap source of
   truth) dan **tidak boleh mengeksekusi keputusan safety-critical** (lihat
   `FUNCTIONAL_BOUNDARY.md`). Kalau sebuah fitur mulai terasa seperti itu,
   berhenti dan tanyakan.
7. **Jangan implementasikan FR-13–FR-16 sebagai final tanpa konfirmasi.**
   Ini masih berstatus usulan — kalau diminta membangun modul ini, boleh
   jalan (sesuai instruksi di chat/prompt), tapi beri komentar/catatan bahwa
   kontraknya (endpoint, schema) masih bisa berubah saat dikonfirmasi resmi.
8. Field yang masih open question (lihat PRD Section 15 "Open Items") jangan
   diasumsikan jawabannya saat implementasi — flag saja di PR/komentar kalau
   relevan.
9. **Schema database:** setiap perubahan `prisma/schema.prisma` harus ikut
   diperbarui di `docs/ERD.md` (dan sebaliknya), lalu dibuat lewat
   `prisma migrate dev` — jangan `db push`. Semua kolom waktu `Timestamptz`
   (UTC). Nilai enum WCS divalidasi di aplikasi (Zod), status mentah vendor
   disimpan apa adanya.
10. **Adapter PUDU:** ikuti `docs/PUDU_INTEGRATION.md`. Endpoint callback hanya
    memverifikasi `CallbackCode`, menyimpan ke `IntegrationLog` (`ON CONFLICT`
    traceId) dan membalas 200 dalam 5 detik; penguraian dilakukan worker.
    Semua tulis data PUDU memakai upsert pada kunci unik di `ERD.md`. Elemen
    peta tidak pernah di-DELETE (soft delete). Lifting/transport/robot group
    di luar scope T600.
11. **Kredensial** (`PUDU_API_APP_SECRET`, `PUDU_CALLBACK_CODE`, `AUTH_SECRET`)
    hanya dari environment (`.env`, lihat `.env.example`) — jangan di-commit
    dan jangan dikirim ke client/browser.
12. **Konfigurasi lewat `src/lib/env.ts`.** Dilarang mengakses `process.env`
    langsung di kode aplikasi (`NODE_ENV` di config Next.js/Prisma yang
    memang butuh akses langsung dikecualikan). Variabel baru ditambah ke
    skema Zod di `env.ts`, bukan dibaca ad-hoc.
13. **Log lewat `src/lib/logger.ts`.** Dilarang `console.log` di kode
    server — pakai `logger` dari `src/lib/logger.ts` supaya level dan
    redaksi field rahasia (authorization, signature, apiAppSecret,
    password, token) konsisten.

## Catatan konteks developer

Dikerjakan oleh Alya (frontend dev di Kalana Labs, mahasiswa S1 Informatika
UNSOED), tanpa pengalaman hands-on IoT/hardware sebelumnya — kalau menjelaskan
sesuatu yang berhubungan dengan OPC UA/MQTT/PLC, boleh disertai analogi
sederhana di komentar PR atau commit message kalau relevan.
