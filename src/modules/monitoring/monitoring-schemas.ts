import { z } from "zod";

// GET /monitoring/overview (openapi-smart-wcs.yaml): warehouseId wajib.
export const overviewQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

// GET /api/warehouse-map -- tidak ada schema resmi di
// openapi-smart-wcs.yaml (cuma disebut di API_SPECIFICATION.md, lihat
// docs/ADAPTER_CONTRACT.md tidak relevan di sini, laporan akhir Fase A).
export const warehouseMapQuerySchema = z.object({
  warehouseId: z.string().uuid(),
});

// GET /api/robots/{robotId}/pose-history -- tidak ada di spesifikasi,
// ditambah karena diminta eksplisit ("riwayat posisi per robot"). from/to
// WAJIB (bukan opsional) supaya query PuduPoseLog (dipartisi per bulan)
// selalu memakai rentang recordedAt untuk partition pruning.
export const poseHistoryQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
});
