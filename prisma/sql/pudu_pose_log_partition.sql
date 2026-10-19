-- PuduPoseLog sebagai tabel terpartisi per bulan (PostgreSQL)
--
-- Prisma tidak bisa mendeklarasikan partisi, jadi blok ini dipasang manual di migration
-- pertama. Prisma Client tetap membaca/menulis tabelnya seperti biasa.
--
-- Cara pakai (sekali, saat migration awal):
--   1. npx prisma migrate dev --create-only --name init
--   2. Buka prisma/migrations/<timestamp>_init/migration.sql, hapus:
--        - CREATE TABLE "PuduPoseLog" (...)
--        - CREATE INDEX "PuduPoseLog_puduRobotId_recordedAt_idx" ...
--        - ALTER TABLE "PuduPoseLog" ADD CONSTRAINT ... (2 foreign key)
--      lalu tempel seluruh isi file ini di bagian paling akhir migration.sql
--      (setelah tabel PuduRobot dan PuduMap dibuat).
--   3. npx prisma migrate dev
--
-- Wajib ada job terjadwal yang membuat partisi bulan berikutnya sebelum bulan berjalan
-- habis. Tanpa partisi, INSERT pose untuk bulan itu DITOLAK database
-- ("no partition of relation PuduPoseLog found for row").

CREATE TABLE "PuduPoseLog" (beserta index
--      dan FK-nya) dengan isi file ini.
--   3. npx prisma migrate dev
-- Prisma tetap bisa membaca/menulis tabel ini seperti biasa; partisi hanya urusan PostgreSQL.

CREATE TABLE "PuduPoseLog" (
    "poseLogId"    BIGSERIAL      NOT NULL,
    "puduRobotId"  UUID           NOT NULL,
    "puduMapId"    UUID,
    "x"            DECIMAL(14,4)  NOT NULL,
    "y"            DECIMAL(14,4)  NOT NULL,
    "z"            DECIMAL(14,4),
    "yaw"          DECIMAL(14,4),
    "nearestPoint" TEXT,
    "source"       TEXT           NOT NULL,
    "recordedAt"   TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "PuduPoseLog_pkey" PRIMARY KEY ("poseLogId", "recordedAt")
) PARTITION BY RANGE ("recordedAt");

CREATE INDEX "PuduPoseLog_puduRobotId_recordedAt_idx" ON "PuduPoseLog" ("puduRobotId", "recordedAt");

ALTER TABLE "PuduPoseLog"
    ADD CONSTRAINT "PuduPoseLog_puduRobotId_fkey" FOREIGN KEY ("puduRobotId")
        REFERENCES "PuduRobot" ("puduRobotId") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PuduPoseLog_puduMapId_fkey" FOREIGN KEY ("puduMapId")
        REFERENCES "PuduMap" ("puduMapId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partisi awal. Partisi bulan berikutnya dibuat oleh job terjadwal (cron / pg_partman)
-- sebelum bulan berjalan habis.
CREATE TABLE "PuduPoseLog_2026_10" PARTITION OF "PuduPoseLog"
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
CREATE TABLE "PuduPoseLog_2026_11" PARTITION OF "PuduPoseLog"
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
CREATE TABLE "PuduPoseLog_2026_12" PARTITION OF "PuduPoseLog"
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Retensi: hapus partisi yang lebih tua dari 90 hari dengan DROP TABLE partisinya
-- (jauh lebih cepat daripada DELETE baris per baris). Contoh:
--   DROP TABLE IF EXISTS "PuduPoseLog_2026_07";
