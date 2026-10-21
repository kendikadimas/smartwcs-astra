import { describe, expect, it } from "vitest";
import { mapPuduStatus } from "./status-map";

// Satu test per baris tabel PUDU_INTEGRATION.md bagian 7.
describe("mapPuduStatus", () => {
  it.each([
    ["QUEUEING", "ACCEPTED", "DISPATCHED"],
    ["CALLING", "RUNNING", "RUNNING"],
    ["ON_THE_WAY", "RUNNING", "RUNNING"],
    ["CALL_SUCCESS", "COMPLETED", "COMPLETED"],
    ["COMPLETE", "COMPLETED", "COMPLETED"],
    ["COMPLETED", "COMPLETED", "COMPLETED"],
    ["CANCEL", "CANCELLED", "CANCELLED"],
    ["PAUSE", "RUNNING", "RUNNING"],
  ])("%s -> Mission=%s, Task=%s", (raw, missionStatus, taskStatus) => {
    const result = mapPuduStatus(raw);
    expect(result.recognized).toBe(true);
    expect(result.missionStatus).toBe(missionStatus);
    expect(result.taskStatus).toBe(taskStatus);
  });

  it.each(["FAIL", "FAILED"])("%s -> FAILED dengan failureCode RESOURCE_ERROR", (raw) => {
    const result = mapPuduStatus(raw);
    expect(result.recognized).toBe(true);
    expect(result.missionStatus).toBe("FAILED");
    expect(result.taskStatus).toBe("FAILED");
    expect(result.failureCode).toBe("RESOURCE_ERROR");
  });

  it("tidak case-sensitive", () => {
    expect(mapPuduStatus("queueing").recognized).toBe(true);
    expect(mapPuduStatus("  Pause  ").recognized).toBe(true);
  });

  it("status tak dikenal tidak melempar error, recognized=false", () => {
    expect(() => mapPuduStatus("STATUS_ANEH_BELUM_ADA")).not.toThrow();
    const result = mapPuduStatus("STATUS_ANEH_BELUM_ADA");
    expect(result.recognized).toBe(false);
  });
});
