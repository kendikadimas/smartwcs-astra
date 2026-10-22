export type ChargingStrategy = 'NEAREST_DOCK' | 'LEAST_USED' | 'FAST_CHARGER';
export type SettingsTabKey = 'general' | 'dispatch' | 'safety' | 'retention' | 'diagnostics';

export interface GeneralSettings {
  facilityName: string;
  facilityCode: string;
  timezone: string;
  language: 'id' | 'en';
  dateFormat: string;
  autoRefreshIntervalSeconds: number;
  maintenanceMode: boolean;
}

export interface DispatchSettings {
  lowBatteryThresholdPercent: number; // e.g. 20%
  criticalBatteryThresholdPercent: number; // e.g. 10%
  maxRetryAttempts: number; // e.g. 3
  dispatchTimeoutSeconds: number; // e.g. 30
  autoReassignOnFault: boolean;
  fleetSpeedLimitMps: number; // e.g. 1.2 m/s
  chargingStrategy: ChargingStrategy;
  simultaneousMissionLimit: number;
}

export interface AlarmSafetySettings {
  audioAlertCritical: boolean;
  audioAlertWarning: boolean;
  autoPauseFleetOnEStop: boolean;
  autoClearObstacleAlertSeconds: number;
  escalationTimeoutMinutes: number;
  webhookNotificationEnabled: boolean;
  webhookNotificationUrl: string;
  criticalAlarmEmail: string;
}

export interface RetentionSettings {
  poseLogRetentionDays: number; // e.g. 60
  integrationLogRetentionDays: number; // e.g. 45
  auditLogRetentionDays: number; // e.g. 365
  eventLogRetentionDays: number; // e.g. 90
  autoArchiveEnabled: boolean;
  archiveStorageBucket: string;
}

export interface SystemDiagnostics {
  workerPollIntervalMs: number;
  workerMaxAttempts: number;
  nodeEnvironment: string;
  databaseHost: string;
  databaseStatus: 'HEALTHY' | 'DEGRADED';
  databaseConnections: number;
  socketIoStatus: 'CONNECTED' | 'DISCONNECTED';
  activeClientsCount: number;
  uptimeHours: number;
  wcsVersion: string;
}

export interface FullSystemSettings {
  general: GeneralSettings;
  dispatch: DispatchSettings;
  safety: AlarmSafetySettings;
  retention: RetentionSettings;
  diagnostics: SystemDiagnostics;
}
