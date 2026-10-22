import { describe, expect, it } from "vitest";
import { PuduClient } from "./client";

import GetStoreList from "@/test/fixtures/pudu-official/GetStoreList.json";
import StoreRobotList from "@/test/fixtures/pudu-official/StoreRobotList.json";
import StoreMapList from "@/test/fixtures/pudu-official/StoreMapList.json";
import AvailableMaps from "@/test/fixtures/pudu-official/AvailableMaps.json";
import CurrentMap from "@/test/fixtures/pudu-official/CurrentMap.json";
import GetMapDetailV2 from "@/test/fixtures/pudu-official/GetMapDetailV2.json";
import GetCurrentMapPoints from "@/test/fixtures/pudu-official/GetCurrentMapPoints.json";
import GetBoundRobotGroups from "@/test/fixtures/pudu-official/GetBoundRobotGroups.json";
import GetRobotsInGroup from "@/test/fixtures/pudu-official/GetRobotsInGroup.json";
import GetRobotStatusV2 from "@/test/fixtures/pudu-official/GetRobotStatusV2.json";
import InitiateCallTask from "@/test/fixtures/pudu-official/InitiateCallTask.json";
import CancelCallTask from "@/test/fixtures/pudu-official/CancelCallTask.json";
import CompleteCallTask from "@/test/fixtures/pudu-official/CompleteCallTask.json";
import GetCallList from "@/test/fixtures/pudu-official/GetCallList.json";
import DeliveryTask from "@/test/fixtures/pudu-official/DeliveryTask.json";
import NotifyRobotReportPositionResp from "@/test/fixtures/pudu-official/NotifyRobotReportPosition.json";

// Fase E.3: setiap contoh respons Open API resmi melewati PuduClient
// dengan fetch palsu (tanpa server HTTP lokal, cukup Response langsung) --
// mencakup kasus message huruf kecil (StoreRobotList), shop_id string
// (GetStoreList) vs angka (StoreRobotList/CurrentMap/AvailableMaps).
function fakeClient(body: unknown) {
  const fetchImpl = (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch;
  return new PuduClient({ baseUrl: "http://fake.invalid", apiAppKey: "k", apiAppSecret: "s", fetchImpl, maxRetries: 0 });
}

describe("fixture respons Open API resmi PUDU", () => {
  it("GetStoreList.json -- shop_id STRING", async () => {
    const result = await fakeClient(GetStoreList).getStoreList();
    expect(result.message).toBe("SUCCESS");
    expect(result.data?.list[0].shop_id).toBe("324100000");
  });

  it("StoreRobotList.json -- message 'success' huruf kecil TETAP dianggap sukses, shop_id ANGKA", async () => {
    const result = await fakeClient(StoreRobotList).storeRobotList();
    expect(result.message).toBe("success");
    expect(result.data?.list[0].shop_id).toBe(324100000);
    expect(result.data?.list[0].sn).toBe("OP2023090702");
  });

  it("StoreMapList.json", async () => {
    const result = await fakeClient(StoreMapList).storeMapList();
    expect(result.data?.list.map((m) => m.map_name)).toEqual(["2#2#carpet", "3#10#map-yy"]);
  });

  it("AvailableMaps.json -- is_used disimpan mentah (1 dan 2, tidak ditafsirkan)", async () => {
    const result = await fakeClient(AvailableMaps).availableMaps({ sn: "SN1" });
    expect(result.data?.list?.map((m) => m.is_used)).toEqual([1, 2]);
  });

  it("CurrentMap.json -- koordinat di kunci 'vector'", async () => {
    const result = await fakeClient(CurrentMap).currentMap({ sn: "SN1" });
    expect(result.data?.elements?.[0].vector).toEqual([0.12725049045409734, 0.008827563986179064, 0.10761558616086728]);
    expect(result.data?.shop_id).toBe(123);
  });

  it("GetMapDetailV2.json -- koordinat di kunci 'vector_list', elemen area punya 8 angka", async () => {
    const result = await fakeClient(GetMapDetailV2).getMapDetailV2({ map_name: "x" });
    const area = result.data?.element_list?.find((e) => e.type === "area");
    expect(area?.vector_list).toHaveLength(8);
    expect(result.data?.zone_list).toHaveLength(1);
  });

  it("GetCurrentMapPoints.json -- x/y/z eksplisit per titik", async () => {
    const result = await fakeClient(GetCurrentMapPoints).getCurrentMapPoints();
    expect(result.data?.list[0]).toMatchObject({ name: "return point 1", type: "return_point" });
  });

  it("GetBoundRobotGroups.json (salah ketik 'shop_id:' dibersihkan di fixture)", async () => {
    const result = await fakeClient(GetBoundRobotGroups).getBoundRobotGroups();
    expect(result.data?.groups[0].shop_id).toBe(121562);
  });

  it("GetRobotsInGroup.json", async () => {
    const result = await fakeClient(GetRobotsInGroup).getRobotsInGroup({ group_id: "g1" });
    expect(result.data?.robots[0].sn).toBe("0OP10164655230");
  });

  it("GetRobotStatusV2.json -- charge_type int32", async () => {
    const result = await fakeClient(GetRobotStatusV2).getRobotStatusV2({ sn: "SN1" });
    expect(result.data?.charge_type).toBe(2);
    expect(result.data?.is_charging).toBe(-1);
  });

  it("InitiateCallTask.json -- task_id di data (bug #1 lama, dicek ulang)", async () => {
    const result = await fakeClient(InitiateCallTask).initiateCallTask({ sn: "SN1", map_name: "M1", point: "P1", point_type: "table" });
    expect(result.data?.task_id).toBe("CALL-202405201234567890");
  });

  it("CancelCallTask.json -- tidak punya data", async () => {
    const result = await fakeClient(CancelCallTask).cancelCallTask({ task_id: "T1" });
    expect(result.message).toBe("SUCCESS");
    expect(result.data).toBeUndefined();
  });

  it("CompleteCallTask.json -- next_call_result", async () => {
    const result = await fakeClient(CompleteCallTask).completeCallTask({ task_id: "T1" });
    expect(result.data?.next_call_result?.task_id).toBe("CALL-202405201234567891");
  });

  it("GetCallList.json", async () => {
    const result = await fakeClient(GetCallList).getCallList({});
    expect(result.data?.list[0].status).toBe("COMPLETE");
  });

  it("DeliveryTask.json -- data.code NUMBER (bug ditemukan saat verifikasi bagian C)", async () => {
    const result = await fakeClient(DeliveryTask).deliveryTask({ sn: "SN1", trays: [] });
    expect(result.data?.code).toBe(0);
    expect(typeof result.data?.code).toBe("number");
  });

  it("NotifyRobotReportPosition.json -- bagian D, tidak punya data", async () => {
    const result = await fakeClient(NotifyRobotReportPositionResp).notifyRobotReportPosition({ sn: "SN1", interval: 5, times: 100 });
    expect(result.message).toBe("SUCCESS");
  });
});
