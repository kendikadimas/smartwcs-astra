# Architecture Decision Record (ADR)

## Smart WCS Platform — Phase 0 (Simple Scope)

> **Revisi 2026-10-05 -- dua keputusan besar direvisi di dokumen ini:**
> 1. **Scope meluas dari warehouse-only menjadi end-to-end order-to-delivery** (lihat Section 1.1) -- temuan dari diagram arsitektur operasional (referensi: `Draft_WCS.pptx`) yang menunjukkan alur mulai dari *planning produksi/Order Delivery di ERP*, lewat *production line* dan *packaging*, sampai *delivery ke customer*, bukan cuma task dispatching di dalam gudang.
> 2. **Tech stack backend berpindah dari Spring Boot (Java) ke Next.js full-stack (Node.js/TypeScript)** (lihat Section 2 dan 3) -- menyelaraskan dengan implementasi yang sudah berjalan di tim (referensi arsitektur yang sama memakai Next.js untuk Middleware/WCS).
>
> Kedua perubahan ini **belum dikonfirmasi formal oleh PRD** (PRD v0.1 masih versi lama, sudah diduplikasi+direvisi jadi PRD v0.2) -- status *Proposed*, menunggu review tim Astra/Winteq. Bagian yang terdampak ditandai **[Revisi 2026-10-05]**.
>
> **Revisi 2026-10-06 -- versi dependency di-update.** Versi yang ditulis di
> revisi 2026-10-05 (Next.js 14+, Node.js 20 LTS) sudah ketinggalan/EOL per
> hari ini. Section 2 dan 3 di-update ke versi aktif per pengecekan 6 Oktober
> 2026. Bagian yang terdampak ditandai **[Revisi 2026-10-06]**.

## 1. Context

Smart WCS Platform dibangun sebagai execution and control platform yang vendor-neutral untuk Smart Warehouse, mengacu pada PRD v0.1 (23 September 2026) dan reference model ISA-95/IEC 62264. ADR ini mencakup keputusan tech stack untuk Phase 0-3, dengan target arsitektur kategori **Simple**: WMS mengirim task langsung ke WCS tanpa layer WES.

Project ini masuk kategori Simple berdasarkan kriteria kuantitatif PRD:

| Kriteria | Threshold Simple |
| --- | --- |
| Jenis equipment | ≤ 3 |
| Jumlah zone | ≤ 3 |
| Task aktif bersamaan | ≤ 20 |
| Jumlah robot/AMR | ≤ 5 |
| Scheduling & batching | Tidak perlu |

Konsekuensinya: belum perlu scheduling dinamis, batching, atau pembagian beban antar equipment -- WCS Core cukup berupa modular monolith, bukan microservices.

Catatan skala: platform ini ditujukan untuk perusahaan besar dengan AMR dan RCS dari beberapa merek (multi-vendor). Walau volume task/equipment saat ini masih di rentang Simple, arsitektur integrasi equipment (Adapter layer) harus dirancang robust sejak awal agar menampung multi-vendor tanpa mengubah WCS Core, sesuai prinsip Vendor-Neutral (Section 3 PRD).

### 1.1 Perluasan scope: end-to-end order-to-delivery [Revisi 2026-10-05] [Usulan]

Referensi arsitektur operasional (`Draft_WCS.pptx`) menunjukkan bahwa scope platform sebenarnya tidak berhenti di "WMS kirim task -> WCS eksekusi di gudang", tapi mencakup seluruh alur dari permintaan produksi/order customer sampai barang terkirim. Empat area baru yang perlu masuk functional boundary:

| Area baru | Deskripsi singkat | Aktor | Status PRD |
| --- | --- | --- | --- |
| **Integrasi ERP langsung** | WCS menerima *Planning Produksi per shift* (tipe, qty, line) dan *Order Delivery* (waktu, tipe, qty dari customer) langsung dari ERP lewat API (`Get Method`), dipakai untuk sinkronisasi stock dan basis perhitungan kebutuhan material | ERP | Belum ada FR; diusulkan **FR-13 ERP Integration** |
| **Production Line Interface** | Operator produksi request raw material (tipe/qty/line) ke warehouse lewat WCS, lalu di akhir siklus produksi request *prepare part finish good* dan *calling AMR* untuk pick-drop finish good ke warehouse | Operator Produksi | Belum ada FR; diusulkan **FR-14 Production Line Interface** |
| **Packaging/Box Interface** | Interface operator box/packaging terpisah -- request box packaging, status box kosong -- sebelum barang masuk outbound | Operator Box/Packaging | Belum ada FR; diusulkan **FR-15 Packaging Interface** |
| **Delivery-to-Customer** | Outbound tidak berhenti di warehouse finish good; ada interface operator delivery yang calling robot untuk proses pengiriman ke customer, dipicu dari Order Delivery ERP | Operator Delivery, Customer (penerima) | Belum ada FR; diusulkan **FR-16 Delivery-to-Customer Interface** |

Implikasi arsitektur (detail diagram ada di `ARCHITECTURE.md` Section 1):
- **WCS (disebut "Middleware" di diagram referensi) jadi orchestrator tengah**, duduk di antara ERP (hulu: demand/planning) dan RMS/RCS (hilir: eksekusi robot) -- bukan cuma modul warehouse yang menerima task dari WMS.
- Empat "Interface Operator" baru (Produksi, Warehouse, Box/Packaging, Delivery) semuanya dihosting di WCS/Middleware yang sama, dengan pola yang konsisten dengan Task API source-agnostic yang sudah diputuskan (Section 8.1): masing-masing jadi *task source* baru, bukan subsistem terpisah.
- **PRD v0.1 belum merefleksikan scope ini** -- FR-13 s/d FR-16 di atas adalah usulan engineering yang perlu dikonfirmasi dan diformalkan ke PRD oleh Astra/Winteq sebelum masuk Phase 1 implementasi. Sampai dikonfirmasi, ERD (`ERD.md`) dan API Specification (`API_SPECIFICATION.md`) mencantumkan entity/endpoint terkait dengan tanda **[Usulan -- scope baru]**.

## 2. Decision summary

> **[Revisi 2026-10-06] Versi dependency di-update** -- versi yang ditulis di
> revisi 2026-10-05 (Next.js 14+, Node.js 20 LTS) sudah EOL/ketinggalan per
> hari ini. Tabel di bawah pakai versi yang aktif per pengecekan 6 Oktober
> 2026 (npm registry + endoflife.date, lihat catatan sumber di akhir Section
> 3). Pin versi ini di `package.json` saat setup skeleton -- jangan asumsikan
> "terbaru" akan selalu benar; cek ulang kalau sudah lama sejak tanggal ini.

| Layer | Pilihan | Status |
| --- | --- | --- |
| Backend / WCS Core | ~~Spring Boot 3.3.4 (Java 21 LTS)~~ -> **Next.js 16 (LTS), custom Node server** | **Revised 2026-10-06** -- Next.js 14 EOL, 15 mendekati EOL, 16 adalah LTS aktif |
| Runtime | ~~Node.js 20 LTS~~ -> **Node.js 24 LTS** | **Revised 2026-10-06** -- Node 24 Active LTS saat ini (masuk maintenance 20 Okt 2026); **Node 26 jadi Active LTS 28 Okt 2026** -- rencanakan upgrade segera setelah itu |
| Bahasa | ~~Java 21~~ -> **TypeScript** (frontend dan backend satu bahasa) | Revised 2026-10-05 -- compiler TypeScript 7.x (native/Go port) sudah stabil per Okt 2026, evaluasi migrasi kalau tooling tim sudah siap |
| Database | ~~PostgreSQL (versi belum dipin)~~ -> **PostgreSQL 18** | **Revised 2026-10-06** -- versi stabil terbaru; PostgreSQL 19 masih beta, jangan pakai untuk production dulu |
| ORM / data access | ~~Spring Data JPA~~ -> **Prisma ORM 7.x** (Rust-free client) | **Revised 2026-10-06** -- Prisma 8 masih RC, tunggu stabil sebelum upgrade |
| Real-time channel | ~~Spring WebSocket + STOMP~~ -> **Socket.IO 4.8.x (atau `ws`) di atas custom Node server** | Revised 2026-10-06 -- lihat risiko di Section 5 |
| Equipment/IoT messaging | MQTT (Eclipse Mosquitto broker) | Decided (broker tidak berubah) |
| MQTT client library | ~~Eclipse Paho / Spring Integration MQTT~~ -> **mqtt.js 5.x** | Revised 2026-10-06 |
| PLC integration | ~~Eclipse Milo (OPC UA)~~ -> **node-opcua 2.179.x (OPC UA)** | Revised 2026-10-06 -- Proposed, perlu PoC (lihat Section 5) |
| API spec | REST + OpenAPI 3.0 (~~springdoc-openapi~~ -> **zod-to-openapi / next-swagger-doc**, pakai Zod 4.x) | Revised 2026-10-05 -- kontrak REST+OpenAPI 3.0 tidak berubah, hanya tooling generate spec |
| Auth | ~~Spring Security + JWT~~ -> **Auth.js v5 (`next-auth@beta`, App Router-native) / middleware JWT custom (`jose`)** | **Revised 2026-10-06** -- Auth.js v5 masih berstatus beta (5.0.0-beta.x) per Okt 2026 meski sudah dipakai luas di App Router; kalau butuh stabilitas penuh, pakai jalur JWT custom (`jose`) sebagai fallback, bukan `next-auth@4` yang didesain untuk Pages Router |
| Containerization | Docker + Docker Compose | Decided (tidak berubah) |
| Frontend dashboard | ~~React + Vite + TanStack Query~~ -> **Next.js (App Router) + TanStack Query v5, satu codebase dengan backend** | Revised 2026-10-05/06 |
| AMR interoperability standard | VDA5050 (opsional per vendor) | Decided sebagai standar acuan; PRD Section 13 menyebut VDA 5050 "jika diperlukan". Pudu T600 native, T300 belum terverifikasi (lihat Section 3 dan 5). **[Revisi 2026-10-19]** Pilot T600 diintegrasikan lewat PUDU Open Platform Cloud API (proprietary), bukan VDA5050 -- lihat Section 7.1 |

## 3. Justifikasi per layer

**Backend -- Next.js full-stack (Node.js/TypeScript) [Revisi 2026-10-05].** Menggantikan Spring Boot. Alasan utama: (1) menyelaraskan dengan implementasi yang sudah berjalan di tim -- referensi arsitektur operasional (`Draft_WCS.pptx`) menunjukkan Middleware/WCS sudah dibangun di atas Next.js; (2) scope yang meluas (Section 1.1) menambah banyak interface operator (Produksi, Warehouse, Box/Packaging, Delivery) yang masing-masing butuh UI -- satu bahasa (TypeScript) untuk API dan dashboard mempercepat iterasi dan mengurangi context-switch tim; (3) Next.js API routes + React Server Components membuat backend dan frontend jadi satu codebase/deployment, cocok untuk tim kecil yang perlu bergerak cepat di banyak modul sekaligus. **Trade-off yang disadari:** kehilangan ekosistem enterprise Java yang matang (Spring Security, Spring Batch, battle-tested di sistem skala besar) yang jadi alasan utama pemilihan Spring Boot sebelumnya -- lihat risiko di Section 5.

**Database -- PostgreSQL.** Tidak berubah. Data model PRD (Section 9) sudah terstruktur jelas ke 4 kelompok: Master, Transaction, Event, Security -- cocok untuk relational schema. Dukungan JSONB menampung field semi-terstruktur seperti `taskDetail` atau payload event tanpa migrasi skema berulang. ACID transaction penting untuk Data Integrity (NFR) -- mencegah task diproses dua kali.

**ORM -- Prisma [Revisi 2026-10-05].** Menggantikan Spring Data JPA. Prisma adalah ORM TypeScript paling matang untuk ekosistem Next.js, dengan migration tool (`prisma migrate`) yang setara fungsinya dengan Flyway/Liquibase yang biasa dipakai di proyek Spring Boot -- jadi pola migrasi versi-terkontrol (ADR Section 6 menyebut "V1 migration") tetap bisa dipertahankan.

**Real-time channel -- Socket.IO/`ws` di atas custom Node server [Revisi 2026-10-05].** NFR Performance eksplisit meminta mekanisme event seperti WebSocket, bukan polling terus-menerus (status task, equipment, alarm) ke Dashboard (FR-09) -- prinsip ini tidak berubah. Next.js App Router default (deployment serverless/edge) **tidak mendukung koneksi WebSocket yang hidup lama**, jadi WCS harus dijalankan dalam mode **custom Node server** (`server.ts` yang membungkus Next.js + Socket.IO/`ws`), bukan serverless murni. Ini konsisten dengan topologi deployment on-premise/LAN-first yang sudah diputuskan (Section 7) -- WCS memang sudah direncanakan self-hosted, jadi custom server tidak menambah batasan baru.

**Equipment/IoT messaging -- MQTT (Eclipse Mosquitto).** Tidak berubah. Sesuai FR-07 sebagai salah satu mekanisme wajib untuk telemetry dan event dari equipment/IoT. Mosquitto ringan, open-source, dan cukup untuk beban Simple (≤ 3 jenis equipment). Client library berpindah ke **mqtt.js** (ekuivalen Node.js dari Eclipse Paho).

**PLC integration -- node-opcua (OPC UA) [Revisi 2026-10-05 -- Proposed, perlu PoC].** FR-07 menetapkan OPC UA sebagai interface utama jika tersedia -- requirement ini tidak berubah. Sebelumnya Eclipse Milo dipilih secara eksplisit *karena* lebih established di ekosistem JVM dibanding node-opcua (lihat Section 4 versi sebelumnya). Dengan backend pindah ke Node.js, mempertahankan Eclipse Milo berarti menjalankan JVM terpisah hanya untuk satu adapter -- memecah stack. Keputusan ini tetap **ditandai Proposed, bukan Decided**, karena membalik alasan teknis sebelumnya: node-opcua aktif dikembangkan dan dipakai di banyak proyek industrial automation Node.js, tapi kematangannya di bawah Milo. Mitigasi: (a) Adapter Framework (Section 3 di bawah) mengisolasi library ini di belakang kontrak `ExecutionAdapter` yang protocol-agnostic -- kalau PoC gagal, gantinya tidak mengubah WCS Core; (b) opsi cadangan adalah microservice Java kecil khusus OPC UA (pakai Milo) yang dipanggil WCS lewat REST/gRPC internal, dipertahankan sebagai fallback bila PoC node-opcua di Phase 2/4 tidak memenuhi kebutuhan PLC Astra/Winteq.

**API spec -- REST + OpenAPI 3.0.** Kontrak tidak berubah (API-First, Section 3 PRD) -- yang berubah hanya tooling generate spec dari kode: `zod-to-openapi` atau `next-swagger-doc` menggantikan `springdoc-openapi`. OpenAPI tetap jadi sumber kebenaran untuk dokumentasi dan contract testing integrasi WMS/ERP <-> WCS.

**Auth -- Auth.js (NextAuth)/JWT custom [Revisi 2026-10-05].** Memenuhi FR-11 (hak akses berdasarkan role, authentication untuk API) dengan pendekatan stateless yang mudah diskalakan -- requirement tidak berubah, implementasi pindah dari Spring Security ke Auth.js atau middleware JWT custom berbasis `jose` di Next.js.

**Containerization -- Docker + Docker Compose.** Tidak berubah. Cukup untuk beban Simple; Kubernetes ditunda karena menambah kompleksitas operasional yang tidak sepadan dengan skala (≤ 20 task bersamaan, ≤ 5 robot).

**Frontend dashboard -- Next.js (App Router) + TanStack Query [Revisi 2026-10-05].** Menggantikan React + Vite terpisah. Karena backend sudah Next.js, dashboard jadi bagian dari aplikasi yang sama (bukan deployment terpisah) -- tetap mendukung Dashboard & KPI Requirements (Section 12) dengan subscription real-time (Socket.IO/`ws`) dan TanStack Query untuk data-fetching/caching di sisi client.

**Catatan versi [Revisi 2026-10-06].** Versi dependency di Section 2 dicek
ulang per 6 Oktober 2026 lewat npm registry dan endoflife.date -- jangan
anggap angka ini berlaku selamanya:
- Next.js 14 sudah EOL, Next.js 15 masuk status "Warning" (mendekati EOL),
  Next.js 16 adalah LTS aktif sekarang -> dipakai sebagai target.
- Node.js 24 adalah Active LTS saat ini, tapi masuk maintenance 20 Oktober
  2026; Node.js 26 naik jadi Active LTS 28 Oktober 2026. Kalau implementasi
  mulai setelah tanggal itu, evaluasi langsung ke Node 26 LTS.
- PostgreSQL 18 adalah versi stabil terbaru; PostgreSQL 19 masih beta
  (Beta 4 per pengecekan ini), jangan dipakai untuk production.
- Prisma ORM 7.x adalah versi stabil (Rust-free client jadi default sejak
  v7); Prisma 8 masih rilis candidate.
- Auth.js v5 (`next-auth@beta`, versi `5.0.0-beta.x`) adalah jalur yang
  didesain untuk App Router, tapi **masih berstatus beta** meski sudah lama
  dipakai luas di ekosistem Next.js -- kalau tim butuh sesuatu yang
  "stable" secara formal, jalur JWT custom pakai `jose` (sudah disebut
  sebagai opsi di Section 2) lebih aman daripada menunggu Auth.js v5 GA
  atau mundur ke `next-auth@4` (didesain untuk Pages Router, bukan App
  Router).
- TanStack Query v5, mqtt.js 5.x, node-opcua 2.179.x, Socket.IO 4.8.x --
  semuanya versi stabil terbaru per pengecekan ini, tidak ada status beta/RC.

**Equipment Integration -- Adapter Framework multi-vendor.** Karena AMR/RCS berasal dari beberapa merek, Adapter bukan sekadar satu kelas per vendor, melainkan framework dengan kontrak interface baku (register, status, mission command, event; signature lengkap, capability, pemetaan error, dan checklist konformansi ada di `ADAPTER_CONTRACT.md`), diimplementasikan sebagai satu modul TypeScript per vendor di `src/modules/equipment-adapter/<vendor>` yang mengimplementasikan interface adapter dan didaftarkan ke registry adapter saat server start [Revisi 2026-10-19, menggantikan pola Spring bean] -- vendor baru tinggal menambah implementasi tanpa mengubah WCS Core. Untuk interoperabilitas AMR lintas-vendor, standar acuan yang dipakai adalah VDA5050 bila vendor mendukungnya (PRD Section 13 menyebut VDA 5050 "jika diperlukan" pada fase AMR/RCS integration; PRD Section 10 mendefinisikan WCS-RCS sebagai "vendor API", jadi VDA5050 bukan syarat wajib).

**[Revisi 2026-10-19] Vendor pilot: PUDU T600, diintegrasikan lewat PUDU Open Platform Cloud API.** Keputusan tim: model pilot T600, dan jalur integrasinya Open API (command) + Callback Notification (event) di PUDU Cloud, bukan VDA5050. Detail integrasi, autentikasi HMAC, dan pemetaan field ada di `PUDU_INTEGRATION.md`; dampaknya ke prinsip LAN-first dicatat di Section 7.1. Paragraf di bawah dipertahankan sebagai latar belakang keputusan.

**Vendor pilot untuk testing: Pudu (lini industrial) -- model final (T300 vs T600) masih dikonfirmasi.** *(Latar belakang, sudah diputuskan: T600.)* AMR yang dipakai untuk uji coba Phase 2 adalah Pudu lini industrial, bukan satu-satunya vendor yang akan didukung WCS selamanya -- ini vendor pertama untuk memvalidasi Adapter Framework sebelum dibuka ke merek lain (multi-vendor adalah tujuan akhir, sesuai prinsip Vendor-Neutral Section 3 PRD). T600 secara eksplisit mendukung VDA5050 native; dukungan VDA5050 pada T300 belum terverifikasi di spec resmi manapun yang ditemukan -- kemungkinan integrasinya lewat API proprietary PUDU Scheduler. Dua-duanya tetap konsisten dengan arsitektur: Adapter Framework menyediakan kontrak interface baku (register, status, mission command, event) di level WCS Core, jadi baik lewat VDA5050 standar maupun API proprietary Pudu, implementasinya tetap berupa satu adapter tambahan tanpa mengubah WCS Core -- dan adapter Pudu ini jadi blueprint, bukan batasan, untuk adapter vendor berikutnya. Catatan lain: unit yang dipakai pilot harus dari lini industrial, bukan lini PUDU Open Platform untuk robot service/hospitality (delivery, cleaning) yang komunikasinya wajib lewat Pudu Cloud -- pastikan ini dipastikan sebelum implementasi adapter dimulai.

## 4. Alternatif yang dipertimbangkan

| Layer | Alternatif | Alasan tidak dipilih |
| --- | --- | --- |
| Backend **[Revisi 2026-10-05]** | Spring Boot (Java) -- pilihan sebelumnya | Konsistensi dengan standar Java internal Astra/Winteq dan ekosistem enterprise yang matang (Spring Security/Data/Integration) tetap jadi nilai plus, tapi tidak sejalan dengan implementasi Next.js yang sudah berjalan di tim dan kebutuhan iterasi cepat di banyak interface operator baru (Section 1.1). Risiko trade-off ini dicatat eksplisit di Section 5, bukan diabaikan |
| Backend | Node.js (NestJS) | Pola arsitektur (modul, dependency injection) mirip Spring Boot dan cukup established, tapi Next.js dipilih karena sekaligus menyatukan frontend dashboard dalam satu codebase/deployment -- NestJS tetap backend-only, perlu app Next.js terpisah untuk dashboard |
| OPC UA library **[Revisi 2026-10-05]** | Eclipse Milo -- pilihan sebelumnya | Lebih established di ekosistem JVM/industrial automation, tapi mempertahankannya berarti menjalankan JVM terpisah di luar stack Node.js utama. Jadi opsi cadangan (microservice Java khusus OPC UA), bukan pilihan utama -- lihat Section 3 dan 5 |
| Database | MongoDB | Data model PRD relational dan butuh strong consistency antar Task/Assignment/MaterialMovement; NoSQL menambah kompleksitas join di aplikasi |
| Equipment messaging | Kafka | Throughput tinggi tidak dibutuhkan di skala ≤ 20 task bersamaan; operasional Kafka lebih berat dibanding MQTT broker |
| Containerization | Kubernetes | Menambah kompleksitas operasional yang tidak sepadan dengan beban Simple; dipertimbangkan ulang saat naik ke Complex |
| Frontend | Vue.js / Nuxt | Sama-sama valid, tapi Next.js dipilih karena ekosistem component library dashboard lebih luas dan selaras dengan keputusan backend (satu bahasa, satu codebase) |

## 5. Consequences & risiko

**Risiko baru dari perpindahan ke Next.js full-stack [Revisi 2026-10-05]:**

- **OPC UA/PLC jadi titik risiko teknis tertinggi dari perubahan ini.** `node-opcua` kurang matang dibanding Eclipse Milo untuk industrial automation (ini sebelumnya jadi alasan eksplisit *memilih* Milo). FR-07 (PLC integration) wajib di-PoC lebih awal (disarankan mulai Phase 2, bukan menunggu Phase 4) sebelum commit penuh -- kalau PoC gagal memenuhi kebutuhan PLC Astra/Winteq, fallback-nya microservice Java kecil khusus OPC UA (Section 3), yang berarti stack jadi polyglot (Node.js + satu service Java), bukan Node.js murni seperti yang diasumsikan Section 2.
- **WebSocket real-time butuh custom Node server**, bukan Next.js App Router default -- tim perlu memastikan pola deployment (Docker image yang menjalankan `server.ts`, bukan `next start` biasa) didokumentasikan dengan jelas supaya tidak box-standard Next.js deployment (mis. Vercel-style serverless) yang tidak mendukung WS persisten.
- **[Baru, Revisi 2026-10-06] Auth.js v5 masih beta.** Kalau dipakai untuk auth production, tim harus terima risiko breaking change sebelum GA, atau pakai fallback JWT custom (`jose`) dari awal -- lihat catatan versi di Section 3. Keputusan ini perlu diambil eksplisit sebelum implementasi FR-11, bukan default ke Auth.js tanpa diskusi.
- **[Baru, Revisi 2026-10-06] Transisi Node.js LTS di tengah jadwal implementasi.** Node 24 masuk maintenance 20 Oktober 2026 dan Node 26 jadi Active LTS 28 Oktober 2026 -- kalau Phase 1 (Week 3-7, lihat Section 13 roadmap PRD) berjalan melewati tanggal itu, tim perlu putuskan apakah mulai di Node 24 lalu upgrade ke 26, atau langsung mulai di Node 26 kalau timeline-nya memungkinkan.
- **Tim perlu familiar TypeScript/Node full-stack** -- ini membalik risiko sebelumnya (yang menyebut tim sudah established di Java). Astra/Winteq perlu mengonfirmasi kesiapan tim maintenance jangka panjang di stack baru ini; kalau belum, alokasikan waktu ramp-up sebelum Phase 1.
- **Kehilangan sebagian ekosistem enterprise Java** (Spring Security battle-tested, Spring Batch untuk job terjadwal, dsb) -- fungsi setara di Next.js (Auth.js, job scheduler seperti `node-cron`/`BullMQ`) harus dievaluasi per kasus, tidak otomatis drop-in replacement.
- **Prisma migration** perlu strategi versi-terkontrol yang setara dengan pola Flyway/JPA sebelumnya (lihat catatan "V1 migration" di Section 6) -- pastikan `prisma migrate` dipakai konsisten sejak awal Phase 1, bukan `db push` langsung ke schema.
- Sisi positif: Node.js startup time jauh lebih cepat (~1-2 detik) dibanding Spring Boot (8-15 detik) -- menguntungkan untuk CI/CD dengan rolling restart yang sering, dan selaras dengan topologi on-premise yang sering restart manual (Section 7).

**Risiko dari perluasan scope end-to-end [Revisi 2026-10-05, lihat Section 1.1]:**

- FR-13 s/d FR-16 (ERP Integration, Production Line, Packaging, Delivery-to-Customer) masih berstatus usulan -- implementasi tidak boleh mulai sebelum dikonfirmasi dan diformalkan ke PRD oleh Astra/Winteq, supaya tidak membangun di atas asumsi yang salah.
- Empat Interface Operator baru menambah permukaan API dan kebutuhan RBAC baru (role operator produksi, box/packaging, delivery belum ada di 5 Role tetap di `ERD.md` Section Security Data) -- perlu keputusan apakah ini role baru atau sub-permission dari role yang sudah ada.
- Integrasi ERP langsung (bukan lewat WMS) berarti WCS punya dua jalur masuk demand (WMS untuk task warehouse, ERP untuk planning produksi/order delivery) -- functional boundary soal siapa source of truth untuk apa (terutama stock/inventory) perlu diperjelas supaya tidak terjadi konflik data antara sinkronisasi WMS dan sinkronisasi ERP.

**Risiko yang sudah ada sebelumnya (tidak berubah):**

- Modular monolith mempercepat development awal, tapi perlu disiplin modul (bounded context per domain: Task, Equipment, Event) agar tidak jadi "big ball of mud" saat scope bertambah -- makin relevan sekarang karena scope bertambah empat area baru (Section 1.1).
- Keputusan ini perlu direvisit saat project naik kategori ke Intermediate/Complex (lihat PRD Section 5.2) -- indikasinya: jenis equipment > 3, task aktif bersamaan > 20, atau butuh scheduling dinamis. Saat itu, backend kemungkinan perlu dipecah per domain (mis. Task Service, Dispatch Service terpisah) dan Kubernetes dipertimbangkan ulang.
- MQTT broker tunggal (Mosquitto) jadi single point of failure untuk telemetry -- perlu strategi HA (mis. clustering) sebelum masuk production jika uptime equipment kritikal.
- Multi-vendor AMR/RCS menambah kompleksitas testing dan sertifikasi tiap adapter baru -- perlu adapter conformance checklist dan staging environment per vendor sebelum go-live.
- **[Revisi 2026-10-19]** Model pilot sudah diputuskan T600, dan adapter pilot dibangun di atas PUDU Open Platform Cloud API (proprietary), bukan VDA5050. Adapter vendor berikutnya tetap bisa pakai VDA5050 standar -- PUDU jadi kasus khusus, bukan acuan default untuk semua vendor.
- **[Baru, Revisi 2026-10-19] Ketergantungan internet untuk kontrol robot pilot.** PUDU Cloud API berjalan lewat internet (Section 7.1). Kalau internet warehouse putus, WCS tidak bisa mengirim perintah ke robot PUDU dan tidak menerima callback; operasi WCS lain (task dari WMS, dashboard, alarm equipment lain) tetap berjalan. Mitigasi jangka panjang: evaluasi PUDU Private Cloud API.
- **[Baru, Revisi 2026-10-19] API PUDU tidak menyediakan register robot, list robot, list group, dan on/off robot.** Onboarding robot (sn, model, group) diinput manual oleh admin WCS -- lihat `PUDU_INTEGRATION.md` Section 6.

## 6. Status & next steps

Status: **Draft, dalam revisi besar (2026-10-05)** -- stack backend berpindah ke Next.js full-stack dan scope meluas end-to-end (Section 1.1); dua-duanya **Proposed**, menunggu konfirmasi formal dari tim Astra/Winteq sebelum Phase 1 lanjut.

- [ ] Review stack oleh tim engineering
- [ ] **[Baru]** Konfirmasi ke tim Astra/Winteq: pindah ke Next.js (Node.js/TypeScript) full-stack menggantikan Spring Boot -- apakah sejalan dengan standar teknologi internal dan kesiapan tim maintenance jangka panjang
- [ ] **[Baru]** PoC `node-opcua` untuk FR-07 (PLC integration) -- validasi sebelum Phase 2; siapkan fallback microservice Java/Milo kalau PoC gagal (Section 5)
- [ ] **[Baru]** Validasi pola custom Node server untuk WebSocket real-time (Socket.IO/`ws`) di topologi deployment on-premise (Section 7)
- [ ] **[Baru]** Konfirmasi dan formalkan FR-13 s/d FR-16 (ERP Integration, Production Line, Packaging, Delivery-to-Customer, Section 1.1) ke PRD -- termasuk role/RBAC baru untuk Interface Operator Produksi/Box/Delivery
- [x] Draft OpenAPI spec (v0.4.0, 93 endpoint) -- **perlu direvisi ulang** untuk modul ERP Integration, Production Line, Packaging, Delivery (lihat `API_SPECIFICATION.md`)
- [x] Buat ERD dari data model Section 9 PRD -- **perlu entity baru** untuk scope end-to-end (lihat `ERD.md`)
- [x] Setup repo + Docker Compose skeleton (Phase 1, Week 3-7) -- **[2026-10-19] sudah Next.js 16 + custom server + Prisma 7** (`smartwcs-astra`)
- [ ] Review dokumen Phase 0 oleh tim engineering: `ARCHITECTURE.md`, `ADAPTER_CONTRACT.md`, `API_CONVENTIONS.md`, `TASK_STATE_MACHINE.md`, `DATA_DICTIONARY.md`
- [ ] Konfirmasi angka target non-fungsional (`ARCHITECTURE.md` bagian 6) dan kebijakan retry/timeout (`TASK_STATE_MACHINE.md`) dengan Astra/Winteq
- [ ] ~~Konfirmasi ke tim Astra bahwa Java 21 LTS dan Maven sesuai standar internal~~ -- digantikan item Next.js di atas; `backend/pom.xml` perlu diganti skeleton Node.js (`package.json`)
- [x] ~~Konfirmasi model Pudu final (T300 vs T600)~~ -- **[2026-10-19] T600, lewat PUDU Open Platform Cloud API** (Section 3, 7.1)
- [ ] **[Baru]** Ajukan `ApiAppKey`/`ApiAppSecret` dan aktivasi callback ke PUDU; uji healthCheck (`PUDU_INTEGRATION.md` Section 3)
- [ ] **[Baru]** Tanyakan ke PUDU/Winteq ketersediaan PUDU Private Cloud API untuk operasi tanpa internet (Section 7.1)
- [ ] Audit vendor AMR/RCS lain (kalau ada selain Pudu) dan protokol yang didukung

## 7. Deployment topology (on-premise, LAN-first)

Koneksi internet di lokasi warehouse tidak selalu memadai. Keputusan: **WCS Core dan RCS berjalan dalam satu jaringan lokal (LAN) di warehouse**, berkomunikasi lewat API lokal (REST/OPC UA/MQTT internal) -- bukan lewat internet.

- **Operasi inti tidak boleh bergantung pada internet.** Task execution, dispatching, monitoring, dan dashboard operator semuanya harus tetap berjalan penuh walau koneksi internet mati total.
- **Internet hanya dipakai untuk sinkronisasi opsional** ke head office / cloud dashboard (jika ada), menggunakan pola **outbox/queue**: data disimpan di local DB dulu, dikirim saat internet tersedia, dengan retry otomatis saat gagal.
- Semua komponen inti (PostgreSQL, Mosquitto/MQTT broker, WCS Core via Docker Compose) **self-hosted di server lokal warehouse**, bukan layanan cloud pihak ketiga -- stack yang sudah dipilih (Section 2) sudah cocok untuk pola ini tanpa perubahan.
- Dashboard operator diakses dari jaringan lokal warehouse, sehingga tetap bisa dipakai operator meski internet terputus.

### 7.1 Pengecualian: integrasi PUDU Cloud API butuh internet [Revisi 2026-10-19]

Robot pilot PUDU T600 dikendalikan lewat **PUDU Open Platform Cloud API**: perintah WCS dikirim ke server PUDU di internet (`css-open-platform.pudutech.com`), dan event robot dikirim balik PUDU ke URL publik WCS (callback). Ini **pengecualian yang disadari** terhadap prinsip LAN-first di atas, khusus untuk kontrol robot PUDU.

- **Yang bergantung pada internet:** perintah ke robot PUDU (call/delivery/recharge/switch map), status dan posisi robot PUDU, error robot PUDU.
- **Yang tetap berjalan tanpa internet:** penerimaan task dari WMS, master data, dashboard, alarm dan status equipment lain, audit log. Task yang butuh robot PUDU tertahan di status QUEUED/DISPATCHED sampai koneksi pulih; adapter menandai `Integration.status = DISCONNECTED` dan memunculkan alarm.
- **Callback butuh URL publik.** Development memakai Cloudflare quick tunnel (`cloudflared tunnel --url http://localhost:3000`) yang outbound-only, jadi tidak membuka port jaringan internal dan tetap jalan di belakang CGNAT. Produksi memakai named tunnel dengan domain tetap. Hanya endpoint callback PUDU yang diekspos, dan setiap request diverifikasi dengan header `CallbackCode`.
- **Rekonsiliasi setelah koneksi pulih:** callback yang hilang selama putus diambil ulang lewat `GetCallList` / `Delivery Task List` / `GetRobotStatusV2`.
- **Arah jangka panjang:** dokumentasi PUDU menyediakan "PUDU Private Cloud API". Kalau bisa dipasang on-premise, opsi ini mengembalikan kontrol robot ke LAN tanpa mengubah WCS Core, karena perbedaannya hanya di adapter (base URL dan autentikasi). Perlu dikonfirmasi ke PUDU/Winteq sebelum go-live produksi.

## 8. Forward-compatibility: evolusi menuju Phase 4-6

MVP (Phase 0-3) sengaja dibatasi scope Simple, tapi platform ini ditujukan untuk dipakai sampai kapabilitas penuh (Phase 6, WES). Supaya lanjut ke phase berikutnya tidak berarti rewrite besar, arsitektur Phase 0-3 dirancang dengan beberapa *extension point* sejak awal.

### 8.1 Peta evolusi per phase

| Phase | Fokus (dari PRD) | Penambahan arsitektur | Yang harus sudah disiapkan sejak Phase 0-3 |
| --- | --- | --- | --- |
| Phase 4 | Equipment Integration (PLC, conveyor) | Adapter baru untuk Modbus TCP / OPC UA non-AMR | Adapter Framework generic per-protokol, bukan AMR-only (Section 3) |
| Phase 5 | Multi-Equipment (AS/RS, sorter, lift, multi-zone) | Adapter tambahan + routing lintas-zone | Data model Zone/Node/Edge (PRD 9.1) dipakai sejak awal, jangan hardcode asumsi 1 zona |
| Phase 6 | WES Capability (scheduling, batching, workload balancing) | Service WES terpisah yang mengirim execution plan ke WCS | Task API bersifat source-agnostic: WMS, WES, manual request diperlakukan sama (PRD FR-02) |

### 8.2 Keputusan desain sekarang yang mencegah rewrite nanti

- **Task API source-agnostic.** Skema Task (PRD 9.5) dan endpoint ingestion dibuat tidak peduli sumbernya WMS atau WES -- supaya saat Phase 6 WES mulai mengirim execution plan, itu cukup "task source baru", bukan perubahan API.
- **Internal event-driven di dalam modular monolith.** Task state transition dan equipment event dipublish lewat event emitter internal (`EventEmitter` Node.js atau event bus kecil di dalam proses `server.ts`), bukan dipanggil langsung antar modul. Ini jadi titik ekstensi alami untuk feedback loop WES nanti, dan memudahkan modul ditarik keluar jadi service terpisah (strangler-fig) kalau beban naik ke Complex.
- **Adapter interface protocol-agnostic**, sudah diputuskan di Section 3/ADR Equipment Integration -- tinggal ditambah implementasi per vendor/protokol baru di Phase 4-5 tanpa ubah WCS Core.
- **Observability dari hari pertama.** Structured logging + metrics dasar (meski masih skala kecil) membuat scaling ke Phase 5-6 (>100 task bersamaan, multi-zone) lebih mudah dipantau tanpa instrumentasi ulang.
- **Modular monolith dengan bounded context jelas** (Task, Dispatch, Equipment/Adapter, Event, Security sebagai modul terpisah di `src/modules/`) -- kalau Complex scale butuh microservices, modul-modul ini sudah punya batas yang jelas untuk diekstrak, bukan "big ball of mud" yang harus dibongkar total.

### 8.3 Yang sengaja TIDAK dikerjakan sekarang

- Microservices split -- ditunda sampai benar-benar dibutuhkan (threshold Complex, PRD 5.2).
- Logic scheduling/batching WES -- cukup disiapkan *extension point*-nya, implementasinya nanti di Phase 6.
- Kubernetes -- Docker Compose cukup untuk skala Simple/Intermediate; dipertimbangkan ulang kalau multi-zone (Phase 5) butuh orkestrasi container lebih kompleks.

## 9. Dokumen turunan

ADR ini mencatat keputusan stack. Detail arsitektur dan kontrak ada di dokumen berikut:

| Dokumen | Isi |
| --- | --- |
| `ARCHITECTURE.md` | Diagram komponen, pemetaan ISA-95, tabel interface, kontrak real-time (STOMP/MQTT), aturan dispatching, target non-fungsional, aturan kapan WES diperlukan |
| `ADAPTER_CONTRACT.md` | Kontrak interface Adapter (FR-05/06/07), capability, pemetaan error, checklist konformansi, blueprint Pudu |
| `API_CONVENTIONS.md` | Autentikasi JWT dan API key, format error, pagination, idempotensi, event keluar ke WMS |
| `TASK_STATE_MACHINE.md` | Transisi status, retry, timeout, failureCode, idempotensi `POST /tasks` |
| `DATA_DICTIONARY.md` | Nilai baku enum dan satuan data |
| `PUDU_INTEGRATION.md` **[Baru 2026-10-19]** | Integrasi PUDU Open Platform Cloud API: base URL, autentikasi HMAC, alur callback, scope T600, pemetaan status dan field ke tabel |

> **[Catatan 2026-10-19]** `ADAPTER_CONTRACT.md`, `API_CONVENTIONS.md`, `TASK_STATE_MACHINE.md`, dan `DATA_DICTIONARY.md` dirujuk di beberapa dokumen tetapi **belum ada di repo ini**. Sampai dokumen itu ditambahkan, jangan mengasumsikan isinya: kontrak API mengacu ke `openapi-smart-wcs.yaml`, status task ke enum `TaskStatus` di OpenAPI, dan data model ke `ERD.md` + `prisma/schema.prisma`.
