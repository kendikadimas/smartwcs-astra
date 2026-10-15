# ERD -- Data Model Smart WCS Platform


Turunan dari data model PRD Section 9, dipecah jadi 4 kelompok: Master, Transaction, Event, Security, plus **ERP & Production Integration Data [Revisi 2026-10-05, Usulan]** -- kelompok baru untuk scope end-to-end (ERP, production line, packaging, delivery-to-customer) yang belum ada di PRD v0.1. Lihat `ADR.md` Section 1.1 untuk latar belakang dan status FR yang diusulkan (FR-13 s/d FR-16).

## Gambaran relasi

&#91;embedded content: ERD ringkas - 4 kelompok, Task sebagai pusat\]

Task merujuk Master data (Equipment/Robot, Material, Location), lalu perubahan statusnya memicu Event. Security mengatur akses ke seluruh entity di atas lewat Role-based permission -- tidak digambar sebagai panah tersendiri karena sifatnya cross-cutting ke semua entity.

## Master Data

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Warehouse | warehouseId | UUID | PK |
| Warehouse | name | VARCHAR |  |
| Warehouse | address | VARCHAR |  |
| Zone | zoneId | UUID | PK |
| Zone | warehouseId | UUID | FK -> Warehouse |
| Zone | name | VARCHAR |  |
| Zone | zoneType | VARCHAR |  |
| Location | locationId | UUID | PK |
| Location | zoneId | UUID | FK -> Zone |
| Location | nodeId | UUID | FK -> Node, nullable (titik peta tempat lokasi berada) |
| Location | code | VARCHAR |  |
| Location | locationType | VARCHAR |  |
| Node | nodeId | UUID | PK |
| Node | zoneId | UUID | FK -> Zone |
| Node | x, y | DECIMAL | koordinat |
| Edge | edgeId | UUID | PK |
| Edge | fromNodeId | UUID | FK -> Node |
| Edge | toNodeId | UUID | FK -> Node |
| Edge | isActive | BOOLEAN |  |
| Equipment | equipmentId | UUID | PK |
| Equipment | locationId | UUID | FK -> Location |
| Equipment | equipmentType | VARCHAR | mis. conveyor, PLC |
| Equipment | vendor | VARCHAR |  |
| Equipment | status | VARCHAR | ONLINE/OFFLINE/ERROR/MAINTENANCE (lihat DATA_DICTIONARY.md) |
| Equipment | capabilities | JSONB | kemampuan untuk dispatching (PRD FR-03): taskTypes, maxPayloadKg, supportsCancel, dst. Lihat ADAPTER_CONTRACT.md bagian 4 |
| Robot | robotId | UUID | PK |
| Robot | equipmentId | UUID | FK -> Equipment (1:1, base record) |
| Robot | vendor | VARCHAR | mis. Pudu |
| Robot | model | VARCHAR |  |
| Robot | protocol | VARCHAR | mis. VDA5050 |
| Station | stationId | UUID | PK |
| Station | zoneId | UUID | FK -> Zone |
| Station | locationId | UUID | FK -> Location (agar station bisa jadi titik asal/tujuan task, PRD 9.5 "location/station") |
| Station | name | VARCHAR |  |
| Station | stationType | VARCHAR | PICKUP/DROPOFF/CHARGING/STAGING |
| Material | materialId | UUID | PK |
| Material | sku | VARCHAR |  |
| Material | name | VARCHAR |  |
| Material | unit | VARCHAR |  |
| Route | routeId | UUID | PK |
| Route | zoneId | UUID | FK -> Zone |
| Route | fromLocationId | UUID | FK -> Location |
| Route | toLocationId | UUID | FK -> Location |
| Route | resourceType | VARCHAR | EQUIPMENT / ROBOT |
| Route | isActive | BOOLEAN |  |

## Transaction Data

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Task | taskId | UUID | PK |
| Task | taskType | VARCHAR | MOVE/PICKUP/DROP/etc |
| Task | source | VARCHAR | WMS/WES/MANUAL/API -- asal task (PRD FR-02 dan Section 11 CREATED). Bukan `source` pada PRD 9.5, yang berarti lokasi asal (lihat sourceLocationId) |
| Task | sourceLocationId | UUID | FK -> Location |
| Task | destinationLocationId | UUID | FK -> Location |
| Task | materialId | UUID | FK -> Material, nullable |
| Task | containerId | VARCHAR | nullable |
| Task | quantity | DECIMAL | nullable |
| Task | priority | INT |  |
| Task | status | VARCHAR | state machine (Section 11 PRD) |
| Task | resourceType | VARCHAR | EQUIPMENT / ROBOT, nullable |
| Task | assignedResourceId | UUID | FK polymorphic -> Equipment/Robot, nullable |
| Task | createdAt | TIMESTAMP |  |
| Task | startedAt | TIMESTAMP | nullable |
| Task | completedAt | TIMESTAMP | nullable |
| Task | failureCode | VARCHAR | nullable; NO_RESOURCE_AVAILABLE/DISPATCH_TIMEOUT/ACK_TIMEOUT/TASK_TIMEOUT/COMM_LOST/RESOURCE_ERROR (lihat TASK_STATE_MACHINE.md) |
| Task | externalRef | VARCHAR | ID task di sistem pengirim; wajib untuk WMS/WES/API. UNIQUE bersama `source` untuk idempotensi `POST /tasks` (lihat TASK_STATE_MACHINE.md) |
| Task | retryCount | INT | default 0; bertambah setiap RETRY |
| TaskStatusHistory | historyId | UUID | PK |
| TaskStatusHistory | taskId | UUID | FK -> Task |
| TaskStatusHistory | fromStatus | VARCHAR | nullable (kosong saat task pertama dibuat) |
| TaskStatusHistory | toStatus | VARCHAR | TaskStatus (PRD Section 11) |
| TaskStatusHistory | reason | VARCHAR | nullable; alasan FAILED/CANCELLED/RETRY (PRD FR-02) |
| TaskStatusHistory | changedBy | UUID | FK -> User, nullable (kosong jika diubah sistem/RCS/PLC) |
| TaskStatusHistory | changedAt | TIMESTAMP |  |
| TaskDetail | taskDetailId | UUID | PK |
| TaskDetail | taskId | UUID | FK -> Task |
| TaskDetail | lineNo | INT |  |
| TaskDetail | metadata | JSONB | field fleksibel |
| Mission | missionId | UUID | PK |
| Mission | taskId | UUID | FK -> Task |
| Mission | robotId | UUID | FK -> Robot |
| Mission | externalMissionId | VARCHAR | nullable; ID mission di RCS (untuk cancel dan rekonsiliasi) |
| Mission | attempt | INT | percobaan ke-n untuk task ini (naik saat retry) |
| Mission | status | VARCHAR | PENDING/SUBMITTED/ACCEPTED/RUNNING/COMPLETED/FAILED/CANCELLED |
| Mission | createdAt | TIMESTAMP |  |
| Mission | updatedAt | TIMESTAMP |  |
| Assignment | assignmentId | UUID | PK |
| Assignment | taskId | UUID | FK -> Task |
| Assignment | resourceType | VARCHAR | EQUIPMENT / ROBOT |
| Assignment | resourceId | UUID | FK polymorphic |
| Assignment | assignedAt | TIMESTAMP |  |
| MaterialMovement | movementId | UUID | PK |
| MaterialMovement | taskId | UUID | FK -> Task |
| MaterialMovement | materialId | UUID | FK -> Material |
| MaterialMovement | fromLocationId | UUID | FK -> Location |
| MaterialMovement | toLocationId | UUID | FK -> Location |
| MaterialMovement | containerId | VARCHAR | nullable |
| MaterialMovement | quantity | DECIMAL | jumlah yang benar-benar dipindahkan (hasil eksekusi) |
| MaterialMovement | resourceType | VARCHAR | EQUIPMENT / ROBOT, nullable (PRD Traceability: equipment yang memproses) |
| MaterialMovement | resourceId | UUID | FK polymorphic, nullable |
| MaterialMovement | movedAt | TIMESTAMP |  |
| InventoryItem | inventoryId | UUID | PK (operational inventory view, PRD FR-01) |
| InventoryItem | materialId | UUID | FK -> Material |
| InventoryItem | locationId | UUID | FK -> Location |
| InventoryItem | containerId | VARCHAR | nullable (pallet/cart/container) |
| InventoryItem | quantity | DECIMAL |  |
| InventoryItem | source | VARCHAR | WMS_SYNC/EXECUTION -- asal pembaruan terakhir |
| InventoryItem | updatedAt | TIMESTAMP |  |
| InventoryItem | lastSyncedAt | TIMESTAMP | nullable; kapan terakhir disinkronkan dari WMS |
| MaterialRequest | requestId | UUID | PK (PRD FR-12, UC-08) |
| MaterialRequest | materialId | UUID | FK -> Material |
| MaterialRequest | quantity | DECIMAL |  |
| MaterialRequest | destinationLocationId | UUID | FK -> Location |
| MaterialRequest | status | VARCHAR | nilai belum diputuskan (UC-08 vs `TaskStatus` di OpenAPI, lihat CHANGELOG "Masih terbuka"); sementara mengikuti OpenAPI |
| MaterialRequest | taskId | UUID | FK -> Task, nullable (terisi setelah task eksekusi dibuat) |
| MaterialRequest | createdAt | TIMESTAMP |  |
| Discrepancy | discrepancyId | UUID | PK (PRD FR-01, UC-11) |
| Discrepancy | taskId | UUID | FK -> Task |
| Discrepancy | materialId | UUID | FK -> Material, nullable |
| Discrepancy | expectedQuantity | DECIMAL |  |
| Discrepancy | actualQuantity | DECIMAL |  |
| Discrepancy | expectedLocationId | UUID | FK -> Location, nullable |
| Discrepancy | actualLocationId | UUID | FK -> Location, nullable |
| Discrepancy | status | VARCHAR | OPEN/NOTIFIED/RESOLVED |
| Discrepancy | detectedAt | TIMESTAMP |  |
| Discrepancy | notifiedAt | TIMESTAMP | nullable |
| Discrepancy | resolvedAt | TIMESTAMP | nullable |

## ERP & Production Integration Data [Revisi 2026-10-05, Usulan]

Entity baru untuk scope end-to-end (ADR Section 1.1): integrasi ERP langsung, production line interface, packaging interface, dan delivery-to-customer. **Semua entity di bagian ini belum ada di PRD Section 9** -- usulan engineering, menunggu konfirmasi dan formalisasi FR-13 s/d FR-16 oleh Astra/Winteq.

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Line | lineId | UUID | PK (production line, mis. "Line 1") |
| Line | zoneId | UUID | FK -> Zone |
| Line | name | VARCHAR |  |
| Line | shiftCapacityUnit | DECIMAL | kapasitas produksi per shift, mis. 330 unit/shift/line (dari ADM di diagram referensi) |
| ProductionPlan | planId | UUID | PK (FR-13 ERP Integration -- "Planning produksi per line pershift") |
| ProductionPlan | lineId | UUID | FK -> Line |
| ProductionPlan | materialId | UUID | FK -> Material (tipe produk, mis. "Lighting Tipe A") |
| ProductionPlan | shiftDate | DATE |  |
| ProductionPlan | shiftNumber | INT |  |
| ProductionPlan | plannedQty | DECIMAL |  |
| ProductionPlan | source | VARCHAR | ERP (selalu, lewat `Get Method` -- lihat ARCHITECTURE.md §3) |
| ProductionPlan | syncedAt | TIMESTAMP |  |
| CustomerOrder | orderId | UUID | PK (FR-13 ERP Integration -- "Order Delivery (Waktu, Tipe, Qty)") |
| CustomerOrder | customerName | VARCHAR |  |
| CustomerOrder | materialId | UUID | FK -> Material |
| CustomerOrder | quantity | DECIMAL |  |
| CustomerOrder | requestedDeliveryAt | TIMESTAMP |  |
| CustomerOrder | status | VARCHAR | RECEIVED/IN_PROGRESS/DELIVERED/CANCELLED (nilai usulan sementara) |
| CustomerOrder | source | VARCHAR | ERP |
| CustomerOrder | createdAt | TIMESTAMP |  |
| ProductionLineRequest | requestId | UUID | PK (FR-14 Production Line Interface) |
| ProductionLineRequest | lineId | UUID | FK -> Line |
| ProductionLineRequest | requestType | VARCHAR | RAW_MATERIAL (request material ke warehouse) / FINISH_GOOD_PICKUP (calling AMR pick finish good setelah produksi selesai) |
| ProductionLineRequest | materialId | UUID | FK -> Material |
| ProductionLineRequest | quantity | DECIMAL |  |
| ProductionLineRequest | requestedBy | UUID | FK -> User, nullable (operator produksi) |
| ProductionLineRequest | status | VARCHAR | nilai belum diputuskan; sementara mengikuti pola `TaskStatus` |
| ProductionLineRequest | taskId | UUID | FK -> Task, nullable (terisi setelah task eksekusi AMR dibuat, pola sama dengan `MaterialRequest.taskId`) |
| ProductionLineRequest | createdAt | TIMESTAMP |  |
| PackagingRequest | packagingRequestId | UUID | PK (FR-15 Packaging Interface -- "Request Box Packging") |
| PackagingRequest | materialId | UUID | FK -> Material, nullable |
| PackagingRequest | boxType | VARCHAR |  |
| PackagingRequest | quantity | DECIMAL |  |
| PackagingRequest | requestedBy | UUID | FK -> User, nullable (operator box/packaging) |
| PackagingRequest | status | VARCHAR | nilai belum diputuskan; sementara mengikuti pola `TaskStatus` |
| PackagingRequest | taskId | UUID | FK -> Task, nullable |
| PackagingRequest | createdAt | TIMESTAMP |  |
| DeliveryRequest | deliveryRequestId | UUID | PK (FR-16 Delivery-to-Customer Interface) |
| DeliveryRequest | orderId | UUID | FK -> CustomerOrder |
| DeliveryRequest | taskId | UUID | FK -> Task, nullable (task AMR/robot untuk proses delivery, kalau delivery internal pakai robot) |
| DeliveryRequest | status | VARCHAR | PENDING/DISPATCHED/DELIVERED/FAILED (nilai usulan sementara) |
| DeliveryRequest | requestedBy | UUID | FK -> User, nullable (operator delivery) |
| DeliveryRequest | dispatchedAt | TIMESTAMP | nullable |
| DeliveryRequest | deliveredAt | TIMESTAMP | nullable |

Catatan relasi: `ProductionLineRequest`, `PackagingRequest`, dan `DeliveryRequest` semuanya bisa menghasilkan `Task` eksekusi (lewat `taskId`, pola yang sama seperti `MaterialRequest` yang sudah ada) -- konsisten dengan prinsip Task API source-agnostic (ADR Section 8.1): keempatnya jadi *task source* baru di samping WMS/WES/MANUAL/API yang sudah ada di `Task.source`. **Perlu keputusan:** apakah `Task.source` perlu nilai enum baru (mis. `PRODUCTION_LINE`, `PACKAGING`, `DELIVERY`) atau cukup `MANUAL`/`API` dengan `externalRef` menunjuk ke entity-entity di atas -- belum diputuskan, ditandai open question di `CHANGELOG.md`.

## Event and Status Data

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Event | eventId | UUID | PK |
| Event | eventType | VARCHAR | jenis event (PRD FR-08), mis. TASK_FAILED, COMMUNICATION_TIMEOUT |
| Event | sourceType | VARCHAR | EQUIPMENT/ROBOT/TASK (huruf besar, sesuai OpenAPI) |
| Event | sourceId | UUID | FK polymorphic |
| Event | severity | VARCHAR | INFO/WARNING/ERROR/CRITICAL |
| Event | message | VARCHAR |  |
| Event | errorCode | VARCHAR | nullable; kode error dari equipment/robot. `DiagnosticLog` (UC-09) adalah tampilan Event dengan sourceType EQUIPMENT/ROBOT, bukan tabel terpisah |
| Event | occurredAt | TIMESTAMP |  |
| Alarm | alarmId | UUID | PK |
| Alarm | eventId | UUID | FK -> Event |
| Alarm | status | VARCHAR | ACTIVE/ACKNOWLEDGED/CLEARED (PRD FR-08: Active -> Acknowledge -> Clear/Reset) |
| Alarm | acknowledgedBy | UUID | FK -> User, nullable |
| Alarm | acknowledgedAt | TIMESTAMP | nullable |
| Alarm | clearedBy | UUID | FK -> User, nullable (kosong jika clear otomatis dari equipment/RCS) |
| Alarm | clearedAt | TIMESTAMP | nullable (UC-06 langkah 7 mencatat waktu clear) |
| EquipmentStatus | statusId | UUID | PK |
| EquipmentStatus | equipmentId | UUID | FK -> Equipment |
| EquipmentStatus | status | VARCHAR |  |
| EquipmentStatus | x, y | DECIMAL | posisi pada warehouse map, nullable (PRD FR-09) |
| EquipmentStatus | recordedAt | TIMESTAMP |  |
| RobotStatus | statusId | UUID | PK |
| RobotStatus | robotId | UUID | FK -> Robot |
| RobotStatus | status | VARCHAR |  |
| RobotStatus | battery | DECIMAL |  |
| RobotStatus | x, y | DECIMAL | posisi |
| RobotStatus | currentTaskId | UUID | FK -> Task, nullable (mission aktif) |
| RobotStatus | recordedAt | TIMESTAMP |  |
| IntegrationLog | logId | UUID | PK |
| IntegrationLog | integrationId | UUID | FK -> Integration (menggantikan `systemName`; nama sistem ada di Integration) |
| IntegrationLog | direction | VARCHAR | INBOUND/OUTBOUND |
| IntegrationLog | status | VARCHAR | SUCCESS/FAILED |
| IntegrationLog | errorMessage | VARCHAR | nullable |
| IntegrationLog | payload | JSONB | `payloadSummary` di API adalah ringkasan dari kolom ini |
| OutboxEvent | eventId | UUID | PK (outbox pengiriman event ke sistem eksternal, ADR Section 7; API_CONVENTIONS.md bagian 8) |
| OutboxEvent | integrationId | UUID | FK -> Integration (tujuan) |
| OutboxEvent | eventType | VARCHAR | TASK_STATUS_CHANGED/DISCREPANCY_DETECTED/ALARM_RAISED/ALARM_CLEARED |
| OutboxEvent | aggregateType | VARCHAR | TASK/DISCREPANCY/ALARM |
| OutboxEvent | aggregateId | UUID |  |
| OutboxEvent | sequence | BIGINT | naik monoton per aggregateId |
| OutboxEvent | payload | JSONB |  |
| OutboxEvent | status | VARCHAR | PENDING/SENT/FAILED |
| OutboxEvent | attempts | INT | default 0 |
| OutboxEvent | nextAttemptAt | TIMESTAMP | nullable |
| OutboxEvent | createdAt | TIMESTAMP |  |
| OutboxEvent | sentAt | TIMESTAMP | nullable |
| IntegrationLog | occurredAt | TIMESTAMP |  |

## Security Data

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| User | userId | UUID | PK |
| User | username | VARCHAR |  |
| User | fullName | VARCHAR |  |
| User | passwordHash | VARCHAR |  |
| User | roleId | UUID | FK -> Role |
| User | active | BOOLEAN | DELETE /users/{id} menonaktifkan (active=false), bukan menghapus baris |
| User | createdAt | TIMESTAMP |  |
| Role | roleId | UUID | PK |
| Role | name | VARCHAR | 5 nilai tetap sesuai enum `Role` di OpenAPI: WAREHOUSE_OPERATOR, WAREHOUSE_SUPERVISOR, WCS_ADMINISTRATOR, MAINTENANCE_ENGINEER, SYSTEM_INTEGRATOR |
| Role | permissions | JSONB |  |
| AuditLog | auditId | UUID | PK |
| AuditLog | userId | UUID | FK -> User, nullable (kosong jika login gagal oleh username tak dikenal) |
| AuditLog | username | VARCHAR | nullable; salinan username saat aksi terjadi |
| AuditLog | action | VARCHAR | mis. ROLE_CHANGED |
| AuditLog | targetType | VARCHAR | nullable, mis. USER |
| AuditLog | targetId | UUID | nullable |
| AuditLog | beforeValue | JSONB | nullable (menggantikan `details`) |
| AuditLog | afterValue | JSONB | nullable |
| AuditLog | result | VARCHAR | SUCCESS/FAILED |
| AuditLog | ipAddress | VARCHAR | nullable |
| AuditLog | occurredAt | TIMESTAMP |  |
| Integration | integrationId | UUID | PK (konfigurasi koneksi WMS/RCS/PLC; di luar daftar PRD 9.4, ditambahkan untuk UC-10) |
| Integration | systemType | VARCHAR | WMS/RCS/PLC |
| Integration | name | VARCHAR |  |
| Integration | protocol | VARCHAR | REST/MQTT/OPC_UA/MODBUS_TCP/VDA5050 |
| Integration | endpointUrl | VARCHAR |  |
| Integration | credentials | JSONB | terenkripsi, write-only, tidak pernah dikembalikan di response GET |
| Integration | apiKeyHash | VARCHAR | nullable; hash API key masuk dari sistem eksternal (key asli tidak disimpan). Lihat API_CONVENTIONS.md bagian 2 |
| Integration | apiKeyRotatedAt | TIMESTAMP | nullable |
| Integration | status | VARCHAR | CONNECTED/DISCONNECTED/DEGRADED |
| Integration | lastTestedAt | TIMESTAMP | nullable |
| Integration | createdAt | TIMESTAMP |  |

## Catatan desain

- **assignedResource bersifat polymorphic.** Task dan Assignment bisa merujuk ke Equipment atau Robot lewat pasangan `resourceType` + `resourceId`, bukan dua kolom foreign key terpisah -- supaya menambah jenis resource baru (mis. AS/RS di Phase 5) tidak perlu ubah skema Task.
- **Robot adalah spesialisasi Equipment.** Setiap Robot punya base record di Equipment (field lokasi, status umum) plus detail spesifik robot (vendor, protocol) di tabel Robot sendiri -- pola table-per-type.
- **Field dari Minimum Task Object (PRD 9.5)** sudah dipetakan utuh ke tabel Task (`source`/`destination` PRD = lokasi asal/tujuan -> `sourceLocationId`/`destinationLocationId`; kolom `source` di ERD adalah asal task WMS/WES/MANUAL/API, tambahan dari FR-02): taskId, taskType, source/destination, materialId, containerId, quantity, priority, status, assignedResource, createdAt, startedAt, completedAt, failureCode.
- **JSONB dipakai untuk field semi-terstruktur** (TaskDetail.metadata, IntegrationLog.payload, Role.permissions, AuditLog.beforeValue/afterValue, Integration.credentials) supaya skema tidak perlu migrasi tiap kali ada field baru dari vendor/integrasi berbeda.
- Semua primary key pakai **UUID**, bukan auto-increment integer -- memudahkan sinkronisasi data antar instance kalau nanti multi-site atau ada kebutuhan merge data dari warehouse berbeda.
- **Route berbasis Location, peta berbasis Node/Edge.** Task menunjuk ke Location/Station (PRD 9.5), jadi Route menghubungkan Location ke Location (sesuai OpenAPI). Jalur fisik detail AMR tetap dihitung RCS (PRD FR-04). Node dan Edge adalah graf peta untuk warehouse map dan tracking (PRD FR-09); `Location.nodeId` menghubungkan keduanya. Endpoint Node/Edge dan `GET /warehouse-map` ada sejak OpenAPI v0.4.0.
- **ERD disinkronkan dengan OpenAPI v0.4.0.** Semua schema OpenAPI punya padanan di ERD: `DiagnosticLog` = tampilan atas Event; `Role` = 5 nilai tetap di tabel Role; `OutboundEvent` = baris `OutboxEvent`; `WarehouseMap` = gabungan Node, Edge, Location, dan status terakhir. Nilai kode/enum ada di `DATA_DICTIONARY.md`.
- **Operational inventory view = `InventoryItem`.** PRD FR-01 memintanya (inventory dari WMS, posisi material/container/pallet) tetapi PRD Section 9 tidak mendefinisikan entity-nya, jadi bentuk ini adalah usulan engineering. WMS tetap source of truth; baris ini hanya salinan kerja yang diperbarui dari sinkronisasi WMS dan hasil eksekusi task (Functional Boundary, Kepemilikan master data).
- **Entity di luar daftar PRD Section 9 (usulan):** `InventoryItem`, `MaterialRequest`, `Discrepancy`, `Integration`, `OutboxEvent`, `TaskStatusHistory`. Masing-masing ditambahkan untuk memenuhi FR/UC tertentu (lihat CHANGELOG.md).
- **[Revisi 2026-10-05, Usulan] Entity scope end-to-end:** `Line`, `ProductionPlan`, `CustomerOrder`, `ProductionLineRequest`, `PackagingRequest`, `DeliveryRequest` (lihat bagian "ERP & Production Integration Data" di atas). Berbeda dari entity usulan sebelumnya yang mengisi gap di dalam PRD v0.1 yang sudah ada, enam entity ini mewakili **scope yang sama sekali belum ada** di PRD v0.1 -- statusnya lebih awal (belum dikonfirmasi FR-nya sama sekali, bukan cuma bentuk tabelnya), jadi jangan dipakai sebagai acuan implementasi sebelum `ADR.md` Section 1.1 dikonfirmasi Astra/Winteq.
- **Tracking node terakhir robot belum dimodelkan.** `RobotStatus.lastNodeId` (opsional) ditunda sampai protokol adapter Pudu jelas (T300 proprietary vs T600 VDA5050, lihat ADR Section 5).
