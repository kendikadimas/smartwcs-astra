import type { PuduClient } from "./client";

// Fungsi murni-terhadap-klien: menerima PuduClient, menangani paginasi
// (limit/offset) sampai `list` kosong, mengembalikan array lengkap. Belum
// menulis ke database dan belum dijadwalkan (Fase 2/worker) -- itu
// menyusul saat adapter PUDU benar-benar dipakai dengan robot nyata.

const DEFAULT_PAGE_SIZE = 50;

export async function syncShops(client: PuduClient, opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: Awaited<ReturnType<PuduClient["getStoreList"]>>["list"] = [];
  let offset = 0;
  while (true) {
    const page = await client.getStoreList({ limit: pageSize, offset });
    all.push(...page.list);
    if (page.list.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export async function syncRobots(client: PuduClient, shopId: string, opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: Awaited<ReturnType<PuduClient["storeRobotList"]>>["list"] = [];
  let offset = 0;
  while (true) {
    const page = await client.storeRobotList({ shop_id: shopId, limit: pageSize, offset });
    all.push(...page.list);
    if (page.list.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

export async function syncGroups(client: PuduClient, shopId: string, opts: { pageSize?: number } = {}) {
  const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE;
  const all: Awaited<ReturnType<PuduClient["getBoundRobotGroups"]>>["groups"] = [];
  let offset = 0;
  while (true) {
    const page = await client.getBoundRobotGroups({ shop_id: shopId, limit: pageSize, offset });
    all.push(...page.groups);
    if (page.groups.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}
