export type AlarmSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlarmState = 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED';

export type AlarmCategory =
  | 'COLLISION_OBSTACLE'
  | 'HARDWARE_FAULT'
  | 'COMMUNICATION_LOSS'
  | 'BATTERY_CRITICAL'
  | 'TASK_DELAY'
  | 'SAFETY_ESTOP'
  | 'INTEGRATION_ERROR';

export type AlarmSourceType =
  | 'AMR'
  | 'PLC_CONVEYOR'
  | 'PLC_LIFT'
  | 'RCS_GATEWAY'
  | 'WMS_ADAPTER'
  | 'WCS_DISPATCHER';

export interface AlarmItem {
  id: string; // e.g. ALM-101
  code: string; // e.g. ERR-AMR-3004
  title: string;
  description: string;
  severity: AlarmSeverity;
  state: AlarmState;
  category: AlarmCategory;
  sourceType: AlarmSourceType;
  sourceId: string; // AMR-04, LIFT-01, etc.
  sourceLocation: string; // e.g. Dispatch Staging (Aisle B2)
  facility: string; // Main Warehouse · Bekasi
  taskId?: string; // T-005
  missionId?: string; // DSP-104
  occurredAt: string;
  elapsedDuration: string;
  durationMinutes: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  acknowledgementNote?: string;
  clearedBy?: string;
  clearedAt?: string;
  clearedReason?: string;
  recommendedAction: string;
  // Alignment with docs/Data per menu dashboard WCS: Event.payload
  rawPayload: Record<string, any>;
  externalErrorId?: string;
  externalLevel?: string;
}

export interface TelemetryEventItem {
  id: string;
  occurredAt: string;
  eventType: string;
  source: string;
  sourceType: AlarmSourceType;
  severity: AlarmSeverity;
  message: string;
  taskId?: string;
  payload: Record<string, any>;
}

export interface AlarmMetrics {
  activeCritical: number;
  activeWarnings: number;
  acknowledged: number;
  clearedToday: number;
  mttaSec: number; // Mean Time to Acknowledge in seconds
  mttrMin: number; // Mean Time to Resolve in minutes
  totalActive: number;
}

export interface AlarmFilterState {
  search: string;
  tab: 'ALL' | 'ACTIVE' | 'ACKNOWLEDGED' | 'CLEARED' | 'EVENTS';
  severity: 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO';
  sourceType: 'ALL' | 'AMR' | 'PLC_CONVEYOR' | 'PLC_LIFT' | 'RCS_GATEWAY' | 'WMS_ADAPTER';
  timeRange: 'ALL' | 'TODAY' | 'LAST_24H' | 'LAST_7D';
}
