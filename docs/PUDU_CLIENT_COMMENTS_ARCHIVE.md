# Arsip Komentar Asli: src/modules/equipment-adapter/pudu/client.ts

Dokumen ini berisi arsip seluruh komentar asli dari file `src/modules/equipment-adapter/pudu/client.ts` sebelum disederhanakan pada 2026-10-23. Catatan teknis, konteks debugging, dan detail verifikasi dokumen resmi dicatat di sini agar sewaktu-waktu dapat dikembalikan jika diperlukan.

---

### 1. Konfigurasi & Tipe Data (`PuduClientConfig`, `PuduEnvelope`, Error Codes)

#### Line 16-17 (`language`):
```ts
/** Header Language -- default Mandarin kalau kosong di sisi PUDU, kirim eksplisit supaya nama toko konsisten (PUDU_INTEGRATION.md bagian 6). */
```

#### Line 20-21 (`fetchImpl`):
```ts
/** Override buat test -- klien tidak boleh pernah memanggil internet sungguhan saat test. */
```

#### Line 28-29 (`PuduApiError.code`):
```ts
/** `message` dari envelope respons PUDU (mis. "CLOUD_OPEN_ROBOT_OFFLINE"), kosong untuk kegagalan transport/HTTP murni. */
```

#### Line 42-47 (`PuduEnvelope`):
```ts
/**
 * PUDU_OFFICIAL_EXCERPT.md bagian A: envelope respons Open API selalu
 * `{ trace_id, message, data }`, `message` = "SUCCESS" kalau sukses, kode
 * error kalau tidak. Beberapa endpoint (mis. CancelCallTask) tidak punya
 * `data` sama sekali -- field itu opsional.
 */
```

#### Line 54-56 (`RETRYABLE_BUSINESS_CODES`):
```ts
// Kode error bisnis yang dianggap transien (worth di-retry) -- sisanya
// (PARAM_ERROR, CLOUD_OPEN_ROBOT_OFFLINE, dst.) adalah kegagalan permanen
// untuk request yang sama, retry tidak akan mengubah hasil.
```

---

### 2. Logika Permintaan Internal (`request()`)

#### Line 67-79 (Path Signing & Resolusi Pathname):
```ts
    // Temuan tambahan Fase D (di luar 2 poin awal task ini): PathAndParameters
    // yang ditandatangani HARUS path LENGKAP sebagaimana gateway PUDU
    // benar-benar menerimanya -- termasuk `/pudu-entry` dari `baseUrl`
    // (PUDU_INTEGRATION.md bagian 3: "path (termasuk /pudu-entry)"). Versi
    // sebelumnya menandatangani `path` relatif SAJA (tanpa bagian path dari
    // `baseUrl`) -- di produksi (`PUDU_BASE_URL` selalu berakhiran
    // `/pudu-entry`) ini akan membuat SEMUA request bertanda tangan salah
    // (401), tapi lolos di semua tes lama karena `baseUrl` tes selalu tanpa
    // path (`http://127.0.0.1:<port>`, lihat `mock-pudu-server.ts`) --
    // bug-nya ketutupan kebetulan. `fullPathname` di bawah SELALU memakai
    // path lengkap hasil gabungan `baseUrl` + `path`, cocok untuk kasus
    // tes (tidak berubah) maupun produksi (sekarang benar).
```

#### Line 81-85 (Encoding Query URL vs Signing String):
```ts
    // Query di URL fetch DIENCODE (encodeURIComponent, lewat
    // buildEncodedQueryString) -- BEDA dari pathAndParameters di atas,
    // yang nilainya MENTAH karena itu yang ditandatangani (jangan disamakan,
    // dan jangan lagi pakai URLSearchParams -- itu menulis spasi sebagai
    // "+", bukan "%20" seperti kode resmi PUDU).
```

#### Line 112-113 (Header Redaction pada Log):
```ts
        // Log tidak pernah menyertakan header (Authorization berisi
        // signature, bukan secret mentah, tapi tetap tidak dilog demi aman).
```

#### Line 126-131 (Error 401 & Header StringToSign Server):
```ts
            // PUDU_OFFICIAL_EXCERPT.md bagian A: "gateway membalas 401 dan
            // menyertakan StringToSign milik server di header respons" --
            // nama header PERSIS tidak disebut dokumen, jadi log semua
            // header respons (tanpa Authorization request kita sendiri,
            // yang berisi signature bukan secret, tapi tetap tidak perlu
            // dilog ulang) untuk debugging manual.
```

#### Line 153-158 (Case-Insensitive Pengecekan Envelope SUCCESS):
```ts
        // Bagian C PUDU_OFFICIAL_EXCERPT.md: contoh respons resmi
        // StoreRobotList memakai "success" huruf kecil, bukan "SUCCESS" --
        // dokumen resmi sendiri tidak konsisten soal huruf besar/kecil.
        // Dibandingkan tidak peka huruf besar/kecil supaya respons sukses
        // asli tidak keliru dianggap error bisnis (ditemukan saat
        // mencocokkan client.ts ke contoh bagian C, di luar 5 poin awal).
```

#### Line 160-163 & 171-180 (Retry Decision untuk Error Bisnis):
```ts
          // Error bisnis (HTTP 2xx tapi message bukan SUCCESS, lihat
          // PUDU_OFFICIAL_EXCERPT.md bagian A) -- retry cuma untuk kode
          // yang dianggap transien, sisanya gagal permanen untuk request
          // yang sama.
```
```ts
          if (!RETRYABLE_BUSINESS_CODES.has(envelope.message)) {
            throw businessErr; // dilempar langsung, TIDAK lewat retry loop
          }
          throw businessErr; // tetap dilempar, tapi ditangkap di bawah dan diretry
```
```ts
        if (err instanceof PuduApiError && err.code && !RETRYABLE_BUSINESS_CODES.has(err.code)) {
          throw err; // error bisnis permanen -- jangan buang waktu retry
        }
```

---

### 3. Komentar pada Masing-Masing Method API

#### `healthCheck()` (Line 192):
```ts
  /** Uji signature pertama kali, sesuai PUDU_OFFICIAL_EXCERPT.md bagian A poin 4. Tidak punya `data` resmi -- dites via `message === "SUCCESS"` saja. */
```

#### `getStoreList()` (Line 197-200):
```ts
  // Field data.list/data.count BELUM diverifikasi dokumen resmi (GetStoreList
  // tidak ada di excerpt) -- dipertahankan dari PUDU_INTEGRATION.md Lampiran
  // #44, cuma dibungkus ulang ke bentuk envelope {trace_id, message, data}
  // yang DIKONFIRMASI resmi (bagian A) untuk semua endpoint Open API.
```

#### `storeRobotList()` (Line 210-211):
```ts
  // Belum diverifikasi dokumen resmi (StoreRobotList tidak ada di excerpt) --
  // field dari PUDU_INTEGRATION.md Lampiran #45, dibungkus envelope.
```

#### `getBoundRobotGroups()` (Line 229-230):
```ts
  // Belum diverifikasi dokumen resmi (GetBoundRobotGroups tidak ada di
  // excerpt) -- field dari PUDU_INTEGRATION.md Lampiran #46, dibungkus envelope.
```

#### `getRobotsInGroup()` (Line 237-238):
```ts
  // Belum diverifikasi dokumen resmi (GetRobotsInGroup tidak ada di excerpt)
  // -- field dari PUDU_INTEGRATION.md Lampiran #47, dibungkus envelope.
```

#### `getRobotStatusV2()` (Line 245):
```ts
  /** Field data.* DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md (GetRobotStatusV2) persis, termasuk charge_type int32 (1=kabel, 2=dock). */
```

#### `initiateCallTask()` (Line 264):
```ts
  /** Field request & data.* DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md (InitiateCallTask). Bentuk payload lengkap (map_name/point_type wajib, dst.) diperbaiki di Fase C. */
```

#### `cancelCallTask()` (Line 285):
```ts
  /** Katalog API #2, CancelCallTask -- DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md. Tidak punya `data`. */
```

#### `completeCallTask()` (Line 290):
```ts
  /** Katalog API #3, CompleteCallTask -- DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md. */
```

#### `getCallList()` (Line 309 & 335-338):
```ts
  /** Katalog API #4, GetCallList -- DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md. Dipakai rekonsiliasi (Fase E). */
```
```ts
        // Array<string> -- PUDU_INTEGRATION.md tidak merinci cara encode query
        // array; dipakai konvensi umum "digabung koma" (dipakai juga untuk
        // nilai array di PathAndParameters signing, bagian A) -- belum
        // diverifikasi dokumen resmi untuk endpoint ini secara spesifik.
```

#### `notifyRobotReportPosition()` (Line 344-352):
```ts
  /**
   * Katalog #29, NotifyRobotReportPosition -- DIKONFIRMASI
   * PUDU_OFFICIAL_EXCERPT.md bagian D. Tanpa ini PUDU tidak akan pernah
   * mengirim callback notifyRobotPose. Body resmi: `{ sn, payload:
   * { interval, times } }` (BUKAN `{ sn, interval, times }` rata seperti
   * versi sebelumnya -- bug ditemukan setelah bagian D didapat). Validasi
   * sebelum kirim (tanpa memanggil jaringan untuk input tidak valid):
   * `interval` bulat >= 1 detik, `times` bulat 1..1000, `sn` tidak kosong.
   */
```

#### `storeMapList()` (Line 368-373):
```ts
  /**
   * Katalog #30, StoreMapList -- data DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md
   * bagian C. `data` diparse `storeMapListDataSchema` (map-schemas.ts) --
   * bentuk yang tidak cocok melempar error jelas (dicatat raw ke log),
   * BUKAN diam-diam menghasilkan list kosong.
   */
```

#### `availableMaps()` (Line 384-388):
```ts
  /**
   * Katalog #31, AvailableMaps -- data DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md
   * bagian C. `is_used` (1 atau 2) disimpan MENTAH oleh pemanggil -- arti
   * persisnya belum dijelaskan dokumen resmi, jangan ditafsirkan di sini.
   */
```

#### `getMapDetailV2()` (Line 397-404):
```ts
  /**
   * Katalog #33, GetMapDetailV2 -- data DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md
   * bagian C (kunci koordinat `vector_list`, BUKAN `vector`). Sumber utama
   * sinkronisasi peta di syncResources() (sync.ts) -- sudah mencakup
   * metadata peta DAN element_list dalam satu panggilan, jadi CurrentMap/
   * GetCurrentMapPoints (di bawah) tidak dipanggil ganda untuk data yang
   * sama di syncResources().
   */
```

#### `currentMap()` (Line 413-421):
```ts
  /**
   * Katalog #32, CurrentMap -- data DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md
   * bagian C (kunci koordinat `vector`, BUKAN `vector_list` -- lihat
   * GetMapDetailV2 di atas, DUA kunci berbeda untuk data yang serupa).
   * Disiapkan sesuai instruksi task, TIDAK dipanggil dari syncResources()
   * (GetMapDetailV2 sudah mencakup element list yang sama/lebih lengkap) --
   * hindari panggilan API ganda untuk data yang sama, keputusan sendiri,
   * dicatat di laporan akhir.
   */
```

#### `getCurrentMapPoints()` (Line 430-436):
```ts
  /**
   * Katalog #35, GetCurrentMapPoints -- data DIKONFIRMASI
   * PUDU_OFFICIAL_EXCERPT.md bagian C (x/y/z eksplisit per titik, beda dari
   * CurrentMap/GetMapDetailV2 yang menaruh koordinat dalam array
   * vector/vector_list). Disiapkan sesuai instruksi task, TIDAK dipanggil
   * dari syncResources() (lihat catatan currentMap()).
   */
```

#### `deliveryTask()` (Line 446-452):
```ts
  // Belum diverifikasi dokumen resmi (DeliveryTask -- API inisiasi -- tidak
  // ada di excerpt; yang ada cuma callback notifyDeliveryTask). Field dari
  // PUDU_INTEGRATION.md Lampiran #5, dibungkus envelope.
  // Field request BELUM diverifikasi dokumen resmi (DeliveryTask -- API
  // inisiasi -- tidak ada halaman API di bagian B, cuma contoh respons di
  // bagian C). Tipe `data.code` DIPERBAIKI ke number (contoh resmi: `0`,
  // bukan string) -- ditemukan saat mencocokkan ke bagian C.
```
