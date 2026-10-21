import type { PrismaClient } from "../generated/prisma/client";

// Fixture minimal reusable antar test integrasi: satu Warehouse/Zone/
// Location, satu Robot (+ Equipment induk), satu Task, dan satu Mission
// yang menghubungkan keduanya. Nilai-nilai di sini data tiruan untuk test,
// bukan data produksi.
export async function createLocationFixture(prisma: PrismaClient) {
  const warehouse = await prisma.warehouse.create({
    data: { name: "Gudang Test", address: "Jl. Test No. 1" },
  });
  const zone = await prisma.zone.create({
    data: { warehouseId: warehouse.warehouseId, name: "Zona Test", zoneType: "STORAGE" },
  });
  return prisma.location.create({
    data: { zoneId: zone.zoneId, code: "LOC-TEST-1", locationType: "STORAGE" },
  });
}

export async function createRobotFixture(
  prisma: PrismaClient,
  opts: { locationId: string; name?: string; serialNumber?: string },
) {
  const equipment = await prisma.equipment.create({
    data: {
      locationId: opts.locationId,
      name: opts.name ?? "Robot Test",
      equipmentType: "ROBOT",
      vendor: "Pudu",
      status: "OFFLINE",
      capabilities: {},
    },
  });
  return prisma.robot.create({
    data: {
      equipmentId: equipment.equipmentId,
      name: opts.name ?? "Robot Test",
      serialNumber: opts.serialNumber,
      vendor: "Pudu",
      model: "T600",
      protocol: "REST",
    },
  });
}

export async function createTaskFixture(
  prisma: PrismaClient,
  opts: { sourceLocationId: string; destinationLocationId: string; status?: string; externalRef?: string },
) {
  return prisma.task.create({
    data: {
      taskType: "MOVE",
      source: "API",
      sourceLocationId: opts.sourceLocationId,
      destinationLocationId: opts.destinationLocationId,
      priority: 1,
      status: opts.status ?? "DISPATCHED",
      externalRef: opts.externalRef ?? `test-ref-${Math.random().toString(36).slice(2)}`,
    },
  });
}

/**
 * Baris Integration generik untuk test -- dipakai test di luar folder
 * adapter vendor manapun (lihat eslint.config.mjs no-restricted-imports),
 * supaya tidak perlu mengimpor seed khas vendor (mis. seedPuduIntegration).
 * `name` dicocokkan ke kunci adapter di registry.ts tidak peka huruf besar.
 */
export async function createIntegrationFixture(
  prisma: PrismaClient,
  opts: { name: string; systemType?: string; protocol?: string },
) {
  return prisma.integration.create({
    data: {
      systemType: opts.systemType ?? "RCS",
      name: opts.name,
      protocol: opts.protocol ?? "REST",
      endpointUrl: "https://example.invalid",
      credentials: {},
      status: "DISCONNECTED",
    },
  });
}

export async function createMissionFixture(
  prisma: PrismaClient,
  opts: { taskId: string; robotId: string; status?: string },
) {
  return prisma.mission.create({
    data: {
      taskId: opts.taskId,
      robotId: opts.robotId,
      status: opts.status ?? "SUBMITTED",
    },
  });
}

export async function createEventFixture(
  prisma: PrismaClient,
  opts: {
    eventType?: string;
    sourceType?: string;
    sourceId?: string;
    severity?: string;
    taskId?: string;
    occurredAt?: Date;
  } = {},
) {
  return prisma.event.create({
    data: {
      eventType: opts.eventType ?? "TEST_EVENT",
      sourceType: opts.sourceType ?? "ROBOT",
      sourceId: opts.sourceId ?? "00000000-0000-0000-0000-000000000b01",
      severity: opts.severity ?? "WARNING",
      message: "Event test",
      taskId: opts.taskId,
      occurredAt: opts.occurredAt ?? new Date(),
    },
  });
}

export async function createAlarmFixture(
  prisma: PrismaClient,
  opts: { eventId: string; status?: string },
) {
  return prisma.alarm.create({
    data: { eventId: opts.eventId, status: opts.status ?? "ACTIVE" },
  });
}
