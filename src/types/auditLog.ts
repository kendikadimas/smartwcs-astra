export type AuditActionCategory =
  | 'TASK_MUTATION'
  | 'ALARM_ACTION'
  | 'EQUIPMENT_CONTROL'
  | 'SECURITY_USER'
  | 'SYSTEM_CONFIG'
  | 'INTEGRATION_SYNC';

export interface AuditLogItem {
  auditId: string;
  userId: string;
  username: string;
  userFullName: string;
  roleName: string;
  action: string;
  actionCategory: AuditActionCategory;
  targetType: string;
  targetId: string;
  targetLabel: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  result: 'SUCCESS' | 'FAILED';
  ipAddress: string;
  userAgent?: string;
  occurredAt: string;
  notes?: string;
}

export interface AuditLogFilterState {
  search: string;
  category: string;
  result: string;
  timeRange: string;
}

export interface AuditMetrics {
  totalEventsToday: number;
  criticalOverrides: number;
  securityMutations: number;
  successRate: number;
}
