import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import { createLocationFixture } from "@/test/fixtures";
import { registerAdapter, getAdapterForRobot, clearRegistry } from "../registry";
import { fakeAdapter, resetFakeAdapterState } from "./index";

const ORIGINAL_ENV = { ...process.env };
const testDb = hasTestDatabase() ? createTestDb() : null;

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

describe.skipIf(!hasTestDatabase())("E2E tanpa PUDU: robot vendor fake, lewat registri", () => {
  beforeEach(async () => {
    process.env = { ...ORIGINAL_ENV };
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    // Sengaja dikosongkan -- membuktikan jalur ini tidak butuh PUDU sama
    // sekali (kalau ada langkah yang diam-diam butuh PUDU_*, test ini gagal).
    delete process.env.PUDU_BASE_URL;
    delete process.env.PUDU_API_APP_KEY;
    delete process.env.PUDU_API_APP_SECRET;
    delete process.env.PUDU_CALLBACK_CODE;

    await truncateAll(testDb!);
    resetFakeAdapterState();
    clearRegistry();
    registerAdapter(fakeAdapter);
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  it("task dibuat lewat POST /api/tasks, dispatch lewat registri, callback fake mengubah Mission/Task + menulis TaskStatusHistory", async () => {
    const location = await createLocationFixture(testDb!);
    const equipment = await testDb!.equipment.create({
      data: {
        locationId: location.locationId,
        name: "Fake Robot",
        equipmentType: "ROBOT",
        vendor: "Fake",
        status: "OFFLINE",
        capabilities: {},
      },
    });
    const robot = await testDb!.robot.create({
      data: {
        equipmentId: equipment.equipmentId,
        name: "Fake Robot 1",
        serialNumber: "FAKE-E2E-1",
        vendor: "Fake", // sengaja beda huruf besar/kecil dari key adapter "fake"
        model: "FAKE-MODEL",
        protocol: "FAKE",
      },
    });

    // 1. Buat Task lewat API (bukan langsung lewat Prisma) -- membuktikan
    // lapisan API tidak bergantung ke PUDU.
    vi.resetModules();
    const { POST } = await import("@/app/api/tasks/route");
    const createRes = await POST(
      makeRequest("http://localhost/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          taskType: "MOVE",
          source: "API",
          externalRef: "e2e-fake-1",
          sourceLocationId: location.locationId,
          destinationLocationId: location.locationId,
          priority: 1,
        }),
      }),
    );
    expect(createRes.status).toBe(201);
    const task = await createRes.json();
    expect(task.status).toBe("CREATED");

    // Mission belum punya endpoint API tersendiri -- dibuat langsung,
    // fokus test ini adalah lapisan adapter/registri, bukan Mission API.
    const mission = await testDb!.mission.create({
      data: { taskId: task.taskId, robotId: robot.robotId, status: "SUBMITTED" },
    });

    // 2. Dispatch lewat registri (bukan impor adapter langsung).
    const adapter = getAdapterForRobot(robot);
    expect(adapter?.key).toBe("fake");
    const dispatchResult = await adapter!.dispatch(testDb!, {
      robotId: robot.robotId,
      missionId: mission.missionId,
      kind: "CALL",
      targetPoint: "P1",
    });
    expect(dispatchResult.externalTaskId).toBeTruthy();

    // 3. Pesan masuk lewat adapter fake (jalur yang sama dipakai worker
    // nyata: handleInbound kind "queued").
    const inboundResult = await adapter!.handleInbound(testDb!, {
      kind: "queued",
      messageType: "statusUpdate",
      data: { missionId: mission.missionId, status: "RUNNING" },
      integrationLogId: null,
      occurredAt: new Date(),
    });
    expect(inboundResult.kind).toBe("processed");

    // 4. Mission/Task berubah status, TaskStatusHistory tertulis.
    const updatedMission = await testDb!.mission.findUniqueOrThrow({ where: { missionId: mission.missionId } });
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedMission.status).toBe("RUNNING");
    expect(updatedTask.status).toBe("RUNNING");

    const histories = await testDb!.taskStatusHistory.findMany({ where: { taskId: task.taskId } });
    expect(histories).toHaveLength(1);
    expect(histories[0].fromStatus).toBe("CREATED");
    expect(histories[0].toStatus).toBe("RUNNING");
  });
});
