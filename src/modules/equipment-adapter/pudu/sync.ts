import type { PuduClient } from "./client";

// Fungsi murni-terhadap-klien: menerima PuduClient, menangani paginasi
// (limit/offset) sampai `list` kosong, mengembalikan array lengkap. Belum
// menulis ke database dan belum dijadwalkan (Fase 2/worker) -- itu
// menyusul saat adapter PUDU benar-benar dipakai dengan robot nyata.

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
