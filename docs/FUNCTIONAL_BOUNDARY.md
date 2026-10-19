# Functional Boundary -- Smart WCS Platform

Oct 1, 2026 · Disusun oleh @Alya
**[Revisi 2026-10-05/06]** Ditambahkan ERP sebagai sistem eksternal dengan
jalur integrasi langsung (bukan lagi di luar scope), dan 3 role operator
baru. Status **usulan** untuk bagian baru -- lihat ADR.md Section 1.1 dan
PRD v0.2 Section 15 "Open Items".

Mendefinisikan batas tanggung jawab antara WCS dan sistem lain (WMS, WES, RCS, PLC/Equipment, ERP) supaya tidak ada tumpang tindih atau gap fungsi. Mengacu ke PRD v0.2 (revisi) Section 3, 4, 6, FR-03, FR-04, FR-13, Section 10.

## Tujuan dan scope

Dokumen ini menetapkan batas tegas tanggung jawab fungsional WCS terhadap sistem lain di sekitarnya: WMS (atasan), WES (dikecualikan dari Phase 0-3 berdasarkan kompleksitas orkestrasi, bukan jumlah AMR atau ukuran warehouse -- lihat PRD Section 5), RCS/Fleet Manager (AMR, vendor pilot PUDU Cloud API), PLC/Equipment Controller, dan **[Baru]** ERP. Tujuannya supaya pengembang tahu persis: fungsi apa yang WAJIB diimplementasikan di WCS, dan fungsi apa yang didelegasikan ke sistem lain -- tanpa tumpang tindih (dua sistem mengerjakan hal sama) atau gap (tidak ada yang mengerjakan).

**Catatan cakupan:** PRD v0.2 Section 6 menyebut sistem eksternal (WMS, WES, RCS, PLC/Equipment Controller, MES/ERP generik, AMR/AGV, **[Baru, Usulan] ERP** jalur langsung, **[Baru, Usulan] PUDU Cloud API**) dan 8 role pengguna manusia (5 tetap + 3 **[Baru, Usulan]**: Operator Produksi, Operator Box/Packaging, Operator Delivery). Dokumen batas fungsional ini secara eksplisit berfokus pada sistem eksternal yang berinteraksi langsung dengan WCS: WMS, RCS (PUDU Cloud API), PLC/Equipment Controller, dan **[Baru, Usulan] ERP** (FR-13) -- MES/ERP generik dan AMR/AGV sebagai entitas terpisah tetap di luar scope integrasi langsung. Role pengguna manusia (termasuk 3 role baru) berinteraksi dengan WCS lewat UI internal (diatur lewat RBAC & Access Control), bukan sebagai sistem eksternal, sehingga tidak masuk ke matrix tanggung jawab antar-sistem di bawah.

Scope: Phase 0-3 (kategori Simple, tanpa WES), diperluas end-to-end dengan ERP->Delivery (usulan, revisi 2026-10-05). Saat WES masuk di Phase 6, sebagian baris tanggung jawab (terutama scheduling/batching) akan pindah dari "tidak ada" menjadi "WES".

&#91;embedded content: alur tanggung jawab · WMS - WCS - RCS - PLC\]

## Matrix tanggung jawab

| Area fungsi | WMS | WES (Phase 6+) | WCS | RCS (Fleet Manager) | PLC / Equipment Controller | ERP *(Usulan)* |
| --- | --- | --- | --- | --- | --- | --- |
| Business demand, purchasing, planning | Ya | Tidak | Tidak | Tidak | Tidak | Ya |
| Planning produksi per shift & order delivery *(Usulan, FR-13)* | Tidak | Tidak | Tidak (terima & simpan saja) | Tidak | Tidak | Ya |
| Inventory ownership (source of truth) | Ya | Tidak | Tidak (operational view saja) | Tidak | Tidak | Tidak |
| Task priority & scheduling lintas-proses | Tidak | Ya (saat ada) | Tidak | Tidak | Tidak | Tidak |
| Terima task, ubah jadi execution task | Tidak | Tidak | Ya | Tidak | Tidak | Tidak |
| Pilih equipment/resource (dispatching) | Tidak | Tidak | Ya | Tidak | Tidak | Tidak |
| Fleet-level allocation antar robot | Tidak | Tidak | Tidak | Ya | Tidak | Tidak |
| Path planning & pergerakan fisik robot | Tidak | Tidak | Tidak | Ya | Tidak | Tidak |
| Zone/route-level configuration | Tidak | Tidak | Ya | Tidak | Tidak | Tidak |
| Sequence mesin, sensor, actuator | Tidak | Tidak | Tidak | Tidak | Ya | Tidak |
| Event/alarm aggregation & dashboard | Tidak | Tidak | Ya | Tidak | Tidak | Tidak |
| Safety interlock & emergency stop | Tidak | Tidak | Tidak | Tidak | Ya (sistem safety dedicated) | Tidak |

## Batas detail per fungsi

**Dispatching (FR-03).** WCS memilih equipment/execution resource mana yang akan menjalankan task, berdasarkan status, capability, lokasi, dan battery/energy. Tapi untuk AMR, fleet-level allocation (robot mana di antara beberapa unit sejenis) dan kontrol gerak robot itu sendiri dilakukan oleh RCS -- WCS cukup kirim mission ke RCS, bukan memerintah robot langsung.

**Routing (FR-04).** WCS mengelola titik dan jalur pada level konfigurasi (Node, Edge, Route di master data) dan menentukan titik awal/tujuan task. Tapi path planning dan pergerakan fisik robot dari titik A ke B dilakukan oleh RCS sesuai kemampuan sistemnya sendiri -- WCS tidak menghitung jalur detail untuk AMR.

**Equipment/PLC control (FR-07).** WCS mengirim command abstrak (mis. "pindahkan material X dari lokasi A ke B") lewat Adapter. Sequence mesin, kontrol sensor/actuator dilakukan oleh PLC/Equipment Controller itu sendiri -- WCS tidak menulis logic kontrol mesin.

**Task source (FR-02).** WMS (dan nanti WES) yang menentukan APA yang perlu dikerjakan dan KAPAN prioritasnya. WCS menentukan BAGAIMANA itu dieksekusi (equipment mana, jalur mana, urutan mana) -- WCS tidak membuat keputusan bisnis seperti prioritas order atau alokasi inventory.

**ERP Integration (FR-13) *(Usulan, Revisi 2026-10-05)*.** ERP menentukan APA yang perlu diproduksi (Planning Produksi per shift) dan APA yang perlu dikirim (Order Delivery) -- ini keputusan bisnis murni, sama seperti WMS menentukan task. WCS **hanya menerima dan menyimpan** data ini (`ProductionPlan`, `CustomerOrder`) sebagai basis pemicu alur Production Line (FR-14) dan Delivery (FR-16) -- WCS tidak membuat keputusan planning produksi atau prioritas order sendiri, persis seperti batasan WCS terhadap WMS di atas. WCS juga bukan source of truth untuk data planning/order ini -- ERP tetap sumbernya, WCS cuma operational view untuk kebutuhan eksekusi.

## Kepemilikan master data

WMS adalah **source of truth** untuk data inventory bisnis (stok, SKU, lokasi gudang dari sisi perencanaan). WCS menyimpan **operational inventory view** -- salinan kerja yang dipakai untuk eksekusi real-time, hasil sinkronisasi dari WMS plus update dari hasil eksekusi task WCS sendiri (FR-01). WCS **tidak boleh** jadi source of truth inventory; kalau ditemukan selisih data antara WMS dan WCS, WCS wajib memberi notifikasi (FR-01), bukan menimpa data WMS.

Master data yang murni milik WCS (tidak dimiliki WMS): Node, Edge, Route, Equipment, Robot, Station -- ini data operasional eksekusi yang tidak relevan buat WMS.

## Batas keselamatan

PRD menegaskan (Section 10): **"Perintah yang berkaitan dengan keselamatan tetap harus ditangani oleh sistem safety dan kontrol yang sesuai. WCS tidak menggantikan fungsi sistem safety."**

Ini berarti:

- WCS **tidak boleh** jadi satu-satunya lapisan yang mencegah tabrakan, cedera, atau kerusakan alat. Safety interlock, emergency stop, light curtain, collision avoidance tetap jadi tanggung jawab sistem safety dedicated (safety PLC, safety relay pada equipment, atau built-in safety system pada robot/RCS) -- lihat baris terakhir matrix tanggung jawab di atas.
- WCS boleh **menampilkan** status alarm/safety event (via Event & Alarm module, FR-08) untuk visibilitas operator, tapi **tidak mengeksekusi** keputusan safety-critical (mis. WCS tidak boleh jadi satu-satunya pemicu emergency stop fisik).
- Command yang dikirim WCS ke equipment/robot (lewat Adapter atau ke RCS) **diasumsikan sudah divalidasi ulang** oleh safety layer di sisi penerima sebelum dieksekusi -- WCS tidak bisa menjamin command-nya selalu aman tanpa validasi independen di level equipment/robot.
- Kegagalan atau downtime WCS **tidak boleh** menyebabkan kondisi unsafe (mis. robot tidak berhenti saat komunikasi putus). Fail-safe behavior (default stop, bukan default continue) ada di tanggung jawab RCS/PLC/equipment, bukan WCS.

## Area abu-abu yang perlu dikonfirmasi lebih lanjut

Beberapa batas di atas masih berasumsi dan perlu dikonfirmasi sebelum implementasi, supaya tidak jadi gap atau tumpang tindih di lapangan:

1. **Battery/charging management AMR** *(Catatan 2026-10-19: PUDU mengirim level baterai lewat `notifyRobotPower` dan WCS bisa memerintahkan `OneKeyRechargeV2`, jadi data dan perintahnya tersedia di WCS. Siapa yang memutuskan tetap belum disepakati.)* -- apakah keputusan "robot perlu charging, jangan di-assign task baru" diambil WCS (karena WCS yang assign task) atau murni RCS (karena RCS yang tahu battery level real-time)? PRD belum eksplisit soal ini.
2. **Task retry setelah RCS/robot gagal** -- saat RCS melaporkan robot gagal menjalankan mission (FAILED), apakah WCS otomatis retry ke robot lain, atau RCS yang reassign ke robot lain di fleet-nya dulu sebelum lapor gagal ke WCS? Ini menentukan di layer mana retry logic hidup.
3. **Multi-vendor AMR berjalan bersamaan di zona sama** *(Keputusan sementara 2026-10-19 untuk pilot PUDU: callback "traffic control area" dari PUDU selalu dijawab ALLOW oleh WCS -- WCS belum mengambil keputusan right-of-way. Pertanyaan multi-vendor di bawah tetap terbuka.)* -- kalau nanti ada lebih dari satu vendor RCS aktif di satu warehouse (sesuai konteks multi-vendor di awal), siapa yang mengatur traffic/right-of-way antar robot beda vendor di jalur yang sama? Kemungkinan perlu WCS sebagai koordinator zona-level, tapi detail protokolnya belum ada di PRD.
4. **Toleransi staleness operational inventory view** -- berapa lama selisih data WMS-WCS ditoleransi sebelum dianggap discrepancy yang perlu notifikasi (real-time, per-task, atau interval tertentu)? Perlu masuk ke NFR.
5. **Konflik safety vs throughput** -- kalau safety system memaksa robot berhenti di tengah jalur sibuk, siapa yang bertanggung jawab re-route task lain di sekitar titik itu: WCS (re-planning task-level) atau RCS (re-routing robot-level)? Perlu disepakati supaya tidak terjadi deadlock operasional.
6. **[Baru, Revisi 2026-10-05] Batas WCS vs ERP soal update stock finish good (FR-15, UC-15).** PRD menyebut "Stock = Inbound - Outbound" dihitung WCS dari hasil eksekusi Packaging/Delivery. Apakah angka stock ini juga perlu dikirim balik ke ERP (supaya ERP yang jadi source of truth akhir untuk business reporting), atau cukup berhenti di operational view WCS seperti pola WMS? Belum eksplisit di PRD v0.2.
7. **[Baru, Revisi 2026-10-05] Siapa yang memvalidasi kapasitas/jadwal sebelum Operator Delivery mulai proses delivery (UC-16)** -- apakah WCS cukup percaya Order Delivery dari ERP sudah valid (barang pasti tersedia di Warehouse Finish Good), atau WCS perlu cek ketersediaan dulu sebelum memanggil robot? Kalau barang belum siap, siapa yang bertanggung jawab menahan proses: WCS atau Operator Delivery secara manual?
8. **[Baru, Revisi 2026-10-05] Boundary antara 4 Interface Operator baru dan Warehouse Operator existing** -- apakah keempatnya (Produksi, Warehouse, Box/Packaging, Delivery) benar-benar independen satu sama lain, atau ada kasus di mana satu orang memegang lebih dari satu interface sekaligus (warehouse kecil dengan staff terbatas)? Berpengaruh ke keputusan RBAC di RBAC.md Section 4.
