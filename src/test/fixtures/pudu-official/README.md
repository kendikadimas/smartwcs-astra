# Fixture resmi PUDU

Disalin dari `docs/pudu-official/PUDU_OFFICIAL_EXCERPT.md` bagian C
(contoh respons Open API dan payload callback) dan bagian D
(`NotifyRobotReportPosition`), 2026-10-22. Satu file per contoh, nama file
= nama API/callback resmi. Dipakai sebagai data uji (bukan dibuat
sendiri) di test klien dan parser PUDU.

## Pembersihan salah ketik dari teks sumber

Dokumen sumber (hasil scraping situs PUDU) punya beberapa salah ketik yang
dicatat di `PUDU_OFFICIAL_EXCERPT.md` bagian C sendiri. Dibersihkan saat
dijadikan fixture, SELALU tanpa menebak nilai baru (cuma memperbaiki
sintaks/nama kunci, bukan isi):

- **`notifyCustomCall.json`** -- JSON sumber tidak lengkap: kurung kurawal
  penutup untuk `data` dan objek terluar hilang, dan kunci ditulis
  `"robot_response_message:"` (titik dua di dalam tanda kutip, bukan
  pemisah key:value). Diperbaiki ke `"robot_response_message"` dan kurung
  ditutup dengan benar. Nilai field tidak diubah.
- **`DeliveryTask.json`** (respons Open API) -- JSON sumber punya kurung
  kurawal penutup berlebih (`}` ekstra) setelah objek `data`. Dihapus.
- **`GetBoundRobotGroups.json`** -- kunci sumber ditulis `"shop_id:"`
  (ada titik dua di dalam nama kunci, bukan salah tempat seperti di atas
  -- ini literal bagian dari nama field di teks sumber). Diperbaiki ke
  `"shop_id"`.
- **`notifyDeliveryTask.json`** -- field `type` dan `status` di
  `destinations[]` pada teks sumber ditulis sebagai daftar pilihan
  dipisah garis miring (`"REMOTE/MANUAL"`, `"AWAIT/ON_THE_WAY/ARRIVED/CANCEL/COMPLETE"`)
  -- itu dokumentasi enum, bukan nilai contoh sungguhan. Diganti satu
  nilai konkret dari masing-masing daftar (`"REMOTE"`, `"ON_THE_WAY"`)
  supaya fixture valid sebagai satu payload nyata, bukan ditebak nilai
  baru di luar yang disebutkan dokumen.
- **`notifyRobotStatus.json`** -- contoh resmi di dokumen PUDU untuk
  callback ini (`RobotWorkStatusNotification-notifyRobotStatus`) justru
  menulis `"callback_type": "robotEmergencyRecover"` pada bagian "Call
  Example"-nya -- jelas salah ketik dokumen (field datanya persis bentuk
  `notifyRobotStatus`: `battery`, `charge_stage`, `move_state`,
  `run_state`, `charge_type`, `remain_time`, TIDAK seperti
  `robotEmergencyRecover` asli yang cuma `sn`/`mac`/`timestamp`).
  `callback_type` diperbaiki ke `"notifyRobotStatus"` di file ini.
  **Tidak ditebak lebih jauh dari itu** -- lihat
  `robotEmergencyRecover.json` untuk contoh resmi `robotEmergencyRecover`
  YANG BENAR (berbeda, dari bagian callback "EmergencyRecover-robotEmergencyRecover").
- Komentar `//` di dalam JSON (mis. `// current timestamp, seconds`) pada
  beberapa contoh sumber (notifyRobotPose, robotEmergencyRecover,
  notifyLiftingStatus) dihapus -- JSON standar tidak mendukung komentar.

## Tidak dibuat fixture (di luar scope)

- `notifyLiftingTask`, `notifyLiftingStatus`, `LiftingTask`,
  `LiftingCommands`, `Lifting Task List` -- lifting di luar scope T600
  (aturan keras task ini).
- `DeliveryCommands`, `Delivery Task List`, `OneKeyRechargeV2`,
  `GetRealtimeMapPosition`, `GetGroupRobotStatusV2`, `SwitchMap` (sebagai
  API WCS→PUDU) -- belum diimplementasikan sebagai method `client.ts`,
  di luar scope task ini untuk ditambahkan.

## Field yang masih "mentah"/belum ditafsirkan

Fixture-fixture ini dipakai juga untuk memverifikasi bahwa kode TIDAK
menafsirkan field yang maknanya belum dijelaskan dokumen resmi:
`is_used` (`AvailableMaps.json`, 1 atau 2), `vector`/`vector_list`
(`CurrentMap.json`/`GetMapDetailV2.json`, arti 3 angka pertama belum
jelas), `spend_time`/`spent_time` level-task (`notifyDeliveryTask.json`).
