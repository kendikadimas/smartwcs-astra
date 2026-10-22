import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, hasTestDatabase, truncateAll } from "@/test/db";
import {
  createLocationFixture,
  createMissionFixture,
  createRobotFixture,
  createTaskFixture,
} from "@/test/fixtures";
import { applyPuduTaskStatus } from "./task-status";

const testDb = hasTestDatabase() ? createTestDb() : null;

describe.skipIf(!hasTestDatabase())("applyPuduTaskStatus", () => {
  beforeEach(async () => {
    await truncateAll(testDb!);
  });

  afterAll(async () => {
    await testDb?.$disconnect();
  });

  async function setup() {
    const location = await createLocationFixture(testDb!);
    const robot = await createRobotFixture(testDb!, { locationId: location.locationId });
    const task = await createTaskFixture(testDb!, {
      sourceLocationId: location.locationId,
      destinationLocationId: location.locationId,
      status: "DISPATCHED",
    });
    const mission = await createMissionFixture(testDb!, {
      taskId: task.taskId,
      robotId: robot.robotId,
      status: "SUBMITTED",
    });
    return { robot, task, mission };
  }

  it("mengubah Mission.status dan Task.status + menulis TaskStatusHistory saat status berubah", async () => {
    const { robot, task, mission } = await setup();

    const result = await applyPuduTaskStatus(testDb!, {
      rawStatus: "CALLING",
      taskKind: "CALL",
      robotId: robot.robotId,
      missionId: mission.missionId,
      integrationLogId: null,
      occurredAt: new Date(),
    });

    expect(result.recognized).toBe(true);
    const updatedMission = await testDb!.mission.findUniqueOrThrow({ where: { missionId: mission.missionId } });
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedMission.status).toBe("RUNNING");
    expect(updatedTask.status).toBe("RUNNING");

    const histories = await testDb!.taskStatusHistory.findMany({ where: { taskId: task.taskId } });
    expect(histories).toHaveLength(1);
    expect(histories[0].fromStatus).toBe("DISPATCHED");
    expect(histories[0].toStatus).toBe("RUNNING");
  });

  it("tidak menulis TaskStatusHistory kalau status WCS tidak berubah", async () => {
    const { robot, task, mission } = await setup();
    // DISPATCHED sudah sesuai hasil mapping QUEUEING -> tidak ada perubahan
    await testDb!.task.update({ where: { taskId: task.taskId }, data: { status: "DISPATCHED" } });

    await applyPuduTaskStatus(testDb!, {
      rawStatus: "QUEUEING",
      taskKind: "CALL",
      robotId: robot.robotId,
      missionId: mission.missionId,
      integrationLogId: null,
      occurredAt: new Date(),
    });

    const histories = await testDb!.taskStatusHistory.findMany({ where: { taskId: task.taskId } });
    expect(histories).toHaveLength(0);
  });

  it("status tak dikenal: tidak throw, tidak mengubah Task/Mission, mencatat Event peringatan", async () => {
    const { robot, task, mission } = await setup();

    const result = await applyPuduTaskStatus(testDb!, {
      rawStatus: "STATUS_ANEH",
      taskKind: "CALL",
      robotId: robot.robotId,
      missionId: mission.missionId,
      integrationLogId: null,
      occurredAt: new Date(),
    });

    expect(result.recognized).toBe(false);
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedTask.status).toBe("DISPATCHED");

    const events = await testDb!.event.findMany({ where: { sourceId: robot.robotId } });
    expect(events).toHaveLength(1);
    expect(events[0].severity).toBe("WARNING");
    expect(events[0].message).toContain("STATUS_ANEH");
  });

  it("taskKind DELIVERY memakai tabel status DELIVERY, bukan CALL (ON_THE_WAY -> RUNNING)", async () => {
    const { robot, task, mission } = await setup();

    const result = await applyPuduTaskStatus(testDb!, {
      rawStatus: "ON_THE_WAY",
      taskKind: "DELIVERY",
      robotId: robot.robotId,
      missionId: mission.missionId,
      integrationLogId: null,
      occurredAt: new Date(),
    });

    expect(result.recognized).toBe(true);
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedTask.status).toBe("RUNNING");
  });

  it("taskKind OTHER (mis. SWITCH_MAP) selalu recognized=false, tidak mengubah status", async () => {
    const { robot, task, mission } = await setup();

    const result = await applyPuduTaskStatus(testDb!, {
      rawStatus: "CANCEL", // token yang valid untuk CALL/DELIVERY, tapi OTHER tidak punya tabel sama sekali
      taskKind: "OTHER",
      robotId: robot.robotId,
      missionId: mission.missionId,
      integrationLogId: null,
      occurredAt: new Date(),
    });

    expect(result.recognized).toBe(false);
    const updatedTask = await testDb!.task.findUniqueOrThrow({ where: { taskId: task.taskId } });
    expect(updatedTask.status).toBe("DISPATCHED"); // tidak berubah
  });

  it("tidak throw kalau missionId null (task dibuat langsung di PUDU)", async () => {
    const { robot } = await setup();

    await expect(
      applyPuduTaskStatus(testDb!, {
        rawStatus: "CALLING",
        taskKind: "CALL",
        robotId: robot.robotId,
        missionId: null,
        integrationLogId: null,
        occurredAt: new Date(),
      }),
    ).resolves.not.toThrow();
  });
});
