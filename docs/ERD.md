# ERD -- Data Model Smart WCS Platform (v3)

> **[Revisi 2026-10-19, v3]** Model ditulis ulang setelah integrasi PUDU Open Platform dipetakan field per field dan diaudit terhadap best practice desain database. Sumber kebenaran implementasi adalah `prisma/schema.prisma` -- dokumen ini dan schema dibangkitkan dari model yang sama dan harus selalu sinkron. Ringkasan perubahan ada di `CHANGELOG.md` entri 2026-10-19.

Total **44 tabel**: 10 Master Data, 9 Transaction Data, 6 ERP & Production Integration Data, 6 Event, Status & Integration Data, 4 Security & Configuration Data, 9 PUDU Adapter Data.

## Konvensi

- Primary key memakai pola `<entitas>Id` (UUID), kecuali tabel log bervolume tinggi yang memakai `BIGINT` autoincrement.
- **Semua kolom waktu bertipe `TIMESTAMPTZ` dan disimpan dalam UTC.** Timestamp epoch dari PUDU dikonversi saat diterima; konversi ke WIB hanya di tampilan.
- Status mentah dari vendor disimpan sebagai teks bebas (tidak di-enum di database) supaya tidak gagal saat vendor menambah nilai baru. Status versi WCS divalidasi di aplikasi (Zod).
- JSONB hanya untuk field semi-terstruktur yang jarang di-query. Field yang dipakai filter, join, atau KPI selalu jadi kolom.
- Penanda di kolom Key: `[v3 baru]` = kolom baru di v3, `[v3 ubah]` = arti/constraint kolom berubah di v3.

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
| Location | nodeId | UUID | FK -> Node; nullable (titik peta tempat lokasi berada) |
| Location | code | VARCHAR |  |
| Location | locationType | VARCHAR |  |
| Node | nodeId | UUID | PK |
| Node | zoneId | UUID | FK -> Zone |
| Node | x | DECIMAL(14,4) | koordinat |
| Node | y | DECIMAL(14,4) | koordinat |
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
| Robot | equipmentId | UUID | FK -> Equipment; (1:1, base record) |
| Robot | vendor | VARCHAR | mis. Pudu |
| Robot | model | VARCHAR |  |
| Robot | protocol | VARCHAR | mis. VDA5050 |
| Station | stationId | UUID | PK |
| Station | zoneId | UUID | FK -> Zone |
| Station | locationId | UUID | FK -> Location; (agar station bisa jadi titik asal/tujuan task, PRD 9.5 "location/station") |
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

Status task mengikuti enum `TaskStatus` di `openapi-smart-wcs.yaml` (CREATED, VALIDATED, QUEUED, ASSIGNED, DISPATCHED, RUNNING, COMPLETED, FAILED, RETRY, CANCELLED).

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Task | taskId | UUID | PK |
| Task | taskType | VARCHAR | MOVE/PICKUP/DROP/etc |
| Task | source | VARCHAR | WMS/WES/MANUAL/API -- asal task (PRD FR-02 dan Section 11 CREATED). Bukan source pada PRD 9.5, yang berarti lokasi asal (lihat sourceLocationId) |
| Task | sourceLocationId | UUID | FK -> Location |
| Task | destinationLocationId | UUID | FK -> Location |
| Task | materialId | UUID | FK -> Material; nullable |
| Task | containerId | VARCHAR | nullable |
| Task | quantity | DECIMAL(14,4) | nullable |
| Task | priority | INT |  |
| Task | status | VARCHAR | state machine (Section 11 PRD) |
| Task | resourceType | VARCHAR | EQUIPMENT / ROBOT, nullable |
| Task | assignedResourceId | UUID | FK polymorphic -> Equipment/Robot, nullable |
| Task | createdAt | TIMESTAMPTZ |  |
| Task | startedAt | TIMESTAMPTZ | nullable |
| Task | completedAt | TIMESTAMPTZ | nullable |
| Task | failureCode | VARCHAR | nullable; NO_RESOURCE_AVAILABLE/DISPATCH_TIMEOUT/ACK_TIMEOUT/TASK_TIMEOUT/COMM_LOST/RESOURCE_ERROR (lihat TASK_STATE_MACHINE.md) |
| Task | externalRef | VARCHAR | ID task di sistem pengirim; wajib untuk WMS/WES/API. UNIQUE bersama source untuk idempotensi POST /tasks (lihat TASK_STATE_MACHINE.md) |
| Task | retryCount | INT | default 0; bertambah setiap RETRY |
| TaskStatusHistory | historyId | UUID | PK |
| TaskStatusHistory | taskId | UUID | FK -> Task |
| TaskStatusHistory | fromStatus | VARCHAR | nullable (kosong saat task pertama dibuat) |
| TaskStatusHistory | toStatus | VARCHAR | TaskStatus (PRD Section 11) |
| TaskStatusHistory | reason | VARCHAR | nullable; alasan FAILED/CANCELLED/RETRY (PRD FR-02) |
| TaskStatusHistory | changedBy | UUID | FK -> User; nullable (kosong jika diubah sistem/RCS/PLC) |
| TaskStatusHistory | integrationLogId | UUID | FK -> IntegrationLog; nullable; callback yang memicu perubahan status; **[v3 baru]** |
| TaskStatusHistory | changedAt | TIMESTAMPTZ |  |
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
| Mission | createdAt | TIMESTAMPTZ |  |
| Mission | updatedAt | TIMESTAMPTZ |  |
| Assignment | assignmentId | UUID | PK |
| Assignment | taskId | UUID | FK -> Task |
| Assignment | resourceType | VARCHAR | EQUIPMENT / ROBOT |
| Assignment | resourceId | UUID | FK polymorphic |
| Assignment | assignedAt | TIMESTAMPTZ |  |
| MaterialMovement | movementId | UUID | PK |
| MaterialMovement | taskId | UUID | FK -> Task |
| MaterialMovement | materialId | UUID | FK -> Material |
| MaterialMovement | fromLocationId | UUID | FK -> Location |
| MaterialMovement | toLocationId | UUID | FK -> Location |
| MaterialMovement | containerId | VARCHAR | nullable |
| MaterialMovement | quantity | DECIMAL(14,4) | jumlah yang benar-benar dipindahkan (hasil eksekusi) |
| MaterialMovement | resourceType | VARCHAR | EQUIPMENT / ROBOT, nullable (PRD Traceability: equipment yang memproses) |
| MaterialMovement | resourceId | UUID | FK polymorphic, nullable |
| MaterialMovement | movedAt | TIMESTAMPTZ |  |
| InventoryItem | inventoryId | UUID | PK; operational inventory view, PRD FR-01 |
| InventoryItem | materialId | UUID | FK -> Material |
| InventoryItem | locationId | UUID | FK -> Location |
| InventoryItem | containerId | VARCHAR | nullable (pallet/cart/container) |
| InventoryItem | quantity | DECIMAL(14,4) |  |
| InventoryItem | source | VARCHAR | WMS_SYNC/EXECUTION -- asal pembaruan terakhir |
| InventoryItem | updatedAt | TIMESTAMPTZ |  |
| InventoryItem | lastSyncedAt | TIMESTAMPTZ | nullable; kapan terakhir disinkronkan dari WMS |
| MaterialRequest | requestId | UUID | PK; PRD FR-12, UC-08 |
| MaterialRequest | materialId | UUID | FK -> Material |
| MaterialRequest | quantity | DECIMAL(14,4) |  |
| MaterialRequest | destinationLocationId | UUID | FK -> Location |
| MaterialRequest | status | VARCHAR | nilai belum diputuskan (UC-08 vs TaskStatus di OpenAPI, lihat CHANGELOG "Masih terbuka"); sementara mengikuti OpenAPI |
| MaterialRequest | taskId | UUID | FK -> Task; nullable (terisi setelah task eksekusi dibuat) |
| MaterialRequest | createdAt | TIMESTAMPTZ |  |
| Discrepancy | discrepancyId | UUID | PK; PRD FR-01, UC-11 |
| Discrepancy | taskId | UUID | FK -> Task |
| Discrepancy | materialId | UUID | FK -> Material; nullable |
| Discrepancy | expectedQuantity | DECIMAL(14,4) |  |
| Discrepancy | actualQuantity | DECIMAL(14,4) |  |
| Discrepancy | expectedLocationId | UUID | FK -> Location; nullable |
| Discrepancy | actualLocationId | UUID | FK -> Location; nullable |
| Discrepancy | status | VARCHAR | OPEN/NOTIFIED/RESOLVED |
| Discrepancy | detectedAt | TIMESTAMPTZ |  |
| Discrepancy | notifiedAt | TIMESTAMPTZ | nullable |
| Discrepancy | resolvedAt | TIMESTAMPTZ | nullable |

## ERP & Production Integration Data [Usulan FR-13 s/d FR-16]

Entity scope end-to-end (ADR Section 1.1). **Belum ada di PRD Section 9** -- usulan engineering, menunggu konfirmasi dan formalisasi FR-13 s/d FR-16 oleh Astra/Winteq. Jangan dianggap final.

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Line | lineId | UUID | PK; production line, mis. "Line 1" |
| Line | zoneId | UUID | FK -> Zone |
| Line | name | VARCHAR |  |
| Line | shiftCapacityUnit | DECIMAL(14,4) | kapasitas produksi per shift, mis. 330 unit/shift/line (dari ADM di diagram referensi) |
| ProductionPlan | planId | UUID | PK; FR-13 ERP Integration -- "Planning produksi per line pershift" |
| ProductionPlan | lineId | UUID | FK -> Line |
| ProductionPlan | materialId | UUID | FK -> Material; (tipe produk, mis. "Lighting Tipe A") |
| ProductionPlan | shiftDate | DATE |  |
| ProductionPlan | shiftNumber | INT |  |
| ProductionPlan | plannedQty | DECIMAL(14,4) |  |
| ProductionPlan | source | VARCHAR | ERP (selalu, lewat Get Method -- lihat ARCHITECTURE.md §3) |
| ProductionPlan | syncedAt | TIMESTAMPTZ |  |
| CustomerOrder | orderId | UUID | PK; FR-13 ERP Integration -- "Order Delivery (Waktu, Tipe, Qty)" |
| CustomerOrder | customerName | VARCHAR |  |
| CustomerOrder | materialId | UUID | FK -> Material |
| CustomerOrder | quantity | DECIMAL(14,4) |  |
| CustomerOrder | requestedDeliveryAt | TIMESTAMPTZ |  |
| CustomerOrder | status | VARCHAR | RECEIVED/IN_PROGRESS/DELIVERED/CANCELLED (nilai usulan sementara) |
| CustomerOrder | source | VARCHAR | ERP |
| CustomerOrder | createdAt | TIMESTAMPTZ |  |
| ProductionLineRequest | requestId | UUID | PK; FR-14 Production Line Interface |
| ProductionLineRequest | lineId | UUID | FK -> Line |
| ProductionLineRequest | requestType | VARCHAR | RAW_MATERIAL (request material ke warehouse) / FINISH_GOOD_PICKUP (calling AMR pick finish good setelah produksi selesai) |
| ProductionLineRequest | materialId | UUID | FK -> Material |
| ProductionLineRequest | quantity | DECIMAL(14,4) |  |
| ProductionLineRequest | requestedBy | UUID | FK -> User; nullable (operator produksi) |
| ProductionLineRequest | status | VARCHAR | nilai belum diputuskan; sementara mengikuti pola TaskStatus |
| ProductionLineRequest | taskId | UUID | FK -> Task; nullable (terisi setelah task eksekusi AMR dibuat, pola sama dengan MaterialRequest.taskId) |
| ProductionLineRequest | createdAt | TIMESTAMPTZ |  |
| PackagingRequest | packagingRequestId | UUID | PK; FR-15 Packaging Interface -- "Request Box Packging" |
| PackagingRequest | materialId | UUID | FK -> Material; nullable |
| PackagingRequest | boxType | VARCHAR |  |
| PackagingRequest | quantity | DECIMAL(14,4) |  |
| PackagingRequest | requestedBy | UUID | FK -> User; nullable (operator box/packaging) |
| PackagingRequest | status | VARCHAR | nilai belum diputuskan; sementara mengikuti pola TaskStatus |
| PackagingRequest | taskId | UUID | FK -> Task; nullable |
| PackagingRequest | createdAt | TIMESTAMPTZ |  |
| DeliveryRequest | deliveryRequestId | UUID | PK; FR-16 Delivery-to-Customer Interface |
| DeliveryRequest | orderId | UUID | FK -> CustomerOrder |
| DeliveryRequest | taskId | UUID | FK -> Task; nullable (task AMR/robot untuk proses delivery, kalau delivery internal pakai robot) |
| DeliveryRequest | status | VARCHAR | PENDING/DISPATCHED/DELIVERED/FAILED (nilai usulan sementara) |
| DeliveryRequest | requestedBy | UUID | FK -> User; nullable (operator delivery) |
| DeliveryRequest | dispatchedAt | TIMESTAMPTZ | nullable |
| DeliveryRequest | deliveredAt | TIMESTAMPTZ | nullable |

## Event, Status & Integration Data

`IntegrationLog` dipakai untuk semua komunikasi dengan sistem eksternal, dua arah. Untuk PUDU, tabel ini juga berfungsi sebagai **antrean callback** (inbox): callback masuk sebagai `PENDING`, lalu diurai worker.

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| Event | eventId | UUID | PK |
| Event | eventType | VARCHAR | jenis event (PRD FR-08), mis. TASK_FAILED, COMMUNICATION_TIMEOUT |
| Event | sourceType | VARCHAR | EQUIPMENT/ROBOT/TASK (huruf besar, sesuai OpenAPI) |
| Event | sourceId | UUID | FK polymorphic |
| Event | severity | VARCHAR | INFO/WARNING/ERROR/CRITICAL |
| Event | message | VARCHAR |  |
| Event | errorCode | VARCHAR | nullable; kode error dari equipment/robot. DiagnosticLog (UC-09) adalah tampilan Event dengan sourceType EQUIPMENT/ROBOT, bukan tabel terpisah |
| Event | externalErrorId | VARCHAR | nullable; ID error dari vendor, dipakai dedup kanal realtime vs tertunda; Sumber: robotErrorWarning.error_id; **[v3 baru]** |
| Event | externalLevel | VARCHAR | nullable; level asli dari vendor sebelum dipetakan ke severity; Sumber: error_level; **[v3 baru]** |
| Event | integrationLogId | UUID | FK -> IntegrationLog; nullable; callback asal event; **[v3 baru]** |
| Event | payload | JSONB | nullable; detail tambahan vendor (extend_info: battery, map_point, task_id, position); Sumber: robotErrorNotice.extend_info; **[v3 baru]** |
| Event | taskId | UUID | FK -> Task; nullable; task yang sedang berjalan saat error (dari extend_info.task_id); Sumber: robotErrorNotice.extend_info.task_id; **[v3 baru]** |
| Event | occurredAt | TIMESTAMPTZ |  |
| Alarm | alarmId | UUID | PK |
| Alarm | eventId | UUID | FK -> Event |
| Alarm | status | VARCHAR | ACTIVE/ACKNOWLEDGED/CLEARED (PRD FR-08: Active -> Acknowledge -> Clear/Reset) |
| Alarm | acknowledgedBy | UUID | FK -> User; nullable |
| Alarm | acknowledgedAt | TIMESTAMPTZ | nullable |
| Alarm | clearedBy | UUID | FK -> User; nullable (kosong jika clear otomatis dari equipment/RCS) |
| Alarm | clearedAt | TIMESTAMPTZ | nullable (UC-06 langkah 7 mencatat waktu clear) |
| EquipmentStatus | statusId | UUID | PK |
| EquipmentStatus | equipmentId | UUID | FK -> Equipment |
| EquipmentStatus | status | VARCHAR |  |
| EquipmentStatus | x | DECIMAL(14,4) | posisi pada warehouse map, nullable (PRD FR-09) |
| EquipmentStatus | y | DECIMAL(14,4) | posisi pada warehouse map, nullable (PRD FR-09) |
| EquipmentStatus | recordedAt | TIMESTAMPTZ |  |
| RobotStatus | statusId | UUID | PK |
| RobotStatus | robotId | UUID | FK -> Robot |
| RobotStatus | status | VARCHAR |  |
| RobotStatus | battery | DECIMAL(14,4) |  |
| RobotStatus | x | DECIMAL(14,4) | posisi |
| RobotStatus | y | DECIMAL(14,4) | posisi |
| RobotStatus | currentTaskId | UUID | FK -> Task; nullable (mission aktif) |
| RobotStatus | recordedAt | TIMESTAMPTZ | Ditulis adapter hanya saat status/state robot berubah, bukan setiap update posisi. Riwayat posisi frekuensi tinggi ada di PuduPoseLog; **[v3 ubah]** |
| IntegrationLog | logId | UUID | PK |
| IntegrationLog | integrationId | UUID | FK -> Integration; (menggantikan systemName; nama sistem ada di Integration) |
| IntegrationLog | direction | VARCHAR | INBOUND/OUTBOUND |
| IntegrationLog | status | VARCHAR | PENDING / SUCCESS / FAILED / IGNORED. INBOUND masuk sebagai PENDING lalu diurai worker; OUTBOUND langsung SUCCESS/FAILED; **[v3 ubah]** |
| IntegrationLog | errorMessage | VARCHAR | nullable |
| IntegrationLog | payload | JSONB | payloadSummary di API adalah ringkasan dari kolom ini |
| IntegrationLog | traceId | VARCHAR | nullable; UNIQUE bersama integrationId + direction. Header TraceId callback atau trace_id response command; Sumber: Header TraceId, response trace_id; **[v3 baru]** |
| IntegrationLog | messageType | VARCHAR | callback_type untuk INBOUND (mis. notifyRobotPose), nama API untuk OUTBOUND (mis. DeliveryTask); Sumber: callback_type / nama API; **[v3 baru]** |
| IntegrationLog | robotId | UUID | FK -> Robot; nullable; robot yang terkait (dari sn); Sumber: data.sn; **[v3 baru]** |
| IntegrationLog | callbackCodeValid | BOOLEAN | nullable; hasil verifikasi header CallbackCode untuk INBOUND; Sumber: Header CallbackCode; **[v3 baru]** |
| IntegrationLog | httpStatus | INT | nullable; untuk OUTBOUND; **[v3 baru]** |
| IntegrationLog | responseCode | VARCHAR | nullable; kode dari vendor, mis. 70001-70005 SwitchMap; Sumber: data.code; **[v3 baru]** |
| IntegrationLog | attempts | INT | default 0; bertambah setiap worker mencoba mengurai ulang; **[v3 baru]** |
| IntegrationLog | nextAttemptAt | TIMESTAMPTZ | nullable; jadwal retry berikutnya untuk status FAILED; **[v3 baru]** |
| IntegrationLog | processedAt | TIMESTAMPTZ | nullable; kapan payload INBOUND selesai diurai worker; **[v3 baru]** |
| IntegrationLog | occurredAt | TIMESTAMPTZ |  |
| OutboxEvent | eventId | UUID | PK; outbox pengiriman event ke sistem eksternal, ADR Section 7; API_CONVENTIONS.md bagian 8 |
| OutboxEvent | integrationId | UUID | FK -> Integration; (tujuan) |
| OutboxEvent | eventType | VARCHAR | TASK_STATUS_CHANGED/DISCREPANCY_DETECTED/ALARM_RAISED/ALARM_CLEARED |
| OutboxEvent | aggregateType | VARCHAR | TASK/DISCREPANCY/ALARM |
| OutboxEvent | aggregateId | UUID |  |
| OutboxEvent | sequence | BIGINT | naik monoton per aggregateId |
| OutboxEvent | payload | JSONB |  |
| OutboxEvent | status | VARCHAR | PENDING/SENT/FAILED |
| OutboxEvent | attempts | INT | default 0 |
| OutboxEvent | nextAttemptAt | TIMESTAMPTZ | nullable |
| OutboxEvent | createdAt | TIMESTAMPTZ |  |
| OutboxEvent | sentAt | TIMESTAMPTZ | nullable |

## Security & Configuration Data

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| User | userId | UUID | PK |
| User | username | VARCHAR | UNIQUE; UNIQUE; **[v3 ubah]** |
| User | fullName | VARCHAR |  |
| User | passwordHash | VARCHAR |  |
| User | roleId | UUID | FK -> Role |
| User | active | BOOLEAN | DELETE /users/{id} menonaktifkan (active=false), bukan menghapus baris |
| User | createdAt | TIMESTAMPTZ |  |
| Role | roleId | UUID | PK |
| Role | name | VARCHAR | UNIQUE; 5 nilai tetap sesuai enum Role di OpenAPI: WAREHOUSE_OPERATOR, WAREHOUSE_SUPERVISOR, WCS_ADMINISTRATOR, MAINTENANCE_ENGINEER, SYSTEM_INTEGRATOR; **[v3 ubah]** |
| Role | permissions | JSONB |  |
| AuditLog | auditId | UUID | PK |
| AuditLog | userId | UUID | FK -> User; nullable (kosong jika login gagal oleh username tak dikenal) |
| AuditLog | username | VARCHAR | nullable; salinan username saat aksi terjadi |
| AuditLog | action | VARCHAR | mis. ROLE_CHANGED |
| AuditLog | targetType | VARCHAR | nullable, mis. USER |
| AuditLog | targetId | UUID | nullable |
| AuditLog | beforeValue | JSONB | nullable (menggantikan details) |
| AuditLog | afterValue | JSONB | nullable |
| AuditLog | result | VARCHAR | SUCCESS/FAILED |
| AuditLog | ipAddress | VARCHAR | nullable |
| AuditLog | occurredAt | TIMESTAMPTZ |  |
| Integration | integrationId | UUID | PK; konfigurasi koneksi WMS/RCS/PLC; di luar daftar PRD 9.4, ditambahkan untuk UC-10 |
| Integration | systemType | VARCHAR | WMS/RCS/PLC |
| Integration | name | VARCHAR |  |
| Integration | protocol | VARCHAR | REST/MQTT/OPC_UA/MODBUS_TCP/VDA5050 |
| Integration | endpointUrl | VARCHAR |  |
| Integration | credentials | JSONB | terenkripsi, write-only, tidak pernah dikembalikan di response GET. Untuk PUDU berisi region, baseUrl, ApiAppKey, ApiAppSecret, hash CallbackCode; Sumber: Portal distributor PUDU |
| Integration | apiKeyHash | VARCHAR | nullable; hash API key masuk dari sistem eksternal (key asli tidak disimpan). Lihat API_CONVENTIONS.md bagian 2 |
| Integration | apiKeyRotatedAt | TIMESTAMPTZ | nullable |
| Integration | status | VARCHAR | CONNECTED/DISCONNECTED/DEGRADED |
| Integration | lastTestedAt | TIMESTAMPTZ | nullable |
| Integration | createdAt | TIMESTAMPTZ |  |

## PUDU Adapter Data (robot T600)

Detail khas vendor PUDU yang tidak boleh masuk tabel inti. Data PUDU yang sudah punya tempat di tabel inti (command/callback mentah, error, riwayat status task, kredensial) **tidak** diduplikasi di sini -- lihat bagian "Di mana data PUDU disimpan". Pemetaan lengkap field API PUDU ke kolom ada di `docs/PUDU_INTEGRATION.md`.

**PuduRobot** -- Profil vendor robot, 1:1 dengan Robot inti. Kunci integrasi = sn.

**PuduRobotState** -- Snapshot terakhir per robot (1 baris per robot, di-upsert). Untuk dashboard live.

**PuduRobotStatusLog** -- Riwayat perubahan state robot. Sumber KPI utilisasi, idle, charging, online time.

**PuduPoseLog** -- Riwayat posisi frekuensi tinggi. Dipartisi per bulan (PK menyertakan recordedAt), retensi 30-90 hari.

**PuduMap** -- Peta hasil mapping di PUDU App. WCS hanya menyalin. Dihubungkan ke gudang & zona WCS.

**PuduRobotMap** -- Peta yang terpasang di tiap robot. Dipakai untuk validasi SwitchMap sebelum dikirim.

**PuduMapElement** -- Titik & elemen peta (point, track, circle). Titik = tujuan task, dipetakan ke Node WCS. Soft delete saat sync ulang.

**PuduTask** -- Task di PUDU (CALL / DELIVERY / RECHARGE / SWITCH_MAP). 1:1 dengan Mission bila dibuat WCS.

**PuduTaskStop** -- Tray & destinasi delivery task. Satu baris per destinasi per tray.

| Entity | Field | Tipe | Key |
| --- | --- | --- | --- |
| PuduRobot | puduRobotId | UUID | PK |
| PuduRobot | robotId | UUID | FK -> Robot; 1:1 (UNIQUE) |
| PuduRobot | sn | VARCHAR | UNIQUE; serial number, dipakai hampir semua API; Sumber: Input admin / robotBinding.sn |
| PuduRobot | mac | VARCHAR | nullable; Sumber: robotEmergencyRecover.mac, notifySwitchMap.mac |
| PuduRobot | name | VARCHAR | nullable; nama robot di PUDU; Sumber: robotBinding.name |
| PuduRobot | model | VARCHAR | T600; Sumber: Input admin |
| PuduRobot | shopId | VARCHAR | nullable saat unbound; Sumber: robotBinding.shop_id |
| PuduRobot | groupId | VARCHAR | nullable; diinput admin (tidak ada API list group); Sumber: Input admin |
| PuduRobot | bindingStatus | VARCHAR | BOUND / UNBOUND; Sumber: robotBinding / robotUnBinding |
| PuduRobot | boundAt | TIMESTAMPTZ | nullable; Sumber: robotBinding.timestamp |
| PuduRobot | unboundAt | TIMESTAMPTZ | nullable; Sumber: robotUnBinding.timestamp |
| PuduRobot | activatedAt | TIMESTAMPTZ | nullable; Sumber: robotActivate.timestamp |
| PuduRobot | createdAt | TIMESTAMPTZ |  |
| PuduRobot | updatedAt | TIMESTAMPTZ |  |
| PuduRobotState | puduRobotId | UUID | PK; FK -> PuduRobot |
| PuduRobotState | online | BOOLEAN | nullable; Sumber: robotStatus.run_status |
| PuduRobotState | runState | VARCHAR | nullable; OFFLINE / DISABLE / BUSY / IDLE; Sumber: notifyRobotStatus, GetRobotStatusV2 |
| PuduRobotState | moveState | VARCHAR | nullable; IDLE / MOVING / STUCK / APPROACHING / ARRIVE / PAUSE / AVOID; Sumber: notifyRobotMoveState |
| PuduRobotState | chargeStage | VARCHAR | nullable; Sumber: notifyRobotPower, notifyRobotStatus |
| PuduRobotState | chargeType | VARCHAR | nullable; Sumber: GetRobotStatusV2.charge_type |
| PuduRobotState | battery | INT | nullable; 0-100; Sumber: notifyRobotPower.power, GetRobotStatusV2.battery |
| PuduRobotState | currentPuduMapId | UUID | FK -> PuduMap; nullable; peta aktif; Sumber: AvailableMaps.is_used, GetRealtimeMapPosition.name |
| PuduRobotState | x | DECIMAL(14,4) | nullable; Sumber: notifyRobotPose.x |
| PuduRobotState | y | DECIMAL(14,4) | nullable; Sumber: notifyRobotPose.y |
| PuduRobotState | yaw | DECIMAL(14,4) | nullable; arah hadap robot; Sumber: notifyRobotPose.yaw |
| PuduRobotState | nearestPoint | VARCHAR | nullable; Sumber: notifyRobotPose.nearest_point |
| PuduRobotState | currentPuduTaskId | UUID | FK -> PuduTask; nullable |
| PuduRobotState | poseReportInterval | INT | nullable; detik; Sumber: NotifyRobotReportPosition.payload.interval |
| PuduRobotState | poseReportTimes | INT | nullable; maks 1000; Sumber: NotifyRobotReportPosition.payload.times |
| PuduRobotState | poseReportStartedAt | TIMESTAMPTZ | nullable; WCS kirim ulang sebelum interval x times habis |
| PuduRobotState | emergencyRecoveredAt | TIMESTAMPTZ | nullable; Sumber: robotEmergencyRecover.timestamp |
| PuduRobotState | lastPoseAt | TIMESTAMPTZ | nullable; notify_timestamp pose terakhir, untuk deteksi robot berhenti lapor; Sumber: notifyRobotPose.notify_timestamp |
| PuduRobotState | updatedAt | TIMESTAMPTZ |  |
| PuduRobotStatusLog | statusLogId | BIGINT | PK; autoincrement |
| PuduRobotStatusLog | puduRobotId | UUID | FK -> PuduRobot |
| PuduRobotStatusLog | integrationLogId | UUID | FK -> IntegrationLog; nullable (polling, atau log sudah dihapus retensi) |
| PuduRobotStatusLog | source | VARCHAR | robotStatus / notifyRobotStatus / notifyRobotPower / notifyRobotMoveState / POLL |
| PuduRobotStatusLog | online | BOOLEAN | nullable |
| PuduRobotStatusLog | runState | VARCHAR | nullable |
| PuduRobotStatusLog | moveState | VARCHAR | nullable |
| PuduRobotStatusLog | chargeStage | VARCHAR | nullable |
| PuduRobotStatusLog | battery | INT | nullable |
| PuduRobotStatusLog | recordedAt | TIMESTAMPTZ | waktu dari PUDU (notify_timestamp) atau waktu polling; Sumber: notify_timestamp |
| PuduPoseLog | poseLogId | BIGINT | PK (gabungan); autoincrement; PK gabungan (poseLogId, recordedAt) karena tabel dipartisi |
| PuduPoseLog | puduRobotId | UUID | FK -> PuduRobot |
| PuduPoseLog | puduMapId | UUID | FK -> PuduMap; nullable |
| PuduPoseLog | x | DECIMAL(14,4) | Sumber: notifyRobotPose.x, GetRealtimeMapPosition.position |
| PuduPoseLog | y | DECIMAL(14,4) |  |
| PuduPoseLog | z | DECIMAL(14,4) | nullable; Sumber: GetRealtimeMapPosition.position.z |
| PuduPoseLog | yaw | DECIMAL(14,4) | nullable |
| PuduPoseLog | nearestPoint | VARCHAR | nullable; Sumber: notifyRobotPose.nearest_point |
| PuduPoseLog | source | VARCHAR | CALLBACK / POLL |
| PuduPoseLog | recordedAt | TIMESTAMPTZ | PK (gabungan); kunci partisi; Sumber: notify_timestamp |
| PuduMap | puduMapId | UUID | PK |
| PuduMap | warehouseId | UUID | FK -> Warehouse; nullable sampai admin memetakan; Sumber: Input admin |
| PuduMap | zoneId | UUID | FK -> Zone; nullable; area/lantai yang dicakup peta ini; Sumber: Input admin |
| PuduMap | shopId | VARCHAR | UNIQUE bersama mapName; Sumber: StoreMapList, mapElementChange.shop_id |
| PuduMap | mapName | VARCHAR | perlu escape karakter khusus (#); Sumber: StoreMapList, GetMapDetailV2.map_name |
| PuduMap | floor | VARCHAR | nullable; Sumber: AvailableMaps.floor, CurrentMap.floor |
| PuduMap | imageUrl | VARCHAR | nullable; background peta di dashboard; Sumber: GetMapDetailV2.url |
| PuduMap | zones | JSONB | nullable; zone_list[] termasuk area traffic control (area_id); Sumber: GetMapDetailV2.zone_list |
| PuduMap | isActive | BOOLEAN | default true; false kalau peta tidak lagi muncul di StoreMapList |
| PuduMap | lastChangedAt | TIMESTAMPTZ | nullable; memicu sync ulang elemen; Sumber: mapElementChange.timestamp |
| PuduMap | syncedAt | TIMESTAMPTZ | nullable |
| PuduMap | createdAt | TIMESTAMPTZ |  |
| PuduMap | updatedAt | TIMESTAMPTZ |  |
| PuduRobotMap | puduRobotId | UUID | PK (gabungan); FK -> PuduRobot |
| PuduRobotMap | puduMapId | UUID | PK (gabungan); FK -> PuduMap; Sumber: AvailableMaps.list[].name |
| PuduRobotMap | isUsed | BOOLEAN | peta sedang aktif di robot; Sumber: AvailableMaps.list[].is_used |
| PuduRobotMap | syncedAt | TIMESTAMPTZ |  |
| PuduMapElement | puduMapElementId | UUID | PK |
| PuduMapElement | puduMapId | UUID | FK -> PuduMap |
| PuduMapElement | name | VARCHAR | UNIQUE bersama puduMapId + elementType; Sumber: GetCurrentMapPoints.name, element_list[] |
| PuduMapElement | elementType | VARCHAR | POINT / TRACK / CIRCLE / SOURCE; Sumber: CurrentMap.elements[], element_list[] |
| PuduMapElement | pointType | VARCHAR | nullable; tipe titik PUDU; Sumber: GetCurrentMapPoints.type |
| PuduMapElement | x | DECIMAL(14,4) | nullable; Sumber: GetCurrentMapPoints.x |
| PuduMapElement | y | DECIMAL(14,4) | nullable; Sumber: GetCurrentMapPoints.y |
| PuduMapElement | z | DECIMAL(14,4) | nullable; Sumber: GetCurrentMapPoints.z |
| PuduMapElement | geometry | JSONB | nullable; bentuk track/circle; Sumber: element_list[] |
| PuduMapElement | nodeId | UUID | FK -> Node; nullable; diisi admin saat memetakan titik; Sumber: Input admin |
| PuduMapElement | isActive | BOOLEAN | default true; false kalau elemen hilang saat sync (tidak dihapus agar FK tetap utuh) |
| PuduMapElement | deletedAt | TIMESTAMPTZ | nullable; kapan elemen hilang dari peta PUDU |
| PuduMapElement | syncedAt | TIMESTAMPTZ | nullable |
| PuduMapElement | createdAt | TIMESTAMPTZ |  |
| PuduMapElement | updatedAt | TIMESTAMPTZ |  |
| PuduTask | puduTaskId | UUID | PK |
| PuduTask | missionId | UUID | FK -> Mission; nullable (UNIQUE) untuk task yang tidak dibuat WCS |
| PuduTask | puduRobotId | UUID | FK -> PuduRobot |
| PuduTask | previousPuduTaskId | UUID | FK -> PuduTask; nullable; call task sebelumnya kalau dibuat lewat CompleteCallTask.next_call_task; Sumber: CompleteCallTask.next_call_result.task_id |
| PuduTask | vendorTaskId | VARCHAR | UNIQUE; task_id dari PUDU, juga disalin ke Mission.externalMissionId; Sumber: response task_id, callback task_id |
| PuduTask | taskKind | VARCHAR | CALL / DELIVERY / RECHARGE / SWITCH_MAP |
| PuduTask | status | VARCHAR | status mentah PUDU terakhir; Sumber: state / task_status / status |
| PuduTask | queueNo | INT | nullable; Sumber: queue, queue_no |
| PuduTask | puduMapId | UUID | FK -> PuduMap; nullable; Sumber: map_name |
| PuduTask | targetPoint | VARCHAR | nullable; CALL / RECHARGE; Sumber: InitiateCallTask.point, notifyRechargeStatus.point |
| PuduTask | pointType | VARCHAR | nullable; Sumber: InitiateCallTask.point_type |
| PuduTask | callMode | VARCHAR | nullable; Sumber: InitiateCallTask.call_mode |
| PuduTask | priority | INT | nullable; Sumber: InitiateCallTask.priority |
| PuduTask | deliverySort | VARCHAR | nullable; Sumber: DeliveryTask.delivery_sort |
| PuduTask | deliveryMode | VARCHAR | nullable; Sumber: Delivery Task List.delivery_mode |
| PuduTask | completeType | VARCHAR | nullable; Sumber: notifyDeliveryTask.complete_type |
| PuduTask | remark | VARCHAR | nullable; Sumber: remark |
| PuduTask | robotResponseCode | VARCHAR | nullable; Sumber: notifyCustomCall.robot_response_code |
| PuduTask | robotResponseMessage | VARCHAR | nullable; Sumber: notifyCustomCall.robot_response_message |
| PuduTask | requestPayload | JSONB | nullable; body yang dikirim WCS (do_not_queue, robot_group_ids, execute_task, dll) |
| PuduTask | vendorCreatedAt | TIMESTAMPTZ | nullable; waktu task dibuat menurut PUDU; Sumber: GetCallList.create_time |
| PuduTask | startedAt | TIMESTAMPTZ | nullable |
| PuduTask | finishedAt | TIMESTAMPTZ | nullable |
| PuduTask | lastNotifiedAt | TIMESTAMPTZ | nullable; Sumber: notify_timestamp |
| PuduTask | createdAt | TIMESTAMPTZ | waktu insert di WCS |
| PuduTask | updatedAt | TIMESTAMPTZ |  |
| PuduTaskStop | puduTaskStopId | UUID | PK |
| PuduTaskStop | puduTaskId | UUID | FK -> PuduTask; (hapus berantai) |
| PuduTaskStop | trayNo | INT | UNIQUE bersama puduTaskId + seq; Sumber: trays[] index |
| PuduTaskStop | seq | INT | urutan stop |
| PuduTaskStop | pointName | VARCHAR | salinan nama titik, tetap utuh walau peta berubah; Sumber: destinations[] |
| PuduTaskStop | puduMapElementId | UUID | FK -> PuduMapElement; nullable; ON DELETE RESTRICT agar elemen peta hanya bisa di-soft delete |
| PuduTaskStop | status | VARCHAR | nullable; status per destinasi; Sumber: destinations[].status |
| PuduTaskStop | estimatedTimeSec | INT | nullable; Sumber: destinations[].estimated_time |
| PuduTaskStop | completeType | VARCHAR | nullable; Sumber: destinations[].complete_type |
| PuduTaskStop | arrivedAt | TIMESTAMPTZ | nullable; dihitung WCS dari perubahan status |
| PuduTaskStop | finishedAt | TIMESTAMPTZ | nullable |
| PuduTaskStop | createdAt | TIMESTAMPTZ |  |
| PuduTaskStop | updatedAt | TIMESTAMPTZ |  |

## Constraint, index, dan aturan hapus

Selain PK dan FK di atas. Semuanya tertulis eksplisit di `prisma/schema.prisma` (`@@id`, `@unique`/`@@unique`, `@@index`, `onDelete`).

| Tabel | Jenis | Kolom / aturan | Alasan |
| --- | --- | --- | --- |
| Robot | UNIQUE | equipmentId | Robot 1:1 dengan Equipment |
| Task | UNIQUE | source, externalRef | Idempotensi POST /tasks dari WMS/ERP |
| Task | INDEX | status, priority | |
| TaskStatusHistory | INDEX | taskId, changedAt | |
| Mission | INDEX | taskId | |
| Mission | INDEX | robotId, status | |
| Event | INDEX | sourceType, sourceId, occurredAt | |
| Event | INDEX | externalErrorId | |
| Event | INDEX | taskId | |
| Alarm | INDEX | status | |
| RobotStatus | INDEX | robotId, recordedAt | |
| IntegrationLog | UNIQUE | integrationId, direction, traceId | Callback PUDU di-retry s/d 3x dengan TraceId sama -- disimpan sekali |
| IntegrationLog | INDEX | status, nextAttemptAt | |
| IntegrationLog | INDEX | messageType, occurredAt | |
| IntegrationLog | INDEX | robotId, occurredAt | |
| User | UNIQUE | username | Login |
| Role | UNIQUE | name | 5+3 nilai tetap |
| PuduRobot | UNIQUE | sn | Kunci upsert callback robotBinding |
| PuduRobot | UNIQUE | robotId | Relasi 1:1 dengan Robot |
| PuduRobotStatusLog | INDEX | puduRobotId, recordedAt | |
| PuduPoseLog | PK gabungan | poseLogId, recordedAt | Tabel dipartisi per bulan -- PK wajib menyertakan kolom partisi |
| PuduPoseLog | INDEX | puduRobotId, recordedAt | |
| PuduMap | UNIQUE | shopId, mapName | Kunci upsert sync peta |
| PuduRobotMap | PK gabungan | puduRobotId, puduMapId | Satu baris per robot per peta |
| PuduMapElement | UNIQUE | puduMapId, elementType, name | Kunci upsert sync elemen peta |
| PuduMapElement | INDEX | nodeId | |
| PuduTask | UNIQUE | vendorTaskId | Kunci upsert callback task |
| PuduTask | UNIQUE | missionId | Relasi 1:1 dengan Mission |
| PuduTask | INDEX | puduRobotId, status | |
| PuduTask | INDEX | createdAt | |
| PuduTaskStop | UNIQUE | puduTaskId, trayNo, seq | Kunci upsert status destinasi |
| PuduTaskStop | ON DELETE CASCADE | puduTaskId | Ikut terhapus bersama induknya |
| PuduTaskStop | ON DELETE RESTRICT | puduMapElementId | Elemen peta hanya boleh di-soft delete (isActive/deletedAt) |
| PuduRobotState | ON DELETE CASCADE | puduRobotId | Ikut terhapus bersama induknya |
| PuduRobotMap | ON DELETE CASCADE | puduRobotId | Ikut terhapus bersama induknya |
| PuduRobotMap | ON DELETE CASCADE | puduMapId | Ikut terhapus bersama induknya |
| TaskStatusHistory | ON DELETE SETNULL | integrationLogId | IntegrationLog lama boleh dihapus (retensi) tanpa menghapus data turunannya |
| Event | ON DELETE SETNULL | integrationLogId | IntegrationLog lama boleh dihapus (retensi) tanpa menghapus data turunannya |
| PuduRobotStatusLog | ON DELETE SETNULL | integrationLogId | IntegrationLog lama boleh dihapus (retensi) tanpa menghapus data turunannya |

## Di mana data PUDU disimpan

| Data dari PUDU | Disimpan di |
| --- | --- |
| Semua callback mentah + perintah keluar (command) | IntegrationLog (INBOUND/OUTBOUND), payload JSONB |
| Header TraceId / trace_id response | IntegrationLog.traceId |
| Header CallbackCode (hasil verifikasi) | IntegrationLog.callbackCodeValid |
| Kredensial (region, baseUrl, ApiAppKey/Secret, hash CallbackCode) | Integration.credentials (terenkripsi) |
| Error robot (robotErrorWarning, robotErrorNotice) | Event (+ Alarm); error_id -> externalErrorId, extend_info -> payload, task_id -> taskId |
| Progres task (status per callback) | PuduTask (status terakhir), TaskStatusHistory (status versi WCS), IntegrationLog (mentah) |
| Traffic control area (msg_id, area_id, action) | IntegrationLog.payload (scope 1: WCS selalu membalas ALLOW) |
| Profil robot (sn, mac, shop_id, group_id, binding) | PuduRobot |
| State live (baterai, run/move state, posisi) | PuduRobotState |
| Riwayat state | PuduRobotStatusLog |
| Riwayat posisi (notifyRobotPose) | PuduPoseLog (dipartisi) |
| Peta, titik, zona | PuduMap, PuduMapElement, PuduMap.zones |
| Peta yang terpasang di robot | PuduRobotMap |
| Task call/delivery/recharge/switch map | PuduTask (1:1 Mission), PuduTaskStop (tray & destinasi) |

## Catatan desain

- **Tabel inti vendor-neutral, detail vendor di adapter.** Tabel inti tidak tahu robotnya merek apa. Kolom tambahan v3 di tabel inti (`IntegrationLog.traceId/messageType/...`, `Event.externalErrorId/externalLevel/payload/taskId`) bersifat generik dan bisa dipakai vendor lain.
- **Robot adalah spesialisasi Equipment** (table-per-type): Robot 1:1 Equipment, dan PuduRobot 1:1 Robot untuk detail khas PUDU.
- **assignedResource bersifat polymorphic.** `Task.assignedResourceId`, `Assignment.resourceId`, `MaterialMovement.resourceId`, dan `Event.sourceId` memakai pasangan `resourceType`/`sourceType` + id, jadi tidak punya FK tetap di database. Validasi dilakukan di aplikasi.
- **Siapa menulis apa (hindari data ganda):** `PuduRobotState` di-upsert setiap callback status/pose; `PuduRobotStatusLog` hanya saat state berubah; `PuduPoseLog` setiap `notifyRobotPose`; `RobotStatus` (inti) hanya saat status robot versi WCS berubah, bukan setiap update posisi. `notifyRobotPose` tidak perlu disimpan mentah di `IntegrationLog` karena volumenya sekitar 86.400 baris per robot per hari.
- **Sync peta memakai soft delete.** Saat `mapElementChange`, ambil `GetMapDetailV2`, upsert elemen berdasarkan (puduMapId, elementType, name), tandai elemen yang hilang `isActive=false` + `deletedAt`. Jangan DELETE -- FK dari `PuduTaskStop` sengaja RESTRICT. `PuduTaskStop.pointName` menyimpan salinan nama titik supaya riwayat task tetap terbaca walau peta berubah.
- **Partisi dan retensi.** `PuduPoseLog` dipartisi per bulan lewat `prisma/sql/pudu_pose_log_partition.sql`; partisi > 90 hari di-DROP. `IntegrationLog` berstatus SUCCESS dihapus setelah 30-90 hari; FK yang merujuknya ON DELETE SET NULL sehingga data turunan tetap ada.
- **Route berbasis Location, peta berbasis Node/Edge.** Task menunjuk Location/Station (PRD 9.5). Node/Edge adalah graf peta WCS untuk warehouse map (FR-09). Titik peta PUDU dipetakan ke Node lewat `PuduMapElement.nodeId`; peta PUDU dipetakan ke gudang/zona lewat `PuduMap.warehouseId`/`zoneId`.
- **Operational inventory view = `InventoryItem`.** WMS tetap source of truth; tabel ini hanya salinan kerja (Functional Boundary, kepemilikan master data).
- **Entity di luar PRD Section 9 (usulan engineering):** `InventoryItem`, `MaterialRequest`, `Discrepancy`, `Integration`, `OutboxEvent`, `TaskStatusHistory`, seluruh tabel ERP & Production, dan seluruh tabel PUDU.
- **Perlu keputusan tim:** `Assignment` dan `TaskDetail` tumpang tindih dengan `Task.assignedResourceId`/`Mission` dan metadata task -- dipertahankan sampai dibahas. Nilai enum `MaterialRequest.status` dan request ERP masih mengikuti pola `TaskStatus` sementara.
