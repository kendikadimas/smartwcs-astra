import { logger } from "../../../lib/logger";
import { buildPathAndParameters, buildEncodedQueryString, signRequest } from "./signing";
import {
  storeMapListDataSchema,
  availableMapsDataSchema,
  currentMapDataSchema,
  getMapDetailV2DataSchema,
  getCurrentMapPointsDataSchema,
  parseMapData,
} from "./map-schemas";

export interface PuduClientConfig {
  baseUrl: string;
  apiAppKey: string;
  apiAppSecret: string;
  /** Header Language untuk konsistensi respon PUDU (mis. "en_US"). */
  language?: string;
  timeoutMs?: number;
  maxRetries?: number;
  /** Override fetch implementation (digunakan pada unit testing). */
  fetchImpl?: typeof fetch;
}

export class PuduApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    /** Kode error respon dari envelope PUDU jika ada (mis. "CLOUD_OPEN_ROBOT_OFFLINE"). */
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
 * Format amplop (envelope) standar respon PUDU Open API: { trace_id, message, data }.
 */
export interface PuduEnvelope<T = unknown> {
  trace_id?: string;
  message: string;
  data?: T;
}

// Kode error bisnis PUDU yang bersifat sementara (dapat di-retry).
const RETRYABLE_BUSINESS_CODES = new Set(["CLOUD_OPEN_WAIT", "CLOUD_OPEN_TIMEOUT", "SYSTEM_ERROR"]);

export class PuduClient {
  constructor(private readonly config: PuduClientConfig) {}

  private async request<T extends PuduEnvelope>(
    method: "GET" | "POST",
    path: string,
    opts: RequestOptions = {},
  ): Promise<T> {
    // Susun path lengkap dan query untuk pembuatan signature HMAC
    const fullPathname = new URL(this.config.baseUrl + path).pathname;
    const pathAndParameters = buildPathAndParameters(fullPathname, opts.query);
    // Query string URL di-encode (spasi menjadi %20)
    const encodedQuery = buildEncodedQueryString(opts.query);
    const url = new URL(this.config.baseUrl + path + (encodedQuery ? `?${encodedQuery}` : ""));

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
        // Log request tanpa mengekspos header otorisasi sensitif
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
            // Ambil header respons untuk keperluan penelusuran signature server jika 401
            const responseHeaders: Record<string, string> = {};
            for (const [key, value] of res.headers.entries()) responseHeaders[key] = value;
            logger.warn(
              { method, path, responseHeaders },
              "pudu client 401 -- periksa kesesuaian signature dan kredensial",
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
        // Pengecekan status sukses pada envelope (case-insensitive)
        if (envelope.message.toUpperCase() !== "SUCCESS") {
          // Error bisnis dari gateway PUDU
          const businessErr = new PuduApiError(
            `PUDU API ${method} ${path} gagal: ${envelope.message}`,
            res.status,
            envelope.message,
            envelope.trace_id,
          );
          if (!RETRYABLE_BUSINESS_CODES.has(envelope.message)) {
            throw businessErr;
          }
          throw businessErr;
        }

        return envelope as T;
      } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof PuduApiError && err.code && !RETRYABLE_BUSINESS_CODES.has(err.code)) {
          throw err;
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

  /** Uji koneksi dan validasi signature autentikasi ke PUDU Cloud API. */
  healthCheck() {
    return this.request<PuduEnvelope>("GET", "/data-open-platform-service/v1/api/healthCheck");
  }

  /** Mengambil daftar toko/shop yang terdaftar di akun PUDU (berpaginasi). */
  getStoreList(params: { limit?: number; offset?: number } = {}) {
    return this.request<
      PuduEnvelope<{
        count: number;
        list: Array<{ shop_id: string; shop_name?: string; company_id?: string; company_name?: string }>;
      }>
    >("GET", "/data-open-platform-service/v1/api/shop", { query: params });
  }

  /** Mengambil daftar robot yang terhubung pada suatu toko/shop. */
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

  /** Mengambil daftar grup robot yang terdaftar pada toko/shop. */
  getBoundRobotGroups(params: { limit?: number; offset?: number; shop_id?: string; device?: string } = {}) {
    return this.request<
      PuduEnvelope<{ groups: Array<{ group_id: string; group_name?: string; shop_id?: string; shop_name?: string }> }>
    >("GET", "/open-platform-service/v1/robot/group/list", { query: params });
  }

  /** Mengambil daftar robot yang tergabung dalam suatu grup robot tertentu. */
  getRobotsInGroup(params: { group_id: string; limit?: number; offset?: number }) {
    return this.request<
      PuduEnvelope<{ robots: Array<{ sn: string; mac?: string; robot_name?: string; shop_id?: string; shop_name?: string }> }>
    >("GET", "/open-platform-service/v1/robot/list_by_device_and_group", { query: params });
  }

  /** Mengambil status real-time robot berdasarkan Serial Number (SN) atau MAC. */
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

  /** Memanggil robot ke satu titik target lokasi tertentu (Call Task). */
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

  /** Membatalkan tugas pemanggilan robot (Cancel Call Task). */
  cancelCallTask(payload: { task_id?: string; sn?: string; is_auto_back?: boolean }) {
    return this.request<PuduEnvelope>("POST", "/open-platform-service/v1/custom_call/cancel", { body: payload });
  }

  /** Menyelesaikan tugas pemanggilan robot lebih awal (Complete Call Task). */
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

  /** Mengambil daftar riwayat tugas pemanggilan robot (Get Call List) untuk pemantauan/rekonsiliasi. */
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
        // Parameter status dipisahkan koma jika berupa array
        status: params.status?.join(","),
      },
    });
  }

  /** Mengaktifkan perintah pelaporan posisi berkala dari robot ke WCS (Notify Robot Report Position). */
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

  /** Mengambil daftar seluruh peta yang tersimpan di toko/shop. */
  async storeMapList(params: { shop_id?: string } = {}) {
    const envelope = await this.request<PuduEnvelope<unknown>>("GET", "/data-open-platform-service/v1/api/maps", {
      query: params,
    });
    return {
      ...envelope,
      data: envelope.data === undefined ? undefined : parseMapData(storeMapListDataSchema, envelope.data, "StoreMapList"),
    };
  }

  /** Mengambil daftar peta yang tersedia dan status aktifnya pada robot tertentu. */
  async availableMaps(params: { sn: string }) {
    const envelope = await this.request<PuduEnvelope<unknown>>("GET", "/map-service/v1/open/list", { query: params });
    return {
      ...envelope,
      data: envelope.data === undefined ? undefined : parseMapData(availableMapsDataSchema, envelope.data, "AvailableMaps"),
    };
  }

  /** Mengambil detail lengkap peta beserta daftar elemen/titik koordinatnya (Get Map Detail V2). */
  async getMapDetailV2(params: { map_name: string }) {
    const envelope = await this.request<PuduEnvelope<unknown>>("GET", "/map-service/v1/open/map", { query: params });
    return {
      ...envelope,
      data: envelope.data === undefined ? undefined : parseMapData(getMapDetailV2DataSchema, envelope.data, "GetMapDetailV2"),
    };
  }

  /** Mengambil informasi peta yang sedang aktif pada robot tertentu. */
  async currentMap(params: { sn: string }) {
    const envelope = await this.request<PuduEnvelope<unknown>>("GET", "/map-service/v1/open/current", { query: params });
    return {
      ...envelope,
      data: envelope.data === undefined ? undefined : parseMapData(currentMapDataSchema, envelope.data, "CurrentMap"),
    };
  }

  /** Mengambil daftar titik koordinat (points) dari peta tertentu. */
  async getCurrentMapPoints(params: { map_name?: string } = {}) {
    const envelope = await this.request<PuduEnvelope<unknown>>("GET", "/map-service/v1/open/point", { query: params });
    return {
      ...envelope,
      data:
        envelope.data === undefined ? undefined : parseMapData(getCurrentMapPointsDataSchema, envelope.data, "GetCurrentMapPoints"),
    };
  }

  /** Mengirimkan tugas pengantaran barang multi-destinasi/tray ke robot (Delivery Task). */
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
