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
| `docs/ADR.md` | Keputusan stack teknologi (Next.js) + justifikasi + risiko | Revisi 2026-10-05 | Sebelum setup apapun |
| `docs/ERD.md` | Data model, termasuk entity baru ERP/Production/Packaging/Delivery | Revisi 2026-10-05 | Sebelum bikin schema Prisma |
| `docs/API_SPECIFICATION.md` | Ringkasan modul + endpoint, termasuk 4 modul baru | Revisi 2026-10-05 | Referensi cepat endpoint |
| `docs/ARCHITECTURE.md` | Gambaran arsitektur sistem | Revisi 2026-10-05 | Sebelum setup struktur project |
| `docs/CHANGELOG.md` | Riwayat perubahan dokumen | Revisi 2026-10-05 | Kalau butuh histori keputusan |
| `docs/FUNCTIONAL_BOUNDARY.md` | Batas tanggung jawab WCS vs WMS/RCS/PLC/ERP | Revisi 2026-10-06 | Sebelum implementasi business logic, termasuk FR-13 |
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
> ini, terutama Node.js (Node 26 jadi Active LTS 28 Okt 2026) dan Auth.js
> (masih beta, bisa saja sudah GA).

- Backend + Frontend: **Next.js 16 (App Router, LTS), Node.js 24 LTS, TypeScript**
  — satu codebase, dijalankan lewat **custom Node server** (`server.ts`),
  bukan `next start`/serverless biasa, karena butuh WebSocket persisten.
  Node 26 jadi Active LTS 28 Okt 2026 — upgrade setelah itu kalau timeline
  implementasi melewati tanggal tersebut
- Database: **PostgreSQL 18** + **Prisma ORM 7.x** (Rust-free client, ORM + migration) — jangan pakai PostgreSQL 19 (masih beta) atau Prisma 8 (masih RC) untuk production dulu
- Real-time: **Socket.IO 4.8.x / `ws`** di atas custom Node server (status
  task/equipment/alarm event-driven, bukan polling terus-menerus)
- Equipment/IoT: **mqtt.js 5.x** (MQTT), **node-opcua 2.179.x** (OPC UA untuk
  PLC — masih Proposed, perlu PoC, lihat ADR.md Section 5)
- API: REST + OpenAPI 3.0 (**zod-to-openapi** / **next-swagger-doc**, Zod 4.x)
- Auth: **Auth.js v5** (`next-auth@beta`, App Router-native — **masih
  berstatus beta**, bukan `next-auth@4` yang didesain untuk Pages Router)
  atau middleware JWT custom (`jose`) kalau butuh sesuatu yang stabil secara
  formal, RBAC sesuai `docs/RBAC.md`
- Data-fetching client: **TanStack Query v5**
- Deployment: Docker Compose, **on-premise/LAN-first** — operasi inti (task
  execution, dispatching, monitoring, dashboard) tidak boleh bergantung pada
  internet (lihat ADR.md Section 7)
- Equipment integration: **Adapter Framework** — kontrak interface baku
  (register, status, mission command, event), satu implementasi per vendor.
  Vendor pilot adalah **PUDU** (Open Platform Cloud API — Open API untuk
  command dari WCS, Callback Notification untuk event dari PUDU). Tujuan
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

## Status implementasi

Skeleton sebelumnya (`backend/` Spring Boot, `frontend/` React+Vite) dibangun
untuk stack **lama** dan **tidak lagi sesuai keputusan ADR terbaru** — jangan
dilanjutkan begitu saja di atas skeleton itu. Sebelum lanjut Phase 1, konfirmasi
dulu: apakah mulai ulang skeleton infra untuk Next.js (`package.json`,
`server.ts`, Prisma schema), atau skeleton existing mau dipertahankan sebagai
referensi migrasi data (V1 migration SQL di skeleton lama masih relevan
sebagai referensi struktur tabel master data, tinggal dipindah ke Prisma
schema).

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

## Catatan konteks developer

Dikerjakan oleh Alya (frontend dev di Kalana Labs, mahasiswa S1 Informatika
UNSOED), tanpa pengalaman hands-on IoT/hardware sebelumnya — kalau menjelaskan
sesuatu yang berhubungan dengan OPC UA/MQTT/PLC, boleh disertai analogi
sederhana di komentar PR atau commit message kalau relevan.
