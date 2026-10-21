# Data per menu dashboard WCS: apa yang tampil dan dari mana

Semua menu sidebar tetap; dokumen ini menentukan data apa yang seharusnya tampil di tiap menu, dari mana datanya datang (robot PUDU, input admin, hitungan WCS, atau sistem lain), dan di mana disimpan. Data yang seharusnya ada tetapi belum punya tempat di database ditandai "Perlu ditambah".

## Cara membaca

Dokumen ini ditulis netral vendor: data dibahas sebagai data robot (AMR) secara umum, bukan milik satu merek. Robot pilot saat ini hanya contoh sumber pertama; robot merek lain nanti mengirim data yang sama lewat adapter.

**Asal data:** Robot = dikirim robot atau sistem vendor robot. Admin = diinput admin di UI. WCS = dihitung WCS dari data lain. WMS/ERP dan PLC = dari sistem lain. **Kondisi:** Siap = tempat penyimpanannya sudah ada di ERD. Perlu ditambah = data seharusnya ada, tetapi belum ada tempatnya di database (usulan di bagian akhir). Menunggu = butuh fitur robot diaktifkan, integrasi PLC, atau verifikasi dengan robot nyata.

**Kolom "Disimpan di"** memakai nama tabel inti WCS (`Task`, `Event`, `Alarm`, `Location`, dan seterusnya) atau nama data robot di bawah ini. Nama teknis tabelnya hanya untuk tim backend.

| Data robot | Tabel saat ini (teknis) |
| --- | --- |
| Status robot terkini | `PuduRobotState` |
| Riwayat status robot | `PuduRobotStatusLog` |
| Riwayat posisi robot | `PuduPoseLog` |
| Peta | `PuduMap` |
| Titik dan elemen peta | `PuduMapElement` |
| Daftar robot, grup, dan lokasi/toko | `PuduRobot`, `PuduRobotGroup`, `PuduShop` |
| Eksekusi task di robot | `PuduTask` |
| Titik tujuan task | `PuduTaskStop` |

Tabel tersebut dibuat untuk robot pilot. Robot merek lain nanti memakai bentuk data yang sama lewat adapter, jadi desain UI tidak perlu berubah.

## Data dari robot: masuk ke mana dan tampil di mana

Ini jalur data dari robot ke layar. Misalnya titik lokasi: robot atau sistem vendornya mengirim peta beserta titiknya, WCS menyimpannya sebagai titik peta, lalu titik itu tampil di Warehouse Map dan Master Data.

| Data dari robot | Cara datang | Disimpan sebagai | Tampil di menu |
| --- | --- | --- | --- |
| Posisi robot (x, y, arah, titik terdekat) | Laporan otomatis dari robot (harus diaktifkan lebih dulu) | Status robot terkini, riwayat posisi | Warehouse Map, Equipment & Resources, Overview |
| Status robot (online, status jalan, baterai, charging) | Laporan otomatis; diambil berkala sebagai cadangan | Status robot terkini, riwayat status | Equipment & Resources, Overview, KPI & Reports |
| Peta (gambar, ukuran, skala, zona) | Diambil lewat API vendor | Peta | Warehouse Map, Master Data |
| Titik lokasi (rak, pickup, charging) | Diambil lewat API vendor; perubahan di peta memicu sinkron ulang | Titik dan elemen peta, dikaitkan ke lokasi WCS | Warehouse Map, Master Data |
| Daftar robot, grup, dan lokasi/toko | Diambil lewat API vendor | Daftar robot, grup, lokasi/toko | Master Data (Robots), Equipment & Resources |
| Progres task (status, antrean, tujuan, waktu tiba) | Laporan otomatis dan respons API | Eksekusi task di robot, titik tujuan task | Dispatch & Execution, Task Management |
| Error dan peringatan | Laporan otomatis | `Event`, `Alarm` | Alarms & Events, Overview |
| Pendaftaran dan aktivasi robot | Laporan otomatis | Daftar robot | Master Data, Integrations |
| Semua pesan masuk dan keluar | Semua laporan dan panggilan API | `IntegrationLog` | Integrations |

## Data per menu

Satu bagian per menu sidebar. Semua menu tetap ada; tabel menunjukkan data yang bisa disajikan di menu itu.

### Operations Overview

Ringkasan kondisi gudang saat ini. Hampir semua angkanya dihitung dari data menu lain.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Jumlah robot online / offline / charging | Robot | Status robot terkini | Siap | Dihitung WCS dari status terbaru tiap robot |
| Jumlah task aktif, antre, selesai, gagal hari ini | WCS | `Task.status`, `createdAt`, `completedAt` | Siap | Dihitung dengan query |
| Alarm terbuka berdasarkan tingkat keparahan | Robot / WCS | `Event.severity`, `Alarm.status` | Siap | Alarm dibuat dari laporan error robot dan kegagalan task |
| Rata-rata baterai armada | Robot | Status robot terkini (baterai) | Siap | Dihitung WCS |
| Mini peta posisi robot | Robot | Status robot terkini (posisi), peta | Menunggu | Butuh laporan posisi dari robot diaktifkan |
| Aktivitas terbaru (task selesai, alarm, robot offline) | WCS | `Event.occurredAt`, `TaskStatusHistory` | Siap | Daftar kejadian terbaru |
| Throughput per jam | WCS | `Task.completedAt` | Siap | Dihitung dari task selesai |
| Status koneksi integrasi | WCS | `Integration.status`, `lastTestedAt` | Siap | Tampil sebagai lampu status kecil |

### Task Management

Daftar dan detail task: apa yang harus dikerjakan, dari mana ke mana, siapa yang mengerjakan.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| ID task, jenis task, prioritas, status | Admin / WMS / WCS | `Task.taskType`, `priority`, `status` | Siap | `taskType` saat ini teks bebas |
| Daftar jenis task (master) | Admin | Belum ada | Perlu ditambah | UI Master Data memiliki Task Types; ERD belum punya tabel `TaskType` |
| Sumber dan tujuan | Admin / WMS | `Task.sourceLocationId`, `destinationLocationId` | Siap | Nama lokasi dari `Location` |
| Material, jumlah, kontainer | WMS / Admin | `Task.materialId`, `quantity`, `containerId` | Siap |  |
| Asal task (WMS, manual, ERP) dan referensi eksternal | WMS / Admin | `Task.source`, `externalRef` | Siap |  |
| Robot yang ditugaskan | WCS | `Task.assignedResourceId` | Siap |  |
| Waktu dibuat, mulai, selesai | WCS | `Task.createdAt`, `startedAt`, `completedAt` | Siap |  |
| Alasan gagal dan jumlah percobaan ulang | WCS / Robot | `Task.failureCode`, `retryCount` | Siap |  |
| Riwayat perubahan status | WCS | `TaskStatusHistory` | Siap | Untuk timeline di halaman detail |

### Dispatch & Execution

Eksekusi task ke robot dan progresnya. Ini menu yang paling bergantung pada data robot.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Misi aktif (task, robot, percobaan ke-n) | WCS | `Mission.status`, `attempt`, `robotId` | Siap |  |
| ID misi di sisi vendor robot | Robot | `Mission.externalMissionId` | Siap |  |
| Status task di robot, nomor antrean, keterlambatan | Robot | Eksekusi task di robot | Siap | Datang dari laporan task |
| Daftar titik tujuan dan urutannya | Robot | Titik tujuan task | Siap |  |
| Status tiap titik, waktu tiba | Robot | Titik tujuan task | Siap |  |
| Estimasi dan durasi aktual per titik | Robot | Titik tujuan task | Menunggu | Satuan waktu dari vendor belum diverifikasi, jadi UI jangan menulis "menit" dulu |
| Titik berikutnya (next waypoint) | Robot | Titik tujuan task berikutnya | Siap | Diturunkan WCS, tidak dikirim langsung |
| Respons robot saat menerima task | Robot | Eksekusi task di robot | Siap | Kode dan pesan respons |
| Tombol batalkan / kirim ulang | WCS | `Task.status`, `Mission.attempt` | Siap | Aksi lewat adapter vendor |

### Equipment & Resources

Armada robot dan peralatan lain beserta kondisinya sekarang.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Nama, model, vendor, serial number | Robot / Admin | `Robot.name`, `model`, `vendor`, `serialNumber`; `Equipment.name` | Siap |  |
| Jenis robot (angkut, layanan, dan sebagainya) | Admin | Belum ada | Perlu ditambah | UI Master Data memiliki kolom Type |
| Status online, status jalan, status gerak | Robot | Status robot terkini | Siap | Status mentah vendor dipetakan ke status WCS oleh adapter |
| Baterai dan status charging | Robot | Status robot terkini | Siap | Arti beberapa nilai flag charging belum diverifikasi |
| Posisi terakhir dan waktu update | Robot | Status robot terkini | Menunggu | Butuh laporan posisi dari robot diaktifkan |
| Task yang sedang dikerjakan | Robot | Status robot terkini | Siap |  |
| Peta tempat robot berada | Robot | Status robot terkini | Siap |  |
| Kecepatan | WCS | Riwayat posisi robot | Perlu ditambah | Robot pilot tidak mengirim kecepatan; bisa dihitung dari selisih posisi dan waktu |
| Suhu | Robot | Belum ada | Menunggu | Tidak ada di sampel data vendor yang dicek; perlu konfirmasi. Jika tidak dikirim, jangan didesain |
| Riwayat status | Robot | Riwayat status robot | Siap |  |
| Stasiun charging (jumlah dock, daya) | Admin | `Station` (jenis CHARGING) | Perlu ditambah | `dockCount` dan `powerKw` belum ada kolomnya |
| Konveyor (kecepatan, arah) | PLC | Belum ada | Menunggu | Menunggu integrasi PLC |

### Warehouse Map

Peta gudang, titik lokasi, dan posisi robot di atasnya.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Gambar peta, lebar, tinggi, skala, titik asal | Robot | Peta | Siap | Diambil lewat API vendor |
| Titik lokasi (nama, jenis titik, x, y) | Robot | Titik dan elemen peta | Siap | Inilah titik yang ditampilkan di peta |
| Garis, area, dinding (geometri) | Robot | Titik dan elemen peta | Siap | Disimpan sebagai JSON |
| Titik dari robot dikaitkan ke lokasi WCS | Admin | `Node`, `Location` | Siap | Admin memetakan titik robot ke lokasi gudang |
| Zona (nama, kode, luas, status) | Admin / Robot | `Zone`, zona di peta | Perlu ditambah | `code`, `areaM2`, `status` belum ada di `Zone` |
| Rak (level, baris, kapasitas) | Admin | Belum ada | Perlu ditambah | UI memiliki Racks; ERD belum punya tabel `Rack` |
| Workstation | Admin | Belum ada | Perlu ditambah | UI memiliki Workstations; ERD belum punya tabelnya |
| Posisi robot langsung | Robot | Status robot terkini | Menunggu | Butuh laporan posisi dari robot diaktifkan |
| Jejak jalan robot (riwayat) | Robot | Riwayat posisi robot | Siap | Tabel dipartisi per bulan |
| Rute yang direncanakan | WCS | `Route` | Siap | Robot pilot tidak mengirim jalur rencana |
| Tampilan isometrik 3D | Admin | Belum ada | Perlu ditambah | Butuh geometri tambahan; robot hanya memberi peta 2D |

### Alarms & Events

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Jenis kejadian, sumber, tingkat keparahan | Robot / WCS | `Event.eventType`, `sourceType`, `severity` | Siap |  |
| Pesan dan kode error | Robot | `Event.message`, `errorCode`, `externalErrorId`, `externalLevel` | Siap |  |
| Data mentah dari robot | Robot | `Event.payload` | Siap | JSON untuk investigasi |
| Waktu kejadian | Robot / WCS | `Event.occurredAt` | Siap |  |
| Task terkait | WCS | `Event.taskId` | Siap |  |
| Status alarm, siapa yang acknowledge dan kapan | Admin | `Alarm.status`, `acknowledgedBy`, `acknowledgedAt` | Siap |  |
| Siapa yang menutup alarm dan kapan | Admin | `Alarm.clearedBy`, `clearedAt` | Siap |  |
| Durasi alarm terbuka | WCS | `Alarm` | Siap | Dihitung |

### KPI & Reports

Semua angka dihitung dari data transaksi. Tidak ada data yang dikirim langsung.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Task selesai, gagal, dibatalkan per periode | WCS | `Task` | Siap |  |
| Waktu rata-rata task (dibuat ke selesai) | WCS | `Task.createdAt`, `completedAt` | Siap |  |
| Tingkat keberhasilan dan percobaan ulang | WCS | `Task.status`, `retryCount` | Siap |  |
| Utilisasi robot (waktu jalan, diam, charging) | Robot | Riwayat status robot | Siap | Dihitung dari durasi tiap status |
| Jarak tempuh robot | Robot | Riwayat posisi robot | Siap | Dihitung dari titik posisi berurutan |
| Jumlah alarm per jenis dan per robot | WCS | `Event`, `Alarm` | Siap |  |
| Waktu respons alarm | WCS | `Alarm.acknowledgedAt` | Siap |  |
| Pencapaian terhadap rencana produksi | ERP | `ProductionPlan`, `CustomerOrder` | Siap | Hanya jika ERP terhubung |

### Master Data

Data acuan yang dikelola admin. Sebagian terisi otomatis dari robot.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Robots (nama, serial, model, vendor) | Robot / Admin | `Robot` | Siap | Terisi otomatis dari daftar robot vendor |
| Jenis robot | Admin | Belum ada | Perlu ditambah | Kolom Type di UI |
| Locations (nama, kapasitas maksimum kg, status) | Admin / Robot | `Location` | Perlu ditambah | `name`, `maxCapacityKg`, `status` belum ada |
| Zones (kode, luas, status) | Admin | `Zone` | Perlu ditambah |  |
| Racks | Admin | Belum ada | Perlu ditambah | Tabel baru |
| Workstations | Admin | Belum ada | Perlu ditambah | Tabel baru |
| Materials (SKU, nama, satuan) | WMS / Admin | `Material` | Siap |  |
| Jenis material, berat kg, status | WMS / Admin | Belum ada | Perlu ditambah | `materialType`, `weightKg`, `status` |
| Routes (dari, ke, jenis resource, aktif) | Admin | `Route` | Siap |  |
| Nama rute, jarak meter, status | Admin | Belum ada | Perlu ditambah | `name`, `distanceMeters`, `status` |
| Charging Stations (jumlah dock, daya) | Admin | `Station` | Perlu ditambah | `dockCount`, `powerKw` |
| Stations (pickup, dropoff, charging, staging) | Admin | `Station.stationType` | Siap |  |
| Task Types | Admin | Belum ada | Perlu ditambah | Tabel baru |
| Titik peta dari robot | Robot | Titik dan elemen peta | Siap | Hanya baca di UI |

### Integrations

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Daftar integrasi (nama, jenis sistem, protokol, URL) | Admin | `Integration` | Siap | Robot, WMS, ERP, PLC masuk di sini |
| Status koneksi dan terakhir diuji | WCS | `Integration.status`, `lastTestedAt` | Siap |  |
| Kredensial (API key, secret) | Admin | `Integration.credentials` | Siap | Hanya bisa ditulis, tidak pernah ditampilkan ulang |
| Terakhir kunci diganti | Admin | `Integration.apiKeyRotatedAt` | Siap |  |
| Log pesan masuk dan keluar | Robot / WCS | `IntegrationLog` | Siap | Arah, status, jenis pesan, trace ID, HTTP status, percobaan |
| Pesan gagal dan alasannya | WCS | `IntegrationLog.errorMessage`, `attempts` | Siap |  |
| Daftar robot dan lokasi dari vendor | Robot | Daftar robot, grup, lokasi/toko | Siap | Tombol "sinkronkan" |

### System Settings

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Zona waktu, bahasa, format tanggal | Admin | Belum ada | Perlu ditambah | Butuh tabel pengaturan sistem |
| Ambang baterai rendah | Admin | Belum ada | Perlu ditambah |  |
| Batas percobaan ulang task | Admin | Belum ada | Perlu ditambah |  |
| Retensi log posisi dan log integrasi | Admin | Belum ada | Perlu ditambah |  |
| Aturan notifikasi alarm | Admin | Belum ada | Perlu ditambah |  |

### Administration

Foto sidebar tidak memperlihatkan isi submenu ini. Asumsi: pengguna, peran, dan audit.

| Data | Asal | Disimpan di | Kondisi | Catatan |
| --- | --- | --- | --- | --- |
| Pengguna (nama, email, status) | Admin | `User` | Siap |  |
| Peran dan izin | Admin | `Role.permissions` | Siap |  |
| Audit log (siapa, apa, kapan) | WCS | `AuditLog` | Siap |  |

## Data yang seharusnya ada tapi belum ada tempatnya

Menu tetap dipertahankan. Usulan berikut menambah tempat di database supaya data yang ingin ditampilkan punya rumah.

| Usulan | Untuk menu | Bentuk |
| --- | --- | --- |
| Tabel `TaskType` | Task Management, Master Data | Tabel baru (kode, nama, deskripsi, aktif) |
| Tabel `Rack` | Warehouse Map, Master Data | Tabel baru (zona, level, baris, kapasitas) |
| Tabel `Workstation` | Warehouse Map, Master Data | Tabel baru (lokasi, jenis, status) |
| Kolom tambahan `Zone` | Warehouse Map, Master Data | `code`, `areaM2`, `status` |
| Kolom tambahan `Location` | Master Data | `name`, `maxCapacityKg`, `status` |
| Kolom tambahan `Material` | Master Data | `materialType`, `weightKg`, `status` |
| Kolom tambahan `Route` | Master Data | `name`, `distanceMeters`, `status` |
| Kolom tambahan `Station` | Equipment, Master Data | `dockCount`, `powerKw` |
| Kolom `Robot.robotType` | Equipment, Master Data | Kolom teks atau enum |
| Tabel `SystemSetting` | System Settings | Pasangan kunci dan nilai |
| Kecepatan robot | Equipment | Dihitung dari riwayat posisi, tanpa tabel baru |
| Suhu robot | Equipment | Tunggu konfirmasi vendor; jika tidak dikirim, jangan didesain |
| Estimasi waktu tiba (ETA) | Dispatch | Tunggu verifikasi satuan waktu dari vendor |
| Status konveyor | Equipment, Warehouse Map | Menunggu integrasi PLC |

Catatan: satuan waktu (estimasi, durasi, sisa waktu) dan arti beberapa flag status dari vendor pilot belum diverifikasi. Datanya disimpan mentah, jadi UI sebaiknya menampilkan angka tanpa satuan sampai ada konfirmasi dengan robot nyata.
