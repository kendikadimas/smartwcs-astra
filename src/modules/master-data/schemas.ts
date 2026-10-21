import { z } from "zod";

// Mengikuti docs/openapi-smart-wcs.yaml *CreateRequest schemas (sumber
// kebenaran kontrak API per CLAUDE.md -- lihat ADR Section 9.4 soal status
// YAML vs Zod yang belum diputuskan).

export const robotCreateSchema = z.object({
  vendor: z.string().min(1),
  model: z.string().min(1),
  protocol: z.string().min(1),
  // Tidak ada di RobotCreateRequest OpenAPI (cuma vendor/model/protocol),
  // tapi Robot.equipmentId wajib & unik di schema.prisma -- field ini
  // ditambahkan supaya request bisa menaut ke Equipment yang sudah ada.
  // Lihat laporan akhir (perbedaan YAML vs kebutuhan implementasi).
  equipmentId: z.string().uuid(),
  name: z.string().min(1).optional(),
  serialNumber: z.string().min(1).optional(),
});

export const equipmentCreateSchema = z.object({
  locationId: z.string().uuid(),
  equipmentType: z.string().min(1),
  vendor: z.string().min(1),
  name: z.string().min(1).optional(),
});

export const equipmentUpdateSchema = z.object({
  locationId: z.string().uuid().optional(),
  status: z.string().min(1).optional(),
});

export const locationCreateSchema = z.object({
  zoneId: z.string().uuid(),
  code: z.string().min(1),
  locationType: z.string().min(1),
});

export const zoneCreateSchema = z.object({
  warehouseId: z.string().uuid(),
  name: z.string().min(1),
  zoneType: z.string().min(1).optional(),
});

export const materialCreateSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
});
