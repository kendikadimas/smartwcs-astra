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
  ) {
    super(message);
    this.name = "PuduApiError";
  }
}

interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

export class PuduClient {
  constructor(private readonly config: PuduClientConfig) {}

  private async request<T>(method: "GET" | "POST", path: string, opts: RequestOptions = {}): Promise<T> {
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
          throw new PuduApiError(`PUDU API ${method} ${path} gagal: HTTP ${res.status} ${text}`, res.status);
        }
        return (await res.json()) as T;
      } catch (err) {
        clearTimeout(timeoutId);
        lastErr = err;
        logger.warn(
          { method, path, attempt, errMessage: err instanceof Error ? err.message : String(err) },
          "pudu client request gagal",
        );
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  /** Uji signature pertama kali, sesuai PUDU_INTEGRATION.md bagian 3 poin 4. */
  healthCheck() {
    return this.request<unknown>("GET", "/data-open-platform-service/v1/api/healthCheck");
  }

  getStoreList(params: { limit?: number; offset?: number } = {}) {
    return this.request<{
      count: number;
      trace_id?: string;
      list: Array<{ shop_id: string; shop_name?: string; company_id?: string; company_name?: string }>;
    }>("GET", "/data-open-platform-service/v1/api/shop", { query: params });
  }

  storeRobotList(params: { limit?: number; offset?: number; shop_id?: string } = {}) {
    return this.request<{
      count: number;
      trace_id?: string;
      list: Array<{
        sn: string;
        mac?: string;
        shop_id?: string;
        shop_name?: string;
        product_code?: string;
        nickname?: string;
        first_active_time?: string | number;
      }>;
    }>("GET", "/data-open-platform-service/v1/api/robot", { query: params });
  }

  getBoundRobotGroups(params: { limit?: number; offset?: number; shop_id?: string; device?: string } = {}) {
    return this.request<{
      trace_id?: string;
      groups: Array<{ group_id: string; group_name?: string; shop_id?: string; shop_name?: string }>;
    }>("GET", "/open-platform-service/v1/robot/group/list", { query: params });
  }

  getRobotsInGroup(params: { group_id: string; limit?: number; offset?: number }) {
    return this.request<{
      trace_id?: string;
      robots: Array<{ sn: string; mac?: string; robot_name?: string; shop_id?: string; shop_name?: string }>;
    }>("GET", "/open-platform-service/v1/robot/list_by_device_and_group", { query: params });
  }

  getRobotStatusV2(params: { sn?: string; mac?: string }) {
    return this.request<{
      trace_id?: string;
      message?: string;
      data: {
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
        charge_type?: string;
      };
    }>("GET", "/open-platform-service/v2/status/get_by_sn", { query: params });
  }

  initiateCallTask(payload: {
    sn: string;
    shop_id?: string;
    map_name?: string;
    point: string;
    point_type?: string;
    call_mode?: string;
    priority?: number;
    do_not_queue?: boolean;
    robot_group_ids?: string[];
    remark?: string;
  }) {
    return this.request<{ trace_id?: string; message?: string; task_id?: string; queue?: number; state?: string }>(
      "POST",
      "/open-platform-service/v1/custom_call",
      { body: payload },
    );
  }

  deliveryTask(payload: {
    sn: string;
    delivery_sort?: string;
    execute_task?: unknown;
    trays: Array<{ destinations: Array<{ destination: string; type?: string }> }>;
  }) {
    return this.request<{
      trace_id?: string;
      message?: string;
      data?: { code?: string; message?: string; task_id?: string; task_status?: string; queue_no?: number };
    }>("POST", "/open-platform-service/v1/delivery_task", { body: payload });
  }
}
