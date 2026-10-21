# Equipment / Adapter module

Kontrak adapter equipment (register, status, mission command, event) — satu implementasi per vendor di subfolder `<vendor>/`. FR-05/06/07. Equipment/robot baru = adapter baru, jangan ubah WCS Core (lihat ADR.md Section 3).

Pilot: **PUDU T600 lewat PUDU Open Platform Cloud API** (`pudu/`). Baca `docs/PUDU_INTEGRATION.md` sebelum menulis kode adapter: autentikasi HMAC, alur callback (simpan ke `IntegrationLog` lalu balas 200, worker mengurai), dan pemetaan field ke tabel `Pudu*`.
