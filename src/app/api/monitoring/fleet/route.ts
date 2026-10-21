import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/monitoring/fleet -- TIDAK ADA di openapi-smart-wcs.yaml maupun
 * API_SPECIFICATION.md (cuma /monitoring/overview dan /monitoring/connections
 * yang terdaftar resmi untuk Monitoring). Ditambah karena "ringkasan armada
 * (online/offline/charging, baterai, task aktif)" diminta eksplisit di
 * task ini sebagai butir terpisah dari overview (yang cuma angka agregat
 * warehouse, bukan per-robot). Lihat laporan akhir.
 *
 * Sumber data: PuduRobotState (dibaca langsung lewat Prisma, read-only,
 * TANPA mengimpor apa pun dari src/modules/equipment-adapter/pudu/) --
 * RobotStatus (tabel netral) tidak pernah ditulis kode produksi mana pun
 * hari ini, jadi selalu kosong; PuduRobotState satu-satunya sumber nyata.
 *
 * `isChargingRaw`/`remainTimeRaw` dikembalikan APA ADANYA tanpa label
 * satuan atau diterjemahkan jadi boolean "charging" -- artinya belum
 * terverifikasi (lihat PUDU_INTEGRATION.md bagian 9), jadi tidak dipakai
 * untuk hitungan ringkasan "charging".
 */
export async function GET(request: Request) {
  await requireAuth(request);

  const states = await db.puduRobotState.findMany({
    include: {
      puduRobot: { include: { robot: true } },
      currentPuduTask: { include: { mission: true } },
    },
  });

  const items = states.map((s) => ({
    robotId: s.puduRobot.robot.robotId,
    name: s.puduRobot.robot.name,
    serialNumber: s.puduRobot.robot.serialNumber,
    online: s.online,
    battery: s.battery,
    currentTaskId: s.currentPuduTask?.mission?.taskId ?? null,
    isChargingRaw: s.isCharging,
    remainTimeRaw: s.remainTime,
    position: { x: s.x, y: s.y, mapId: s.currentPuduMapId, recordedAt: s.lastPoseAt },
    updatedAt: s.updatedAt,
  }));

  const summary = {
    total: items.length,
    online: items.filter((i) => i.online === true).length,
    offline: items.filter((i) => i.online === false).length,
    unknown: items.filter((i) => i.online === null).length,
  };

  return NextResponse.json({ summary, items });
}
