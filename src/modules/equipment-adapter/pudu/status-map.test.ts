import { describe, expect, it } from "vitest";
import { mapCallStatus, mapDeliveryStatus } from "./status-map";

// Satu test per baris tabel CALL_STATUS_MAP, sumber:
// PUDU_OFFICIAL_EXCERPT.md InitiateCallTask (Res.data.state) dan
// CallStatus-notifyCustomCall (Params.data.state).
describe("mapCallStatus", () => {
  it.each([
    ["QUEUEING", "ACCEPTED", "DISPATCHED"],
    ["QUEUING", "ACCEPTED", "DISPATCHED"], // ejaan beda di callback vs respons API, excerpt sendiri tidak konsisten
    ["CALLING", "RUNNING", "RUNNING"],
    ["CALL_SUCCESS", "RUNNING", "RUNNING"], // robot MERESPONS sukses, BUKAN task selesai
    ["ARRIVE", "RUNNING", "RUNNING"],
    ["PAUSE", "RUNNING", "RUNNING"],
    ["CALL_COMPLETE", "COMPLETED", "COMPLETED"],
    ["COMPLETE", "COMPLETED", "COMPLETED"], // alias dari contoh respons GetCallList
    ["QUEUING_CANCEL", "CANCELLED", "CANCELLED"],
    ["TASK_CANCEL", "CANCELLED", "CANCELLED"],
    ["ROBOT_CANCEL", "CANCELLED", "CANCELLED"],
  ])("%s -> Mission=%s, Task=%s", (raw, missionStatus, taskStatus) => {
    const result = mapCallStatus(raw);
    expect(result.recognized).toBe(true);
    expect(result.missionStatus).toBe(missionStatus);
    expect(result.taskStatus).toBe(taskStatus);
  });

  it("CALL_FAILED -> FAILED dengan failureCode RESOURCE_ERROR", () => {
    const result = mapCallStatus("CALL_FAILED");
    expect(result.recognized).toBe(true);
    expect(result.missionStatus).toBe("FAILED");
    expect(result.taskStatus).toBe("FAILED");
    expect(result.failureCode).toBe("RESOURCE_ERROR");
  });

  it("tidak case-sensitive", () => {
    expect(mapCallStatus("queueing").recognized).toBe(true);
    expect(mapCallStatus("  Pause  ").recognized).toBe(true);
  });

  it("status tak dikenal tidak melempar error, recognized=false", () => {
    expect(() => mapCallStatus("STATUS_ANEH_BELUM_ADA")).not.toThrow();
    expect(mapCallStatus("STATUS_ANEH_BELUM_ADA").recognized).toBe(false);
  });

  it("kosakata DELIVERY (ON_THE_WAY/COMPLETED) TIDAK dikenal tabel CALL -- dulu disatukan, sekarang dipisah", () => {
    expect(mapCallStatus("ON_THE_WAY").recognized).toBe(false);
    expect(mapCallStatus("COMPLETED").recognized).toBe(false);
  });
});

// Satu test per baris DELIVERY_STATUS_MAP, sumber:
// PUDU_OFFICIAL_EXCERPT.md DeliveryTask-notifyDeliveryTask (Params.data.task_status).
describe("mapDeliveryStatus", () => {
  it.each([
    ["ON_THE_WAY", "RUNNING", "RUNNING"],
    ["PAUSE", "RUNNING", "RUNNING"],
    ["COMPLETED", "COMPLETED", "COMPLETED"],
    ["CANCEL", "CANCELLED", "CANCELLED"],
  ])("%s -> Mission=%s, Task=%s", (raw, missionStatus, taskStatus) => {
    const result = mapDeliveryStatus(raw);
    expect(result.recognized).toBe(true);
    expect(result.missionStatus).toBe(missionStatus);
    expect(result.taskStatus).toBe(taskStatus);
  });

  it("FAILED -> FAILED dengan failureCode RESOURCE_ERROR", () => {
    const result = mapDeliveryStatus("FAILED");
    expect(result.recognized).toBe(true);
    expect(result.missionStatus).toBe("FAILED");
    expect(result.taskStatus).toBe("FAILED");
    expect(result.failureCode).toBe("RESOURCE_ERROR");
  });

  it("status tak dikenal tidak melempar error, recognized=false", () => {
    expect(() => mapDeliveryStatus("STATUS_ANEH_BELUM_ADA")).not.toThrow();
    expect(mapDeliveryStatus("STATUS_ANEH_BELUM_ADA").recognized).toBe(false);
  });

  it("kosakata CALL (QUEUEING/CALL_SUCCESS) TIDAK dikenal tabel DELIVERY", () => {
    expect(mapDeliveryStatus("QUEUEING").recognized).toBe(false);
    expect(mapDeliveryStatus("CALL_SUCCESS").recognized).toBe(false);
  });
});
