export type SystemType = 'RCS' | 'WMS' | 'PLC' | 'ERP';
export type ProtocolType = 'REST' | 'MQTT' | 'OPC_UA' | 'MODBUS_TCP' | 'VDA5050';
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
export type LogDirection = 'INBOUND' | 'OUTBOUND';
export type LogStatus = 'SUCCESS' | 'PENDING' | 'FAILED' | 'IGNORED';

export interface IntegrationAdapterItem {
  id: string;
  name: string;
  systemType: SystemType;
  protocol: ProtocolType;
  endpointUrl: string;
  status: IntegrationStatus;
  latencyMs: number;
  lastTestedAt: string;
  apiKeyRotatedAt: string;
  description: string;
  scopeSummary: string;
  credentialsMasked: {
    appKey: string;
    hasSecret: boolean;
    callbackCodeConfigured: boolean;
    region?: string;
  };
  metrics: {
    todayRequests: number;
    successRate: number;
    avgLatencyMs: number;
  };
}

export interface IntegrationLogItem {
  logId: string;
  traceId: string;
  integrationId: string;
  adapterName: string;
  systemType: SystemType;
  direction: LogDirection;
  messageType: string;
  robotId?: string;
  robotName?: string;
  callbackCodeValid?: boolean;
  httpStatus?: number;
  responseCode?: string;
  status: LogStatus;
  attempts: number;
  maxAttempts: number;
  errorMessage?: string;
  occurredAt: string;
  processedAt?: string;
  headers?: Record<string, string>;
  payload: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
}

export interface IntegrationLogFilterState {
  search: string;
  system: string;
  direction: string;
  status: string;
  timeRange: string;
}

export interface IntegrationMetrics {
  totalAdapters: number;
  connectedCount: number;
  inboundToday: number;
  outboundToday: number;
  avgLatencyMs: number;
  failedRetries: number;
  lastSyncFormatted: string;
}
