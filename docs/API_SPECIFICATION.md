# API Specification - Smart WCS Platform

Kontrak API draft Smart WCS Platform Phase 0 (v0.4.0), 93 endpoint di 12 modul, 60 schema. Aturan umum (autentikasi JWT dan API key, format error, pagination, idempotensi, event keluar ke WMS) ada di `API_CONVENTIONS.md`; nilai enum di `DATA_DICTIONARY.md`. Diselaraskan dengan 12 use case (UC-01 s/d UC-12) dan RBAC & Access Control. Source file: `openapi-smart-wcs.yaml`; versi human-readable: dokumen Word "Smart-WCS-API-Specification.docx".

> **[Revisi 2026-10-05]** Section 1 dan 3 mendapat 4 modul baru (lihat `ADR.md` Section 1.1, FR-13 s/d FR-16) untuk scope end-to-end ERP-to-delivery. Endpoint di modul baru ini **belum masuk `openapi-smart-wcs.yaml`** -- jumlah "93 endpoint, 60 schema" di atas masih versi lama, akan diperbarui setelah modul baru dikonfirmasi dan ditambahkan ke YAML. Endpoint di bawah ini berstatus **[Usulan -- scope baru]**, level rincian setara draft, belum final.

## 1. Ringkasan Modul

| Modul | Cakupan | Jumlah Endpoint |
| --- | --- | --- |
| Auth | FR-11 Security & Audit (login, ganti password sendiri) | 2 |
| User & Role Management | FR-11 Kelola user & role (UC-05) | 6 |
| Master Data | FR-01 Master Data (termasuk Node/Edge), Inventory Visibility, Riwayat perpindahan material, Discrepancy (UC-11) | 39 |
| Equipment & Robot | FR-05, FR-06, FR-07 | 12 |
| Task Management | FR-02, FR-03, FR-04 | 8 |
| Event & Alarm | FR-08 (3-state: Active - Acknowledged - Cleared) | 4 |
| Monitoring | FR-09 (termasuk warehouse map) | 3 |
| Diagnostics | UC-09 (Maintenance/Engineer) | 2 |
| Integration Config | UC-10 (System Integrator), API key sistem eksternal | 8 |
| KPI and Reporting | FR-10 (termasuk alarm pareto) | 3 |
| Material Request | FR-12 | 4 |
| Audit & Security Log | FR-11, UC-12 | 2 |
| **ERP Integration** **[Revisi 2026-10-05, Usulan]** | FR-13 -- sinkronisasi Planning Produksi dan Order Delivery dari ERP | 3 |
| **Production Line Interface** **[Revisi 2026-10-05, Usulan]** | FR-14 -- request raw material, progress prepare, finish produksi/calling AMR dari Operator Produksi | 4 |
| **Packaging Interface** **[Revisi 2026-10-05, Usulan]** | FR-15 -- request box packaging dari Operator Box/Packaging | 3 |
| **Delivery Interface** **[Revisi 2026-10-05, Usulan]** | FR-16 -- calling robot delivery dan status pengiriman ke customer dari Operator Delivery | 4 |

## 2. Pemetaan Use Case ke Endpoint

| UC | Nama | Aktor | Endpoint |
| --- | --- | --- | --- |
| UC-01 | Terima task otomatis dari WMS | WMS | POST /tasks (source=WMS) |
| UC-02 | Input task manual | Warehouse Operator | POST /tasks (source=MANUAL) |
| UC-03 | Dispatch task ke resource | WCS (internal), RCS, PLC/Equipment Controller | PATCH /tasks/{id}/status |
| UC-04 | Monitor task & status equipment | Warehouse Operator, Warehouse Supervisor | GET /tasks, GET /equipment/{id}/status, GET /robots/{id}/status, GET /monitoring/overview, GET /warehouse-map |
| UC-05 | Kelola master data | WCS Administrator | /warehouses, /zones, /locations, /nodes, /edges, /routes, /stations, /materials, /equipment, /robots (full CRUD) |
| UC-06 | Terima & tangani event/alarm | Warehouse Operator, PLC/Equipment Controller, RCS | GET /events, GET /alarms, POST /alarms/{id}/acknowledge, POST /alarms/{id}/clear |
| UC-07 | Lihat KPI & laporan | Warehouse Supervisor | GET /kpi, GET /reports/summary, GET /reports/alarm-pareto |
| UC-08 | Request material | Warehouse Operator | POST /material-requests, GET /material-requests, POST /material-requests/{id}/retry |
| UC-09 | Diagnosa equipment & koneksi sistem | Maintenance/Engineer | GET /equipment/{id}/logs, GET /robots/{id}/logs, GET /monitoring/connections |
| UC-10 | Konfigurasi & troubleshooting integrasi sistem | System Integrator | /integrations (CRUD), POST /integrations/{id}/test, GET /integrations/{id}/logs, POST /integrations/{id}/rotate-key |
| UC-11 | Deteksi & notifikasi discrepancy inventory | WCS (internal), WMS | GET /discrepancies, POST /discrepancies/{id}/notify, POST /discrepancies/{id}/resolve, POST /inventory/sync, GET /inventory, GET /material-movements |
| UC-12 | Audit & log keamanan | WCS Administrator, Warehouse Supervisor | GET /audit-logs, GET /audit-logs/{id} |
| **UC-13** **[Revisi 2026-10-05, Usulan]** | Sinkronisasi planning produksi & order delivery | ERP | GET /erp/production-plans, GET /erp/customer-orders, POST /erp/sync |
| **UC-14** **[Revisi 2026-10-05, Usulan]** | Request raw material & serah-terima finish good dari line produksi | Operator Produksi | POST /production-line/material-requests, POST /production-line/finish-goods, GET /production-line/requests/{id} |
| **UC-15** **[Revisi 2026-10-05, Usulan]** | Request packaging/box untuk finish good | Operator Box/Packaging | POST /packaging/requests, GET /packaging/requests/{id} |
| **UC-16** **[Revisi 2026-10-05, Usulan]** | Calling robot delivery & tracking pengiriman ke customer | Operator Delivery | POST /delivery/requests, PATCH /delivery/requests/{id}/status, GET /delivery/requests/{id} |

## 3. Endpoint per Modul

### Auth

| Method | Path | Deskripsi |
| --- | --- | --- |
| POST | /auth/login | Login dan terima JWT |
| PATCH | /users/me/password | Ubah password akun sendiri (self-service, FR-11) |

### User & Role Management

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /users | List user |
| POST | /users | Buat user baru (hanya WCS Administrator) |
| GET | /users/{userId} | Detail user |
| PATCH | /users/{userId} | Update user (role, status aktif, dll) |
| DELETE | /users/{userId} | Nonaktifkan user |
| GET | /roles | List role yang tersedia |

### Master Data

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /warehouses | List warehouse |
| POST | /warehouses | Buat warehouse baru |
| PATCH | /warehouses/{warehouseId} | Ubah data warehouse |
| DELETE | /warehouses/{warehouseId} | Hapus warehouse |
| GET | /zones | List zone |
| POST | /zones | Buat zone baru |
| PATCH | /zones/{zoneId} | Ubah data zone |
| DELETE | /zones/{zoneId} | Hapus zone |
| GET | /locations | List location |
| POST | /locations | Buat location baru |
| PATCH | /locations/{locationId} | Ubah data location |
| DELETE | /locations/{locationId} | Hapus location |
| GET | /routes | List route antar lokasi |
| POST | /routes | Buat route baru |
| PATCH | /routes/{routeId} | Ubah data route |
| DELETE | /routes/{routeId} | Hapus route |
| GET | /stations | List station |
| POST | /stations | Buat station baru |
| PATCH | /stations/{stationId} | Ubah data station |
| DELETE | /stations/{stationId} | Hapus station |
| GET | /materials | List material |
| POST | /materials | Buat master material baru |
| PATCH | /materials/{materialId} | Ubah data material |
| DELETE | /materials/{materialId} | Hapus material |
| GET | /discrepancies | List discrepancy hasil eksekusi task vs data WMS (FR-01, UC-11) |
| GET | /discrepancies/{discrepancyId} | Detail discrepancy |
| POST | /discrepancies/{discrepancyId}/notify | Kirim/kirim-ulang notifikasi discrepancy ke WMS |
| POST | /discrepancies/{discrepancyId}/resolve | Tandai discrepancy sudah direkonsiliasi |
| GET | /nodes | List node (titik referensi pergerakan) |
| POST | /nodes | Buat node baru |
| PATCH | /nodes/{nodeId} | Ubah data node |
| DELETE | /nodes/{nodeId} | Hapus node |
| GET | /edges | List edge (jalur penghubung node) |
| POST | /edges | Buat edge baru |
| PATCH | /edges/{edgeId} | Ubah data edge, termasuk aktif/nonaktif jalur |
| DELETE | /edges/{edgeId} | Hapus edge |
| GET | /inventory | Operational inventory view (FR-01) |
| POST | /inventory/sync | Terima inventory dari WMS (API key WMS, idempoten per syncId) |
| GET | /material-movements | Riwayat perpindahan material (FR-01) |

### Equipment & Robot

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /equipment | List equipment |
| POST | /equipment | Daftarkan equipment baru (FR-05) |
| GET | /equipment/{equipmentId} | Detail equipment |
| PATCH | /equipment/{equipmentId} | Update konfigurasi equipment |
| DELETE | /equipment/{equipmentId} | Hapus/nonaktifkan equipment |
| GET | /equipment/{equipmentId}/status | Status real-time equipment, termasuk posisi x/y (FR-09) |
| GET | /robots | List robot/AMR terdaftar (FR-06) |
| POST | /robots | Daftarkan robot baru lewat Adapter |
| GET | /robots/{robotId} | Detail robot |
| PATCH | /robots/{robotId} | Update konfigurasi robot |
| DELETE | /robots/{robotId} | Hapus/nonaktifkan robot |
| GET | /robots/{robotId}/status | Status real-time robot - posisi, battery, mission aktif |

### Task Management

| Method | Path | Deskripsi |
| --- | --- | --- |
| POST | /tasks | Buat task baru (WMS/manual) |
| GET | /tasks | List/query task |
| GET | /tasks/{taskId} | Detail task |
| PATCH | /tasks/{taskId}/status | Transisi status task sesuai state machine (PRD Section 11) |
| POST | /tasks/{taskId}/cancel | Batalkan task |
| POST | /tasks/{taskId}/retry | Retry task yang FAILED |
| GET | /tasks/{taskId}/history | Riwayat perubahan status task + timestamp + alasan (FR-02) |
| GET | /tasks/{taskId}/missions | Riwayat mission/command per percobaan (FR-06, traceability) |

### Event & Alarm

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /events | List event |
| GET | /alarms | List alarm |
| POST | /alarms/{alarmId}/acknowledge | Acknowledge alarm oleh operator |
| POST | /alarms/{alarmId}/clear | Clear/reset alarm |

### Monitoring

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /monitoring/overview | Ringkasan kondisi warehouse real-time |
| GET | /monitoring/connections | Status koneksi WCS ke sistem/equipment lain |
| GET | /warehouse-map | Peta warehouse: node, edge, lokasi, posisi equipment/robot (FR-09) |

### Diagnostics

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /equipment/{equipmentId}/logs | Riwayat error/event equipment untuk troubleshooting |
| GET | /robots/{robotId}/logs | Riwayat error/event robot untuk troubleshooting |

### Integration Config

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /integrations | List koneksi integrasi ke WMS/RCS/PLC |
| POST | /integrations | Daftarkan koneksi integrasi baru |
| GET | /integrations/{integrationId} | Detail konfigurasi integrasi |
| PATCH | /integrations/{integrationId} | Ubah konfigurasi integrasi |
| DELETE | /integrations/{integrationId} | Hapus konfigurasi integrasi |
| POST | /integrations/{integrationId}/test | Test/ping koneksi ke sistem eksternal |
| GET | /integrations/{integrationId}/logs | Log percobaan koneksi & pertukaran pesan |
| POST | /integrations/{integrationId}/rotate-key | Buat/ganti API key sistem eksternal (ditampilkan sekali) |

### KPI and Reporting

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /reports/summary | Ringkasan laporan gabungan untuk Supervisor |
| GET | /kpi | Ambil nilai KPI |
| GET | /reports/alarm-pareto | Alarm Pareto: jenis alarm paling sering (FR-10) |

### Material Request

| Method | Path | Deskripsi |
| --- | --- | --- |
| POST | /material-requests | Buat permintaan material (FR-12) |
| GET | /material-requests | List material request |
| GET | /material-requests/{requestId} | Status material request |
| POST | /material-requests/{requestId}/retry | Retry manual request yang FAILED oleh Operator (UC-08) |

### Audit & Security Log

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /audit-logs | List audit log perubahan konfigurasi & aktivitas pengguna (FR-11, UC-12) |
| GET | /audit-logs/{auditLogId} | Detail satu entry audit log |

### ERP Integration [Revisi 2026-10-05, Usulan]

| Method | Path | Deskripsi |
| --- | --- | --- |
| GET | /erp/production-plans | List Planning Produksi per shift (tipe, qty, line) yang sudah disinkronkan dari ERP (FR-13) |
| GET | /erp/customer-orders | List Order Delivery (waktu, tipe, qty) dari ERP (FR-13) |
| POST | /erp/sync | Trigger sinkronisasi manual/webhook dari ERP (`Get Method`, lihat ARCHITECTURE.md §3); dipanggil ERP atau dijadwalkan WCS |

### Production Line Interface [Revisi 2026-10-05, Usulan]

| Method | Path | Deskripsi |
| --- | --- | --- |
| POST | /production-line/material-requests | Operator produksi request raw material (tipe, qty, line) ke warehouse (FR-14) |
| GET | /production-line/requests/{requestId} | Status request (material atau finish good pickup) |
| POST | /production-line/finish-goods | Notifikasi finish produksi percycle -> trigger calling AMR untuk pick-drop finish good ke warehouse (FR-14) |
| GET | /production-line/requests | List request per line/shift |

### Packaging Interface [Revisi 2026-10-05, Usulan]

| Method | Path | Deskripsi |
| --- | --- | --- |
| POST | /packaging/requests | Request box packaging untuk finish good (FR-15) |
| GET | /packaging/requests/{requestId} | Status packaging request |
| GET | /packaging/requests | List packaging request |

### Delivery Interface [Revisi 2026-10-05, Usulan]

| Method | Path | Deskripsi |
| --- | --- | --- |
| POST | /delivery/requests | Operator delivery calling robot untuk proses pengiriman, terhubung ke `CustomerOrder` (FR-16) |
| PATCH | /delivery/requests/{requestId}/status | Update status pengiriman (DISPATCHED/DELIVERED/FAILED) |
| GET | /delivery/requests/{requestId} | Detail satu delivery request |
| GET | /delivery/requests | List delivery request, filter per order/status |

## 4. Schema Utama

Detail lengkap 60 schema ada di `openapi-smart-wcs.yaml` dan dokumen Word. Yang relevan dengan perbaikan terbaru:

| Schema | Field kunci |
| --- | --- |
| Task | taskId, source (WMS/WES/MANUAL/API), externalRef (idempotensi), status (TaskStatus), priority, assignedResourceId, failureCode, retryCount |
| TaskStatus (enum) | CREATED, VALIDATED, QUEUED, ASSIGNED, DISPATCHED, RUNNING, COMPLETED, FAILED, RETRY, CANCELLED |
| EquipmentStatus | equipmentId, status, x, y (posisi warehouse map), recordedAt |
| Alarm | alarmId, status (ACTIVE/ACKNOWLEDGED/CLEARED), acknowledgedBy, acknowledgedAt |
| Discrepancy | discrepancyId, taskId, expectedQuantity/actualQuantity, expectedLocationId/actualLocationId, status (OPEN/NOTIFIED/RESOLVED) |
| AuditLog | auditLogId, userId, action, targetType/targetId, beforeValue/afterValue, result, occurredAt |
| **ProductionPlan** **[Revisi 2026-10-05, Usulan]** | planId, lineId, materialId, shiftDate, shiftNumber, plannedQty, source=ERP, syncedAt |
| **CustomerOrder** **[Revisi 2026-10-05, Usulan]** | orderId, customerName, materialId, quantity, requestedDeliveryAt, status, source=ERP |
| **ProductionLineRequest** **[Revisi 2026-10-05, Usulan]** | requestId, lineId, requestType (RAW_MATERIAL/FINISH_GOOD_PICKUP), materialId, quantity, status, taskId |
| **PackagingRequest** **[Revisi 2026-10-05, Usulan]** | packagingRequestId, materialId, boxType, quantity, status, taskId |
| **DeliveryRequest** **[Revisi 2026-10-05, Usulan]** | deliveryRequestId, orderId, taskId, status (PENDING/DISPATCHED/DELIVERED/FAILED), dispatchedAt, deliveredAt |

Detail lengkap schema baru di atas ada di `ERD.md` bagian "ERP & Production Integration Data" -- belum dituangkan ke `openapi-smart-wcs.yaml`, menunggu konfirmasi FR-13 s/d FR-16.

## Sumber

File sumber: `openapi-smart-wcs.yaml` (v0.4.0). Mengacu ke PRD Smart WCS Platform v0.1 (23 Sep 2026) Section 7, 9.5, 10, 11, serta dokumen Use Case dan RBAC & Access Control pada project ini.
