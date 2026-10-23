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

// PATCH /tasks/{taskId}/status (docs/openapi-smart-wcs.yaml). TaskStatus
// enum di spec punya VALIDATED/QUEUED/ASSIGNED/RETRY yang TIDAK PERNAH
// diproduksi kode mana pun (lihat docs/TASK_STATE_MACHINE.md bagian 5,
// "belum diputuskan") -- tetap diterima di sini (bukan ditolak) karena
// endpoint ini cuma menerapkan apa yang diminta pemanggil, bukan
// memutuskan kosakata status mana yang "benar" (keputusan itu di luar
// scope Bagian 1 Fase D, lihat laporan akhir).
export const taskStatusPatchSchema = z.object({
  status: z.enum([
    "CREATED",
    "VALIDATED",
    "QUEUED",
    "ASSIGNED",
    "DISPATCHED",
    "RUNNING",
    "COMPLETED",
    "FAILED",
    "RETRY",
    "CANCELLED",
  ]),
  failureCode: z.string().nullable().optional(),
  assignedResourceId: z.string().uuid().nullable().optional(),
  resourceType: z.enum(["EQUIPMENT", "ROBOT"]).nullable().optional(),
});

// POST /tasks/{taskId}/dispatch -- endpoint TAMBAHAN, TIDAK ADA di
// openapi-smart-wcs.yaml v0.4.0-proposed (spec tidak punya jalur pemicu
// dispatch sama sekali, lihat laporan akhir Fase A). Bentuknya dirancang
// sendiri, mengikuti vocabulary netral DispatchCommand
// (src/modules/equipment-adapter/types.ts) -- akan disinkronkan ke
// OpenAPI di Bagian 2. Robot dipilih pemanggil (bukan alokasi otomatis).
export const taskDispatchSchema = z.object({
  robotId: z.string().uuid(),
  kind: z.enum(["CALL", "DELIVERY"]),
  targetPoint: z.string().min(1).optional(),
  destinations: z.array(z.object({ point: z.string().min(1), type: z.string().optional() })).optional(),
  priority: z.number().int().optional(),
});
