# Task module

Task lifecycle sesuai enum `TaskStatus` di `docs/openapi-smart-wcs.yaml` (PRD Section 11): CREATED → VALIDATED → QUEUED → ASSIGNED → DISPATCHED → RUNNING → COMPLETED / FAILED, plus RETRY dan CANCELLED. Dispatching dan routing. FR-02/03/04. Status task yang dikirim robot PUDU diterjemahkan oleh adapter (lihat `docs/PUDU_INTEGRATION.md` Section 7), bukan oleh modul ini.
