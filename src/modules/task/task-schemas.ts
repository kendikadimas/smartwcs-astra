import { z } from "zod";

// TaskCreateRequest (docs/openapi-smart-wcs.yaml). `externalRef` TIDAK ada
// di skema OpenAPI, tapi Task.externalRef wajib & UNIQUE bersama `source`
// di schema.prisma, dan task ini secara eksplisit minta idempotensi lewat
// (source, externalRef) -- jadi ditambahkan di sini. Lihat laporan akhir
// (perbedaan YAML vs kebutuhan implementasi, ADR Section 9.4).
export const taskCreateSchema = z.object({
  taskType: z.string().min(1),
  source: z.enum(["WMS", "WES", "MANUAL", "API"]),
  externalRef: z.string().min(1),
  sourceLocationId: z.string().uuid(),
  destinationLocationId: z.string().uuid(),
  materialId: z.string().uuid().optional(),
  containerId: z.string().optional(),
  quantity: z.number().optional(),
  priority: z.number().int(),
});

export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

export const taskListQuerySchema = z.object({
  status: z.string().optional(),
  zoneId: z.string().uuid().optional(),
  priority: z.coerce.number().int().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
