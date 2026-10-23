import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireRole } from "@/lib/rbac";
import { warehouseMapQuerySchema } from "@/modules/monitoring/monitoring-schemas";

/**
 * GET /api/warehouse-map?warehouseId=...
 *
 * Path ini disebut di API_SPECIFICATION.md ("Peta warehouse: node, edge,
 * lokasi, posisi equipment/robot") TAPI TIDAK ADA schema-nya sama sekali
 * di openapi-smart-wcs.yaml -- bentuk respons di bawah ini saya desain
 * sendiri dari data yang ada, bukan dari spesifikasi resmi (lihat laporan
 * akhir, gap Fase A).
 *
 * Gabungan dua sumber: `nodes`/`edges` (graf WCS inti, FR-01 master data)
 * dan `puduMaps` (peta visual + titik dari adapter PUDU, dibaca read-only
 * lewat Prisma, TANPA mengimpor apa pun dari src/modules/equipment-adapter/pudu/).
 */
// Diperlakukan sebagai Monitoring (Read untuk semua role login) -- tidak
// ada baris khusus di RBAC.md untuk endpoint ini, lihat komentar di atas.
export async function GET(request: Request) {
  const authResult = await requireRole(request, []);
  if (!authResult.ok) return authResult.response;

  const url = new URL(request.url);
  const parsed = warehouseMapQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return apiError(400, "VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { warehouseId } = parsed.data;

  const zones = await db.zone.findMany({ where: { warehouseId }, select: { zoneId: true } });
  const zoneIds = zones.map((z) => z.zoneId);

  const nodes = await db.node.findMany({ where: { zoneId: { in: zoneIds } } });
  const nodeIds = nodes.map((n) => n.nodeId);
  const edges = await db.edge.findMany({
    where: { OR: [{ fromNodeId: { in: nodeIds } }, { toNodeId: { in: nodeIds } }] },
  });

  const puduMaps = await db.puduMap.findMany({
    where: { warehouseId },
    include: { puduMapElements: { where: { isActive: true } } },
  });

  return NextResponse.json({ nodes, edges, puduMaps });
}
