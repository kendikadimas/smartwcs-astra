import type { PrismaClient, Prisma } from "../../../generated/prisma/client";
import type { PuduClient } from "./client";

// syncShops/syncRobots/syncGroups: murni-terhadap-klien, menangani paginasi
// (limit/offset) sampai `list` kosong, mengembalikan array lengkap, belum
// menulis ke database. syncMaps (Fase E, di bawah) BEDA -- dia memang
// menulis PuduMap/PuduMapElement, karena peta tidak punya "daftar id" netral
// yang bisa dikembalikan ke pemanggil seperti shop/robot (adapter PUDU
// sendiri yang butuh menuliskannya langsung, lihat index.ts syncResources()).

const DEFAULT_PAGE_SIZE = 50;

export async function syncShops(client: PuduClient, opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: NonNullable<Awaited<ReturnType<PuduClient["getStoreList"]>>["data"]>["list"] = [];
  let offset = 0;
  while (true) {
    const page = await client.getStoreList({ limit: pageSize, offset });
    const list = page.data?.list ?? [];
    all.push(...list);
    if (list.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export async function syncRobots(client: PuduClient, shopId: string, opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: NonNullable<Awaited<ReturnType<PuduClient["storeRobotList"]>>["data"]>["list"] = [];
  let offset = 0;
  while (true) {
    const page = await client.storeRobotList({ shop_id: shopId, limit: pageSize, offset });
    const list = page.data?.list ?? [];
    all.push(...list);
    if (list.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export async function syncGroups(client: PuduClient, shopId: string, opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: NonNullable<Awaited<ReturnType<PuduClient["getBoundRobotGroups"]>>["data"]>["groups"] = [];
  let offset = 0;
  while (true) {
    const page = await client.getBoundRobotGroups({ shop_id: shopId, limit: pageSize, offset });
    const groups = page.data?.groups ?? [];
    all.push(...groups);
    if (groups.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

/**
 * Fase E: StoreMapList (enumerasi nama peta per shop) + GetMapDetailV2
 * (detail + element_list per peta) -- BELUM diverifikasi dokumen resmi
 * (lihat client.ts). Upsert PuduMap (kunci puduShopId+mapName) dan
 * PuduMapElement (kunci puduMapId+vendorElementId); elemen yang ada di DB
 * tapi tidak lagi muncul di element_list di-soft-delete (isActive=false,
 * deletedAt) sesuai ERD.md -- elemen peta TIDAK PERNAH di-DELETE.
 */
export async function syncMaps(
  db: PrismaClient,
  client: PuduClient,
  puduShopId: string,
  shopIdForQuery: string,
): Promise<{ mapsSynced: number; elementsSynced: number }> {
  const mapList = await client.storeMapList({ shop_id: shopIdForQuery });
  const mapNames = mapList.data?.list ?? [];

  let mapsSynced = 0;
  let elementsSynced = 0;

  for (const { map_name: mapName } of mapNames) {
    const detail = await client.getMapDetailV2({ map_name: mapName });
    const data = detail.data;
    if (!data) continue;

    const map = await db.puduMap.upsert({
      where: { puduShopId_mapName: { puduShopId, mapName } },
      update: {
        mapCode: data.map_code,
        imageUrl: data.url,
        width: data.width,
        height: data.height,
        resolution: data.resolution,
        originX: data.origin_list?.[0],
        originY: data.origin_list?.[1],
        originZ: data.origin_list?.[2],
        zones: data.zone_list as Prisma.InputJsonValue | undefined,
        syncedAt: new Date(),
      },
      create: {
        puduShopId,
        mapName,
        mapCode: data.map_code,
        imageUrl: data.url,
        width: data.width,
        height: data.height,
        resolution: data.resolution,
        originX: data.origin_list?.[0],
        originY: data.origin_list?.[1],
        originZ: data.origin_list?.[2],
        zones: data.zone_list as Prisma.InputJsonValue | undefined,
        syncedAt: new Date(),
      },
    });
    mapsSynced += 1;

    const elements = data.element_list ?? [];
    const seenVendorIds = new Set<string>();
    for (const el of elements) {
      seenVendorIds.add(el.id);
      await db.puduMapElement.upsert({
        where: { puduMapId_vendorElementId: { puduMapId: map.puduMapId, vendorElementId: el.id } },
        update: {
          name: el.name,
          elementType: el.type,
          pointType: el.mode,
          x: el.vector_list?.[0],
          y: el.vector_list?.[1],
          z: el.vector_list?.[2],
          geometry: { vector_list: el.vector_list, clean_path_list: el.clean_path_list, group: el.group, width: el.width, max_speed: el.max_speed } as Prisma.InputJsonValue,
          isActive: true,
          deletedAt: null,
          syncedAt: new Date(),
        },
        create: {
          puduMapId: map.puduMapId,
          vendorElementId: el.id,
          name: el.name,
          elementType: el.type,
          pointType: el.mode,
          x: el.vector_list?.[0],
          y: el.vector_list?.[1],
          z: el.vector_list?.[2],
          geometry: { vector_list: el.vector_list, clean_path_list: el.clean_path_list, group: el.group, width: el.width, max_speed: el.max_speed } as Prisma.InputJsonValue,
          syncedAt: new Date(),
        },
      });
      elementsSynced += 1;
    }

    // Soft delete: elemen aktif di DB untuk peta ini yang tidak lagi
    // muncul di element_list hasil sync terbaru.
    await db.puduMapElement.updateMany({
      where: { puduMapId: map.puduMapId, isActive: true, vendorElementId: { notIn: [...seenVendorIds] } },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  return { mapsSynced, elementsSynced };
}
