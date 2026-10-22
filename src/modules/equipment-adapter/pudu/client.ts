import { logger } from "../../../lib/logger";
import { buildPathAndParameters, signRequest } from "./signing";

export interface PuduClientConfig {
  baseUrl: string;
  apiAppKey: string;
  apiAppSecret: string;
  /** Header Language -- default Mandarin kalau kosong di sisi PUDU, kirim eksplisit supaya nama toko konsisten (PUDU_INTEGRATION.md bagian 6). */
  language?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** Override buat test -- klien tidak boleh pernah memanggil internet sungguhan saat test. */
  fetchImpl?: typeof fetch;
}

export class PuduApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    /** `message` dari envelope respons PUDU (mis. "CLOUD_OPEN_ROBOT_OFFLINE"), kosong untuk kegagalan transport/HTTP murni. */
    public readonly code?: string,
    public readonly traceId?: string,
  ) {
    super(message);
    this.name = "PuduApiError";
  }
}

interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

/**
 * PUDU_OFFICIAL_EXCERPT.md bagian A: envelope respons Open API selalu
 * `{ trace_id, message, data }`, `message` = "SUCCESS" kalau sukses, kode
 * error kalau tidak. Beberapa endpoint (mis. CancelCallTask) tidak punya
 * `data` sama sekali -- field itu opsional.
 */
export interface PuduEnvelope<T = unknown> {
  trace_id?: string;
  message: string;
  data?: T;
}

// Kode error bisnis yang dianggap transien (worth di-retry) -- sisanya
// (PARAM_ERROR, CLOUD_OPEN_ROBOT_OFFLINE, dst.) adalah kegagalan permanen
// untuk request yang sama, retry tidak akan mengubah hasil.
const RETRYABLE_BUSINESS_CODES = new Set(["CLOUD_OPEN_WAIT", "CLOUD_OPEN_TIMEOUT", "SYSTEM_ERROR"]);

export class PuduClient {
  constructor(private readonly config: PuduClientConfig) {}

  private async request<T extends PuduEnvelope>(
    method: "GET" | "POST",
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    const pathAndParameters = buildPathAndParameters(path, opts.query);
    const url = new URL(this.config.baseUrl + path);
    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const bodyString = opts.body !== undefined ? JSON.stringify(opts.body) : undefined;
    const signed = signRequest({
      method,
      pathAndParameters,
      body: bodyString,
      apiAppKey: this.config.apiAppKey,
      apiAppSecret: this.config.apiAppSecret,
    });

    const headers: Record<string, string> = {
      ...signed,
      ...(this.config.language ? { Language: this.config.language } : {}),
    };

    const fetchImpl = this.config.fetchImpl ?? fetch;
    const maxRetries = this.config.maxRetries ?? 2;
    const timeoutMs = this.config.timeoutMs ?? 10_000;

    let lastErr: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // Log tidak pernah menyertakan header (Authorization berisi
        // signature, bukan secret mentah, tapi tetap tidak dilog demi aman).
        const res = await fetchImpl(url.toString(), {
          method,
          headers,
          body: bodyString,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        logger.info({ method, path, status: res.status, attempt }, "pudu client request");

        if (!res.ok) {
          const text = await res.text();
          if (res.status === 401) {
            // PUDU_OFFICIAL_EXCERPT.md bagian A: "gateway membalas 401 dan
            // menyertakan StringToSign milik server di header respons" --
            // nama header PERSIS tidak disebut dokumen, jadi log semua
            // header respons (tanpa Authorization request kita sendiri,
            // yang berisi signature bukan secret, tapi tetap tidak perlu
            // dilog ulang) untuk debugging manual.
            const responseHeaders: Record<string, string> = {};
            for (const [key, value] of res.headers.entries()) responseHeaders[key] = value;
            logger.warn(
              { method, path, responseHeaders },
              "pudu client 401 -- cek header respons untuk StringToSign server (nama header belum dikonfirmasi dokumen)",
            );
          }
          throw new PuduApiError(`PUDU API ${method} ${path} gagal: HTTP ${res.status} ${text}`, res.status);
        }

        const text = await res.text();
        let json: unknown;
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          throw new PuduApiError(`PUDU API ${method} ${path}: respons bukan JSON valid`, res.status);
        }
        const envelope = json as Partial<PuduEnvelope>;
        if (typeof envelope.message !== "string") {
          throw new PuduApiError(`PUDU API ${method} ${path}: respons tidak berisi field 'message'`, res.status);
        }
        // Bagian C PUDU_OFFICIAL_EXCERPT.md: contoh respons resmi
        // StoreRobotList memakai "success" huruf kecil, bukan "SUCCESS" --
        // dokumen resmi sendiri tidak konsisten soal huruf besar/kecil.
        // Dibandingkan tidak peka huruf besar/kecil supaya respons sukses
        // asli tidak keliru dianggap error bisnis (ditemukan saat
        // mencocokkan client.ts ke contoh bagian C, di luar 5 poin awal).
        if (envelope.message.toUpperCase() !== "SUCCESS") {
          // Error bisnis (HTTP 2xx tapi message bukan SUCCESS, lihat
          // PUDU_OFFICIAL_EXCERPT.md bagian A) -- retry cuma untuk kode
          // yang dianggap transien, sisanya gagal permanen untuk request
          // yang sama.
          const businessErr = new PuduApiError(
            `PUDU API ${method} ${path} gagal: ${envelope.message}`,
            res.status,
            envelope.message,
            envelope.trace_id,
          );
          if (!RETRYABLE_BUSINESS_CODES.has(envelope.message)) {
            throw businessErr; // dilempar langsung, TIDAK lewat retry loop
          }
          throw businessErr; // tetap dilempar, tapi ditangkap di bawah dan diretry
        }

        return envelope as T;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof PuduApiError && err.code && !RETRYABLE_BUSINESS_CODES.has(err.code)) {
          throw err; // error bisnis permanen -- jangan buang waktu retry
        }
        lastErr = err;
        logger.warn(
          { method, path, attempt, errMessage: err instanceof Error ? err.message : String(err) },
          "pudu client request gagal",
        );
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  /** Uji signature pertama kali, sesuai PUDU_OFFICIAL_EXCERPT.md bagian A poin 4. Tidak punya `data` resmi -- dites via `message === "SUCCESS"` saja. */
  healthCheck() {
    return this.request<PuduEnvelope>("GET", "/data-open-platform-service/v1/api/healthCheck");
  }

  // Field data.list/data.count BELUM diverifikasi dokumen resmi (GetStoreList
  // tidak ada di excerpt) -- dipertahankan dari PUDU_INTEGRATION.md Lampiran
  // #44, cuma dibungkus ulang ke bentuk envelope {trace_id, message, data}
  // yang DIKONFIRMASI resmi (bagian A) untuk semua endpoint Open API.
  getStoreList(params: { limit?: number; offset?: number } = {}) {
    return this.request<
      PuduEnvelope<{
        count: number;
        list: Array<{ shop_id: string; shop_name?: string; company_id?: string; company_name?: string }>;
      }>
    >("GET", "/data-open-platform-service/v1/api/shop", { query: params });
  }

  // Belum diverifikasi dokumen resmi (StoreRobotList tidak ada di excerpt) --
  // field dari PUDU_INTEGRATION.md Lampiran #45, dibungkus envelope.
  storeRobotList(params: { limit?: number; offset?: number; shop_id?: string } = {}) {
    return this.request<
      PuduEnvelope<{
        count: number;
        list: Array<{
          sn: string;
          mac?: string;
          shop_id?: string;
          shop_name?: string;
          product_code?: string;
          nickname?: string;
          first_active_time?: string | number;
        }>;
      }>
    >("GET", "/data-open-platform-service/v1/api/robot", { query: params });
  }

  // Belum diverifikasi dokumen resmi (GetBoundRobotGroups tidak ada di
  // excerpt) -- field dari PUDU_INTEGRATION.md Lampiran #46, dibungkus envelope.
  getBoundRobotGroups(params: { limit?: number; offset?: number; shop_id?: string; device?: string } = {}) {
    return this.request<
      PuduEnvelope<{ groups: Array<{ group_id: string; group_name?: string; shop_id?: string; shop_name?: string }> }>
    >("GET", "/open-platform-service/v1/robot/group/list", { query: params });
  }

  // Belum diverifikasi dokumen resmi (GetRobotsInGroup tidak ada di excerpt)
  // -- field dari PUDU_INTEGRATION.md Lampiran #47, dibungkus envelope.
  getRobotsInGroup(params: { group_id: string; limit?: number; offset?: number }) {
    return this.request<
      PuduEnvelope<{ robots: Array<{ sn: string; mac?: string; robot_name?: string; shop_id?: string; shop_name?: string }> }>
    >("GET", "/open-platform-service/v1/robot/list_by_device_and_group", { query: params });
  }

  /** Field data.* DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md (GetRobotStatusV2) persis, termasuk charge_type int32 (1=kabel, 2=dock). */
  getRobotStatusV2(params: { sn?: string; mac?: string }) {
    return this.request<
      PuduEnvelope<{
        sn: string;
        mac?: string;
        timestamp?: number;
        battery?: number;
        is_charging?: number;
        move_state?: string;
        charge_stage?: string;
        remain_time?: number;
        product_code?: string;
        run_state?: string;
        charge_type?: number;
      }>
    >("GET", "/open-platform-service/v2/status/get_by_sn", { query: params });
  }

  /** Field request & data.* DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md (InitiateCallTask). Bentuk payload lengkap (map_name/point_type wajib, dst.) diperbaiki di Fase C. */
  initiateCallTask(payload: {
    sn?: string;
    shop_id?: number;
    map_name: string;
    point: string;
    point_type: string;
    call_mode?: string;
    mode_data?: unknown;
    do_not_queue?: boolean;
    robot_group_ids?: string[];
    filter_category_ids?: string[];
    priority?: number;
  }) {
    return this.request<PuduEnvelope<{ task_id: string; queue?: number; state: string; remark?: string }>>(
      "POST",
      "/open-platform-service/v1/custom_call",
      { body: payload },
    );
  }

  /** Katalog API #2, CancelCallTask -- DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md. Tidak punya `data`. */
  cancelCallTask(payload: { task_id?: string; sn?: string; is_auto_back?: boolean }) {
    return this.request<PuduEnvelope>("POST", "/open-platform-service/v1/custom_call/cancel", { body: payload });
  }

  /** Katalog API #3, CompleteCallTask -- DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md. */
  completeCallTask(payload: {
    task_id: string;
    next_call_task?: {
      shop_id: number;
      map_name: string;
      point: string;
      point_type: string;
      call_mode?: string;
      mode_data?: unknown;
    };
  }) {
    return this.request<PuduEnvelope<{ next_call_result?: { message: string; task_id: string } }>>(
      "POST",
      "/open-platform-service/v1/custom_call/complete",
      { body: payload },
    );
  }

  /** Katalog API #4, GetCallList -- DIKONFIRMASI PUDU_OFFICIAL_EXCERPT.md. Dipakai rekonsiliasi (Fase E). */
  getCallList(params: { sn?: string; task_id?: string; shop_id?: number; status?: string[]; offset?: number; limit?: number }) {
    return this.request<
      PuduEnvelope<{
        total: number;
        list: Array<{
          task_id: string;
          shop_id?: number;
          map_name?: string;
          point?: string;
          sn?: string;
          queue?: number;
          create_time?: number;
          finish_time?: number;
          status: string;
          remark?: string;
          product_code?: string;
        }>;
      }>
    >("GET", "/open-platform-service/v1/call/list", {
      query: {
        sn: params.sn,
        task_id: params.task_id,
        shop_id: params.shop_id,
        offset: params.offset,
        limit: params.limit,
        // Array<string> -- PUDU_INTEGRATION.md tidak merinci cara encode query
        // array; dipakai konvensi umum "digabung koma" (dipakai juga untuk
        // nilai array di PathAndParameters signing, bagian A) -- belum
        // diverifikasi dokumen resmi untuk endpoint ini secara spesifik.
        status: params.status?.join(","),
      },
    });
  }

  /**
   * Katalog #29, NotifyRobotReportPosition -- DIKONFIRMASI
   * PUDU_OFFICIAL_EXCERPT.md bagian D. Tanpa ini PUDU tidak akan pernah
   * mengirim callback notifyRobotPose. Body resmi: `{ sn, payload:
   * { interval, times } }` (BUKAN `{ sn, interval, times }` rata seperti
   * versi sebelumnya -- bug ditemukan setelah bagian D didapat). Validasi
   * sebelum kirim (tanpa memanggil jaringan untuk input tidak valid):
   * `interval` bulat >= 1 detik, `times` bulat 1..1000, `sn` tidak kosong.
   */
  notifyRobotReportPosition(payload: { sn: string; interval: number; times: number }) {
    if (!payload.sn) {
      throw new Error("notifyRobotReportPosition: sn tidak boleh kosong");
    }
    if (!Number.isInteger(payload.interval) || payload.interval < 1) {
      throw new Error(`notifyRobotReportPosition: interval harus bilangan bulat >= 1 (dapat ${payload.interval})`);
    }
    if (!Number.isInteger(payload.times) || payload.times < 1 || payload.times > 1000) {
      throw new Error(`notifyRobotReportPosition: times harus bilangan bulat 1-1000 (dapat ${payload.times})`);
    }
    return this.request<PuduEnvelope>("POST", "/open-platform-service/v1/position_command", {
      body: { sn: payload.sn, payload: { interval: payload.interval, times: payload.times } },
    });
  }

  // Katalog #30, StoreMapList -- BELUM diverifikasi dokumen resmi. Field
  // dari PUDU_INTEGRATION.md Lampiran #30.
  storeMapList(params: { shop_id?: string } = {}) {
    return this.request<PuduEnvelope<{ list: Array<{ map_name: string }> }>>(
      "GET",
      "/data-open-platform-service/v1/api/maps",
      { query: params },
    );
  }

  // Katalog #33, GetMapDetailV2 -- BELUM diverifikasi dokumen resmi. Field
  // dari PUDU_INTEGRATION.md Lampiran #33. Sumber utama sinkronisasi peta
  // di syncResources() (sync.ts) -- sudah mencakup metadata peta DAN
  // element_list dalam satu panggilan, jadi CurrentMap/GetCurrentMapPoints
  // (di bawah) tidak dipanggil ganda untuk data yang sama di syncResources().
  getMapDetailV2(params: { map_name: string }) {
    return this.request<
      PuduEnvelope<{
        map_name: string;
        url?: string;
        zone_list?: unknown[];
        map_code?: string;
        width?: number;
        height?: number;
        resolution?: number;
        origin_list?: [number, number, number];
        element_list?: Array<{
          id: string;
          name: string;
          type: string;
          mode?: string;
          vector_list?: number[];
          clean_path_list?: unknown;
          group?: unknown;
          width?: number;
          max_speed?: number;
        }>;
      }>
    >("GET", "/map-service/v1/open/map", { query: params });
  }

  // Katalog #32, CurrentMap -- BELUM diverifikasi dokumen resmi. Field dari
  // PUDU_INTEGRATION.md Lampiran #32. Disiapkan sesuai instruksi task, TIDAK
  // dipanggil dari syncResources() (GetMapDetailV2 sudah mencakup element
  // list yang sama/lebih lengkap) -- hindari panggilan API ganda untuk data
  // yang sama, keputusan sendiri, dicatat di laporan akhir.
  currentMap(params: { sn: string }) {
    return this.request<
      PuduEnvelope<{
        name: string;
        floor?: string;
        shop_id?: string;
        elements?: Array<{ type: string; id: string; name: string; mode?: string; group?: unknown; vector?: number[]; width?: number; max_speed?: number }>;
      }>
    >("GET", "/map-service/v1/open/current", { query: params });
  }

  // Katalog #35, GetCurrentMapPoints -- BELUM diverifikasi dokumen resmi.
  // Field dari PUDU_INTEGRATION.md Lampiran #35. Disiapkan sesuai instruksi
  // task, TIDAK dipanggil dari syncResources() (lihat catatan currentMap()).
  getCurrentMapPoints(params: { map_name?: string } = {}) {
    return this.request<
      PuduEnvelope<{ total: number; list: Array<{ name: string; type?: string; x?: number; y?: number; z?: number }> }>
    >("GET", "/map-service/v1/open/point", { query: params });
  }

  // Belum diverifikasi dokumen resmi (DeliveryTask -- API inisiasi -- tidak
  // ada di excerpt; yang ada cuma callback notifyDeliveryTask). Field dari
  // PUDU_INTEGRATION.md Lampiran #5, dibungkus envelope.
  // Field request BELUM diverifikasi dokumen resmi (DeliveryTask -- API
  // inisiasi -- tidak ada halaman API di bagian B, cuma contoh respons di
  // bagian C). Tipe `data.code` DIPERBAIKI ke number (contoh resmi: `0`,
  // bukan string) -- ditemukan saat mencocokkan ke bagian C.
  deliveryTask(payload: {
    sn: string;
    delivery_sort?: string;
    execute_task?: unknown;
    trays: Array<{ destinations: Array<{ destination: string; type?: string }> }>;
  }) {
    return this.request<
      PuduEnvelope<{ code?: number; message?: string; task_id?: string; task_status?: string; queue_no?: number }>
    >("POST", "/open-platform-service/v1/delivery_task", { body: payload });
  }
}
