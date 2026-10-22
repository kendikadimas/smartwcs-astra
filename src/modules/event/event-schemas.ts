import { z } from "zod";

// Query GET /events dan GET /alarms. `severity`/`sourceType`/`taskId`/
// `from`/`to` ada di openapi-smart-wcs.yaml untuk /events; `taskId` dan
// paginasi (page/pageSize) adalah perluasan (tidak ada di YAML) karena
// diminta eksplisit di task ini -- lihat laporan akhir.
export const eventListQuerySchema = z.object({
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  sourceType: z.string().optional(),
  taskId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const alarmListQuerySchema = z.object({
  status: z.enum(["ACTIVE", "ACKNOWLEDGED", "CLEARED"]).optional(),
  severity: z.enum(["INFO", "WARNING", "ERROR", "CRITICAL"]).optional(),
  sourceType: z.string().optional(),
  taskId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
