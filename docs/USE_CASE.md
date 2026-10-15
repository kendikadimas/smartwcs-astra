# Use Case -- Smart WCS Platform

Oct 1, 2026 · Disusun oleh @Alya
**[Revisi 2026-10-05/06]** Ditambahkan 4 aktor baru dan UC-13 s/d UC-16 untuk
scope end-to-end ERP -> Delivery. Status **usulan**, lihat ADR.md Section 1.1
dan PRD v0.2 Section 15 "Open Items" -- belum dikonfirmasi resmi oleh
Astra/Winteq.

Mendefinisikan aktor dan skenario interaksi dengan Smart WCS Platform (Phase 0-3, scope Simple), diturunkan dari functional requirement PRD v0.2 (revisi) dan batas tanggung jawab di dokumen Functional Boundary.

## Daftar aktor

| Aktor | Jenis | Peran terhadap WCS |
| --- | --- | --- |
| Warehouse Operator | Manusia | Input task manual, monitor progress task, lihat alarm/event, acknowledge alarm. **[Revisi 2026-10-05]** Diperluas: siapkan material & calling robot ke Line Produksi (UC-14), terima inbound Warehouse Finish Good (UC-15) |
| Warehouse Supervisor | Manusia | Monitor operasi, atur prioritas task, menangani masalah operasional, lihat dashboard KPI |
| WCS Administrator | Manusia | Kelola master data (zone, node, equipment, robot, route), kelola user & role, konfigurasi sistem |
| Maintenance / Engineer | Manusia | Diagnosa equipment, cek alarm/error, cek koneksi sistem |
| System Integrator | Manusia | Konfigurasi dan troubleshooting integrasi antar sistem (WMS, RCS, PLC, **[Baru]** ERP, PUDU Cloud API) |
| **Operator Produksi** *(Usulan -- Baru)* | Manusia | Request raw material ke warehouse, lapor finish produksi percycle -> memicu calling robot ke Packaging (UC-14) |
| **Operator Box/Packaging** *(Usulan -- Baru)* | Manusia | Request box packaging untuk finish good, memicu calling robot ke Warehouse Finish Good (UC-15) |
| **Operator Delivery** *(Usulan -- Baru)* | Manusia | Mulai & pantau proses pengiriman ke customer (UC-16) |
| WMS | Sistem eksternal | Kirim task otomatis ke WCS (FR-02), terima notifikasi discrepancy inventory |
| RCS (Fleet Manager) | Sistem eksternal | Terima mission dari WCS, lapor status robot & hasil eksekusi mission ke WCS |
| PLC / Equipment Controller | Sistem eksternal (lewat Adapter) | Terima command abstrak dari WCS, lapor status equipment |
| **ERP** *(Usulan -- Baru)* | Sistem eksternal | Kirim Planning Produksi per shift dan Order Delivery ke WCS (FR-13, UC-13) |
| **PUDU Cloud API (RMS/RCS)** *(Usulan -- Baru)* | Sistem eksternal (vendor RCS pilot) | Terima command calling robot (Open API) dari WCS, kirim callback notification (status pick-drop, delivery, error, battery) ke WCS -- dipakai di UC-03, UC-14, UC-15, UC-16 |

Daftar aktor ini disesuaikan dengan PRD v0.2 Section 6 (Users & External System). WES dan MES/ERP (generik) tidak dimasukkan sebagai aktor terpisah di Phase 0-3 karena belum ada di scope asli (lihat Functional Boundary, Section Tujuan dan scope) -- **ERP** di atas adalah jalur integrasi *langsung* yang spesifik untuk scope end-to-end (FR-13), berbeda dari baris "MES/ERP" generik di PRD Section 6.1. AMR/AGV juga tidak digambar sebagai aktor terpisah karena tidak punya interface langsung ke WCS -- WCS cuma berkomunikasi dengan RCS (PUDU Cloud API untuk vendor pilot), dan RCS yang mengatur pergerakan AMR/AGV secara langsung.

&#91;embedded content: use case diagram · 5 aktor, 6 use case utama\]

## Ringkasan use case

| ID | Nama use case | Aktor utama | Deskripsi singkat |
| --- | --- | --- | --- |
| UC-01 | Terima task otomatis dari WMS | WMS | WMS kirim task ke WCS lewat API, WCS validasi dan masukkan ke queue |
| UC-02 | Input task manual | Warehouse Operator | Operator membuat task secara manual lewat UI saat dibutuhkan (mis. task ad-hoc) |
| UC-03 | Dispatch task ke resource | WCS (internal), RCS, PLC/Equipment Controller | WCS memilih equipment/robot yang tersedia dan mengirim perintah eksekusi |
| UC-04 | Monitor task & status equipment | Warehouse Operator, Warehouse Supervisor | Operator melihat dashboard real-time status task, robot, dan equipment |
| UC-05 | Kelola master data | WCS Administrator | Supervisor menambah/ubah data zone, node, route, equipment, robot, station |
| UC-06 | Terima & tangani event/alarm | Warehouse Operator, PLC/Equipment Controller, RCS | Sistem menerima event/alarm dari equipment/robot, menampilkan ke Operator, Operator acknowledge |
| UC-07 | Lihat KPI & laporan | Warehouse Supervisor | Supervisor melihat laporan throughput, utilisasi, dan downtime |
| UC-08 | Request material | Warehouse Operator, WMS | Permintaan pemindahan material diajukan dan diteruskan jadi task |
| UC-09 | Diagnosa equipment & koneksi sistem | Maintenance/Engineer | Engineer mengecek status koneksi, log error, dan kondisi equipment/robot untuk troubleshooting |
| UC-10 | Konfigurasi & troubleshooting integrasi sistem | System Integrator | Integrator mengatur konfigurasi koneksi WMS/RCS/PLC dan menyelesaikan masalah integrasi |
| UC-11 | Deteksi & notifikasi discrepancy inventory | WCS (internal), WMS | WCS membandingkan hasil eksekusi task dengan data WMS, mendeteksi perbedaan kuantitas/lokasi material, dan mengirim notifikasi discrepancy ke WMS (FR-01) |
| UC-12 | Audit & log keamanan | WCS Administrator, Warehouse Supervisor | Mencatat perubahan konfigurasi dan aktivitas penting pengguna ke audit log; Administrator dapat meninjau log (FR-11) |
| **UC-13** *(Usulan)* | Sinkronisasi planning produksi & order delivery | ERP | ERP kirim Planning Produksi per shift dan Order Delivery ke WCS lewat API; WCS simpan sebagai basis kebutuhan material dan pemicu delivery (FR-13) |
| **UC-14** *(Usulan)* | Request raw material & serah-terima finish good dari line produksi | Operator Produksi, Warehouse Operator, PUDU Cloud API | Operator Produksi request raw material; di akhir siklus, lapor finish good -- WCS panggil robot via PUDU untuk pick-drop ke Packaging (FR-14) |
| **UC-15** *(Usulan)* | Request packaging/box untuk finish good | Operator Box/Packaging, PUDU Cloud API | Operator request packaging; WCS panggil robot via PUDU untuk kirim barang sudah dibox ke Warehouse Finish Good (FR-15) |
| **UC-16** *(Usulan)* | Calling robot delivery & tracking pengiriman ke customer | Operator Delivery, PUDU Cloud API | Operator mulai proses delivery terhubung ke Order Delivery ERP; WCS panggil robot via PUDU dan lacak status sampai delivered (FR-16) |

## Use case specification detail

Detail dibuat untuk use case yang paling menentukan alur kerja inti WCS (dispatching, penerimaan task, request material, dan kepatuhan terhadap FR-01/FR-11): UC-01, UC-02, UC-03, UC-06, UC-08, UC-11, dan UC-12. Use case lain (UC-04, UC-05, UC-07, UC-09, UC-10) sifatnya CRUD/monitoring/konfigurasi standar dan tidak memerlukan spesifikasi flow bercabang. **[Revisi 2026-10-05, Usulan]** UC-13 s/d UC-16 juga didetailkan di bawah karena masing-masing memperkenalkan aktor dan flow baru yang belum ada presedennya di UC-01-12.

### UC-01 -- Terima task otomatis dari WMS

| Field | Detail |
| --- | --- |
| Aktor | WMS |
| Precondition | WMS dan WCS terhubung, autentikasi API valid |
| Main flow | 1. WMS kirim request create task ke WCS API (materialId, source, destination, quantity, priority)\<br>2. WCS validasi payload & ketersediaan master data terkait\<br>3. WCS set status task jadi CREATED lalu VALIDATED\<br>4. WCS masukkan task ke queue (QUEUED)\<br>5. WCS kirim response sukses + taskId ke WMS |
| Alternate flow | 3a. Validasi gagal (data tidak lengkap/referensi tidak ditemukan) -- WCS balas error, task tidak dibuat |
| Postcondition | Task berstatus QUEUED dan siap di-assign (lanjut ke UC-03) |

### UC-02 -- Input task manual

| Field | Detail |
| --- | --- |
| Aktor | Warehouse Operator |
| Precondition | Operator sudah login dengan role yang punya akses create task |
| Main flow | 1. Operator buka form create task di UI\<br>2. Operator isi source, destination, material, quantity, priority\<br>3. Operator submit\<br>4. WCS validasi dan proses sama seperti UC-01 dari langkah 2 |
| Alternate flow | 3a. Form tidak lengkap -- UI tampilkan validasi sebelum submit ke backend |
| Postcondition | Task berstatus QUEUED, source tercatat sebagai MANUAL |

### UC-03 -- Dispatch task ke resource

| Field | Detail |
| --- | --- |
| Aktor | WCS (internal), RCS, PLC/Equipment |
| Precondition | Ada task berstatus QUEUED, ada minimal satu equipment/robot berstatus available |
| Main flow | 1. WCS pilih task prioritas tertinggi dari queue\<br>2. WCS evaluasi equipment/robot yang cocok (status, capability, lokasi)\<br>3. WCS set task ASSIGNED ke resource terpilih\<br>4a. Jika resource = Robot: WCS kirim mission ke RCS (bukan kontrol langsung)\<br>4b. Jika resource = Equipment/PLC: WCS kirim command abstrak lewat Adapter\<br>5. WCS set task DISPATCHED, lalu RUNNING setelah ada acknowledgement\<br>6. RCS/PLC lapor completion -- WCS set task COMPLETED |
| Alternate flow | 6a. RCS/PLC lapor failure -- WCS set task FAILED, evaluasi RETRY sesuai kebijakan (lihat area abu-abu Functional Boundary soal retry logic) |
| Postcondition | Task selesai (COMPLETED) atau masuk alur retry/cancel |

### UC-06 -- Terima & tangani event/alarm

| Field | Detail |
| --- | --- |
| Aktor | PLC/Equipment Controller, RCS, Warehouse Operator |
| Precondition | Koneksi monitoring (MQTT/OPC UA) antara WCS dan equipment/robot aktif |
| Main flow | 1. Equipment/robot kirim event/alarm ke WCS\<br>2. WCS catat event, klasifikasi severity\<br>3. WCS tampilkan alarm di dashboard real-time\<br>4. Warehouse Operator lihat alarm dan melakukan acknowledge\<br>5. WCS catat waktu & siapa yang acknowledge\<br>6. Setelah masalah pada sumber selesai diperbaiki, Operator (atau sinyal otomatis dari equipment/RCS) memicu clear/reset pada alarm\<br>7. WCS ubah status alarm dari Acknowledged menjadi Cleared/Reset dan catat waktunya |
| Alternate flow | 1a. Alarm severity = safety-critical -- WCS tetap hanya menampilkan, TIDAK mengeksekusi keputusan safety (lihat Batas keselamatan, Functional Boundary) |
| Postcondition | Alarm tercatat di log mengikuti siklus status Active -> Acknowledged -> Cleared/Reset; status akhir Cleared/Reset tercapai setelah masalah pada sumber selesai ditangani |

### UC-08 -- Request material

| Field | Detail |
| --- | --- |
| Aktor | Warehouse Operator, WMS |
| Precondition | Material tersedia di source location sesuai master data |
| Main flow | 1. Operator (atau WMS) ajukan material request (material, quantity, source, destination)\<br>2. WCS validasi ketersediaan material & lokasi terhadap master data\<br>3. WCS buat task dari material request yang valid\<br>4. Task mengikuti alur dispatch standar (UC-03) |
| Alternate flow | 1a. Material/lokasi tidak valid -- WCS tolak request, kembalikan pesan error ke pemohon\<br>2a. Request gagal diproses (mis. tidak ada equipment tersedia) -- WCS tandai request FAILED, sediakan opsi retry manual oleh Operator |
| Postcondition | Material request tercatat dengan riwayat status (PENDING -> VALIDATED -> TASK\_CREATED, atau REJECTED/FAILED); riwayat dapat dilihat lewat GET /material-requests |

### UC-11 -- Deteksi & notifikasi discrepancy inventory

| Field | Detail |
| --- | --- |
| Aktor | WCS (internal), WMS |
| Precondition | Task sudah selesai dieksekusi (status DONE) dengan actual quantity/lokasi tercatat |
| Main flow | 1. WCS bandingkan actual quantity/lokasi hasil eksekusi task dengan expected quantity/lokasi dari WMS\<br>2. Jika ditemukan perbedaan, WCS catat sebagai discrepancy event\<br>3. WCS kirim notifikasi discrepancy ke WMS lewat API/event\<br>4. WMS menerima notifikasi untuk rekonsiliasi lebih lanjut |
| Alternate flow | 1a. Tidak ada perbedaan -- WCS tidak membuat discrepancy event, task ditutup normal |
| Postcondition | Discrepancy (jika ada) tercatat di log dan dikirim ke WMS; WCS tidak melakukan koreksi inventory sendiri (WMS tetap source of truth) |

### UC-12 -- Audit & log keamanan

| Field | Detail |
| --- | --- |
| Aktor | WCS Administrator, Warehouse Supervisor |
| Precondition | User sudah login dan melakukan aktivitas yang tercakup kebijakan audit (login/logout, perubahan role, perubahan master data, perubahan konfigurasi integrasi) |
| Main flow | 1. User melakukan aktivitas yang tercakup kebijakan audit\<br>2. WCS mencatat entry audit log (siapa, kapan, aksi apa, data sebelum/sesudah bila relevan)\<br>3. Administrator membuka halaman/endpoint audit log\<br>4. Administrator filter/cari log berdasarkan user, tanggal, atau jenis aksi |
| Alternate flow | 1a. Aktivitas gagal/ditolak (mis. percobaan login gagal) -- tetap dicatat sebagai security log |
| Postcondition | Audit/security log tersimpan dan dapat ditinjau; mendukung FR-11 (mencatat perubahan konfigurasi dan aktivitas penting pengguna) |

### UC-13 -- Sinkronisasi planning produksi & order delivery *(Usulan)*

| Field | Detail |
| --- | --- |
| Aktor | ERP |
| Precondition | ERP dan WCS terhubung, autentikasi API valid (Integration Config) |
| Main flow | 1. ERP kirim/sediakan Planning Produksi per shift (tipe, qty, line) lewat API\<br>2. ERP kirim/sediakan Order Delivery (waktu, tipe, qty customer) lewat API\<br>3. WCS sinkronisasi data ini (dipicu manual/webhook dari ERP, atau dijadwalkan WCS)\<br>4. WCS simpan sebagai `ProductionPlan` dan `CustomerOrder`\<br>5. Data ini jadi basis kebutuhan material (dipakai di UC-14) dan pemicu delivery (dipakai di UC-16) |
| Alternate flow | 3a. Sinkronisasi gagal (ERP unreachable/data invalid) -- WCS catat sebagai integration log, retry sesuai kebijakan |
| Postcondition | `ProductionPlan` dan `CustomerOrder` ter-update, siap dipakai modul Production Line dan Delivery |

### UC-14 -- Request raw material & serah-terima finish good dari line produksi *(Usulan)*

| Field | Detail |
| --- | --- |
| Aktor | Operator Produksi, Warehouse Operator, PUDU Cloud API |
| Precondition | Material tersedia di warehouse sesuai master data; robot (AMR) tersedia dan terhubung lewat PUDU Cloud API |
| Main flow | 1. Operator Produksi request raw material (tipe, qty, line) lewat Production Line Interface\<br>2. WCS teruskan request ke Warehouse Operator untuk disiapkan\<br>3. Warehouse Operator lapor selesai siapkan material\<br>4. WCS panggil robot via PUDU Cloud API (command calling robot) untuk pick-drop material ke Line Produksi\<br>5. PUDU kirim callback status pick-drop ke WCS\<br>6. Di akhir siklus, Operator Produksi lapor finish produksi percycle\<br>7. WCS panggil robot lagi untuk pindahkan finish good ke Packaging (lanjut ke UC-15)\<br>8. PUDU kirim callback status pengiriman finish good |
| Alternate flow | 4a. Robot tidak tersedia/gagal dipanggil -- WCS catat sebagai task FAILED, evaluasi retry\<br>6a. *(Open item)* Ada kemungkinan langkah "Request Prepare part finish good -> Calling AMR" terpisah dari "Finish produksi percycle" -- belum dikonfirmasi, lihat PRD v0.2 Section 15 |
| Postcondition | Material terkirim ke Line Produksi; finish good per-cycle terkirim ke Packaging dengan task tercatat |

### UC-15 -- Request packaging/box untuk finish good *(Usulan)*

| Field | Detail |
| --- | --- |
| Aktor | Operator Box/Packaging, PUDU Cloud API |
| Precondition | Finish good sudah diterima dari Produksi (hasil UC-14) |
| Main flow | 1. Operator Box/Packaging request packaging (material, tipe box, qty) lewat Packaging Interface\<br>2. WCS panggil robot via PUDU Cloud API untuk kirim barang yang sudah dibox ke Warehouse Finish Good\<br>3. PUDU kirim callback status pengiriman per tray/tujuan\<br>4. WCS update Inbound Warehouse Finish Good (dipakai UC-04/Section Update Stock) |
| Alternate flow | 2a. Robot gagal dipanggil -- task FAILED, status packaging request tetap "Menunggu Robot", evaluasi retry |
| Postcondition | Finish good yang sudah dibox tercatat masuk ke Warehouse Finish Good; status packaging request COMPLETED |

### UC-16 -- Calling robot delivery & tracking pengiriman ke customer *(Usulan)*

| Field | Detail |
| --- | --- |
| Aktor | Operator Delivery, PUDU Cloud API |
| Precondition | Ada Order Delivery dari ERP (hasil UC-13) berstatus siap dikirim; barang tersedia di Warehouse Finish Good |
| Main flow | 1. Operator Delivery pilih Order Delivery dari antrean (dari ERP) dan mulai proses delivery\<br>2. WCS panggil robot via PUDU Cloud API (DeliveryTask + DeliveryCommands) untuk proses pengiriman ke titik outbound/customer\<br>3. PUDU kirim callback status pengiriman secara berkala\<br>4. WCS update status delivery request (PENDING -> DISPATCHED -> DELIVERED/FAILED)\<br>5. Operator Delivery pantau status sampai selesai |
| Alternate flow | 2a. Robot gagal dipanggil/gangguan di tengah jalan -- status jadi FAILED, Operator Delivery dapat retry atau eskalasi manual |
| Postcondition | Delivery request mencapai status DELIVERED (atau FAILED dengan alasan tercatat); data ini jadi basis KPI end-to-end (lihat PRD v0.2 Section 12) |
