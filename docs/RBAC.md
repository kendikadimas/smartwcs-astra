# RBAC and Access Control

Oct 2, 2026 - @Alya
**[Revisi 2026-10-05/06]** Ditambahkan 3 role usulan dan 4 modul usulan untuk
scope end-to-end (ERP -> Delivery). Lihat ADR.md Section 1.1 dan PRD v0.2
Section 15 "Open Items" -- belum dikonfirmasi resmi oleh Astra/Winteq.

Matriks hak akses ini menerjemahkan aktor manusia dari dokumen Use Case dan
modul dari `openapi-smart-wcs.yaml` menjadi aturan otorisasi untuk tim backend.

## 1. Role & Aktor

Mengacu ke Use Case Doc (PRD Section 6), ada 5 role manusia tetap dengan login ke sistem, plus 3 role usulan untuk scope end-to-end. Sistem eksternal (WMS, RCS, PLC/Equipment Controller, ERP, PUDU Cloud API) tidak punya akun/login -- mereka masuk lewat Integration Config (token/API key per koneksi), bukan role manusia.

| Role | Dasar (Use Case) | Cakupan tanggung jawab |
| --- | --- | --- |
| Warehouse Operator | UC-02, UC-04, UC-06, UC-08 | Operasional harian: input task manual, monitor, acknowledge alarm, request material. **[Revisi 2026-10-05]** Diperluas mencakup hop Interface Operator Warehouse: siapkan material & calling robot ke Line Produksi (UC-14), terima inbound Warehouse Finish Good dari Packaging (UC-15) -- lihat Section 4 soal rekomendasi perluasan role ini |
| Warehouse Supervisor | UC-04, UC-07 | Pengawasan: monitor lintas operator, lihat KPI/laporan, atur prioritas |
| WCS Administrator | UC-05 | Kelola master data, kelola user & role, konfigurasi sistem |
| Maintenance / Engineer | UC-09 | Diagnosa equipment/robot, baca log error untuk troubleshooting hardware |
| System Integrator | UC-10 | Konfigurasi & troubleshooting integrasi ke WMS/RCS/PLC/ERP/PUDU Cloud API |
| **Operator Produksi** *(Usulan -- Baru)* | UC-14 | Request raw material ke warehouse, lapor finish produksi percycle -> memicu calling robot ke Packaging (FR-14) |
| **Operator Box/Packaging** *(Usulan -- Baru)* | UC-15 | Request box packaging untuk finish good sebelum masuk Warehouse Finish Good (FR-15) |
| **Operator Delivery** *(Usulan -- Baru)* | UC-16 | Mulai & pantau proses pengiriman ke customer, terhubung ke Order Delivery ERP (FR-16) |

## 2. Matriks Hak Akses per Modul

Level akses: **Full** = create/read/update/delete, **Write** = create/update (tanpa delete), **Read** = lihat saja, **None** = tidak ada akses (request ditolak 403).

| Modul | Operator | Supervisor | Administrator | Maintenance/Engineer | System Integrator |
| --- | --- | --- | --- | --- | --- |
| Auth | Self (login) | Self (login) | Self (login) | Self (login) | Self (login) |
| User & Role Management | None | None | Full | None | None |
| Master Data | Read | Read | Full | Read | Read |
| Equipment & Robot | Read | Read | Full | Read | Read |
| Task Management | Write | Write | Read | None | Read |
| Event & Alarm | Write | Write | Read | Read | Read |
| Monitoring | Read | Read | Read | Read | Read |
| Diagnostics | None | Read | Read | Read | None |
| Integration Config | None | None | Read | None | Full |
| KPI and Reporting | Read | Read | Read | None | None |
| Material Request | Write | Read | Read | None | None |

### 2.1 Modul baru -- scope end-to-end *(Usulan, Revisi 2026-10-05)*

Role baru di bawah **hanya** punya akses ke modul kolomnya sendiri plus
Monitoring (Read, scope terbatas ke request/task miliknya sendiri -- lihat
open question nomor 4 di Section 4). Role lama **tidak** otomatis dapat akses
ke modul baru ini kecuali disebut eksplisit.

| Modul | Operator Produksi | Operator Box/Packaging | Operator Delivery | Warehouse Operator | Administrator |
| --- | --- | --- | --- | --- | --- |
| ERP Integration | Read (production-plans miliknya) | None | Read (customer-orders miliknya) | None | Read |
| Production Line Interface | Write | None | None | Read (lihat Catatan di Section 1) | Read |
| Packaging Interface | None | Write | None | Read | Read |
| Delivery Interface | None | None | Write | None | Read |

## 3. Detail Otorisasi per Endpoint

Aturan konkret untuk guard/middleware otorisasi di backend, mengacu ke `openapi-smart-wcs.yaml` v0.4.0-proposed. Endpoint yang tidak disebut eksplisit mengikuti level modulnya di Section 2 (atau 2.1 untuk modul baru).

| Endpoint | Role yang diizinkan | Catatan |
| --- | --- | --- |
| POST /users | WCS Administrator | Hanya Administrator yang bisa buat user baru |
| PATCH/DELETE /users/{id} | WCS Administrator | Termasuk ubah role dan nonaktifkan akun |
| GET /users, /roles | WCS Administrator |  |
| POST/PATCH/DELETE /warehouses, /zones, /locations, /routes, /stations, /materials | WCS Administrator | Operator/Supervisor/Maintenance/Integrator: GET saja |
| PATCH /equipment/{id}, /robots/{id} | WCS Administrator, Maintenance/Engineer | Maintenance hanya boleh ubah field status/konfigurasi teknis, bukan vendor/lokasi |
| DELETE /equipment/{id}, /robots/{id} | WCS Administrator |  |
| GET /equipment/{id}/logs, /robots/{id}/logs | Maintenance/Engineer, Warehouse Supervisor, WCS Administrator | Operator dan Integrator tidak bisa akses |
| POST /tasks | Warehouse Operator (source=MANUAL), WMS (source=WMS, lewat Integration) |  |
| PATCH /tasks/{id}/status | Sistem internal (WCS Core), RCS, PLC lewat Integration Config | Tidak dipanggil langsung oleh role manusia |
| POST /tasks/{id}/cancel | Warehouse Operator, Warehouse Supervisor |  |
| POST /tasks/{id}/retry | Warehouse Supervisor | Operator tidak bisa retry sendiri -- butuh approval Supervisor |
| POST /alarms/{id}/acknowledge | Warehouse Operator, Warehouse Supervisor, Maintenance/Engineer |  |
| POST /alarms/{id}/clear | Warehouse Supervisor, Maintenance/Engineer | Operator tidak boleh clear, hanya acknowledge |
| GET/POST/PATCH/DELETE /integrations | System Integrator | WCS Administrator: GET saja (oversight) |
| POST /integrations/{id}/test | System Integrator |  |
| GET /integrations/{id}/logs | System Integrator, WCS Administrator |  |
| GET /kpi, /reports/summary | Warehouse Supervisor, WCS Administrator | Operator: GET /kpi terbatas ke metric task miliknya sendiri |
| POST /material-requests | Warehouse Operator |  |
| GET /erp/production-plans, /erp/customer-orders | Operator Produksi, Operator Delivery, WCS Administrator, System Integrator | *[Usulan]* Operator Produksi hanya lihat production-plans, Operator Delivery hanya lihat customer-orders |
| POST /erp/sync | System Integrator | *[Usulan]* Trigger manual; ERP sendiri masuk lewat Integration Config (service-to-service), bukan role manusia |
| POST /production-line/material-requests, /production-line/finish-goods | Operator Produksi | *[Usulan]* |
| GET /production-line/requests, /production-line/requests/{id} | Operator Produksi, Warehouse Operator, Warehouse Supervisor | *[Usulan]* Warehouse Operator perlu lihat ini untuk tahu request mana yang perlu disiapkan |
| POST /packaging/requests | Operator Box/Packaging | *[Usulan]* |
| GET /packaging/requests, /packaging/requests/{id} | Operator Box/Packaging, Warehouse Operator, Warehouse Supervisor | *[Usulan]* |
| POST /delivery/requests | Operator Delivery | *[Usulan]* |
| PATCH /delivery/requests/{id}/status | Operator Delivery, Sistem internal (WCS Core via callback PUDU) | *[Usulan]* Mirip pola `PATCH /tasks/{id}/status` -- update status biasanya otomatis dari callback robot, bukan manual |
| GET /delivery/requests, /delivery/requests/{id} | Operator Delivery, Warehouse Supervisor | *[Usulan]* |

## 4. Catatan & Pengecualian

Maintenance/Engineer diturunkan dari Write menjadi Read pada modul Equipment & Robot dan Event & Alarm, menyesuaikan dengan PRD Section 6 yang mendeskripsikan peran ini sebagai diagnosa/pengecekan (UC-09), bukan pengubahan data atau acknowledge alarm -- wewenang itu tetap di WCS Administrator (master data) dan Warehouse Operator/Supervisor (acknowledge alarm).

- **Self-service**: semua role bisa ubah password milik sendiri lewat endpoint auth terpisah (belum ada di spec v0.2.0 -- perlu ditambahkan `PATCH /users/me/password`), tanpa butuh role Administrator. **[Revisi 2026-10-23, Bagian 1 Fase B]** Diimplementasikan -- `PATCH /users/me/password`, lewat `auth.api.changePassword` Better Auth.
- **Audit log**: setiap aksi Write/Full (terutama acknowledge alarm, ubah master data, ubah konfigurasi integrasi) wajib tercatat siapa pelakunya dan kapan -- ini sudah implisit lewat field seperti `acknowledgedBy` di schema `Alarm`, tapi belum ada audit log terpusat yang bisa di-query. Masuk ke FR-11 (Security & Audit) tapi belum ada endpoint-nya. **[Revisi 2026-10-23, Bagian 1 Fase C]** `AuditLog` sekarang ditulis (`src/modules/security/audit-log.ts`) dari login, user/role diubah, alarm acknowledge/clear, dan task dispatch/cancel/retry -- belum ada endpoint `GET /audit-log` untuk query-nya (di luar scope Bagian 1).
- **[Baru, Revisi 2026-10-23, Bagian 1 Fase D]** `PATCH /tasks/{id}/status` butuh role manusia untuk digerbang (sampai Integration Config auth sungguhan untuk RCS/PLC dibangun) -- diputuskan sementara memakai **System Integrator** (role manusia paling dekat dengan "mengoperasikan integrasi"), BUKAN keputusan final. Perlu didiskusikan ulang saat auth RCS/PLC sungguhan ada.
- **[Baru, Revisi 2026-10-23, Bagian 1 Fase D]** `POST /tasks` di Section 3 cuma menyebut Warehouse Operator (bukan Supervisor, walau Section 2 memberi Supervisor "Write" juga) -- baris eksplisit Section 3 diikuti sebagai keputusan (POST /tasks: Operator saja), lihat `src/app/api/tasks/route.ts`.
- **[Baru, Revisi 2026-10-23, Bagian 1 Fase D]** `POST /tasks/{id}/dispatch` BUKAN endpoint di spec v0.4.0-proposed (ditambahkan Bagian 1 Fase D supaya ada jalur pemicu dispatch nyata) -- digerbang ke Warehouse Operator + Warehouse Supervisor (sama seperti Task Management "Write"), akan disinkronkan ke RBAC/OpenAPI resmi di Bagian 2.
- **Kredensial integrasi**: field `credentials` di schema `Integration` cuma bisa ditulis (create/update), tidak pernah dikembalikan di response GET -- ini desain yang sudah benar, dipertahankan.
- **Keputusan yang masih terbuka**:
  1. Apakah Warehouse Operator butuh notifikasi push/realtime untuk alarm, atau cukup polling `GET /alarms`?
  2. Apakah WCS Administrator butuh role tambahan "Super Admin" yang bisa override semua (termasuk emergency stop), terpisah dari Administrator biasa?
  3. Siapa yang approve kalau System Integrator mau ubah konfigurasi integrasi yang sedang dipakai production (perlu maintenance window atau bisa langsung)?
  4. **[Baru, Revisi 2026-10-05]** Operator Produksi, Operator Box/Packaging, dan Operator Delivery: apakah jadi **role baru** di enum `Role` (seperti ditulis di Section 1 dan `openapi-smart-wcs.yaml`), atau **sub-permission** dari role existing (mis. "Warehouse Operator dengan akses Production Line")? Section 1-3 dokumen ini mengasumsikan opsi role baru sebagai working assumption supaya endpoint di atas bisa dirancang, **tapi ini belum keputusan final** -- lihat ADR.md "Belum dikerjakan" dan PRD v0.2 Section 15.
  5. **[Baru, Revisi 2026-10-05]** Apakah Warehouse Operator yang diperluas (Section 1) perlu dipecah jadi sub-role terpisah ("Warehouse Operator - Produksi" vs "Warehouse Operator - Packaging") kalau satu warehouse besar punya staff berbeda untuk tiap hop, atau cukup satu role yang akses semua hop?
  6. **[Baru, Revisi 2026-10-05]** Scope monitoring role baru (Section 2.1, "scope terbatas ke request/task miliknya sendiri") perlu didefinisikan presisi: filter by `createdBy` saja, atau juga by `lineId`/area kerja?
- Matriks ini perlu direview ulang kalau ada perubahan jumlah role/use case di dokumen Use Case.
