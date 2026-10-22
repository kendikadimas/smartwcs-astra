export type KpiTimeRange = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth';
export type KpiShift = 'all' | 'shift1' | 'shift2' | 'shift3';
export type KpiZone = 'all' | 'zone-a' | 'zone-b' | 'zone-c';

export interface KpiFilterState {
  warehouse: string;
  timeRange: KpiTimeRange;
  shift: KpiShift;
  zone: KpiZone;
  searchQuery?: string;
}

export interface KpiTopMetrics {
  totalThroughput: number;
  throughputDiff: string;
  throughputUnit: string;
  successRate: number;
  successRateSub: string;
  avgCycleTime: string;
  cycleTimeDiff: string;
  fleetUtilization: number;
  fleetUtilizationSub: string;
  alarmMttr: string;
  alarmMttrSub: string;
  totalMileageKm: number;
  mileageSub: string;
}

export interface ThroughputTrendPoint {
  time: string;
  target: number;
  completed: number;
  failed: number;
  volumeKg: number;
}

export interface FleetUtilizationItem {
  robotId: string;
  robotName: string;
  model: string;
  movingPercent: number;
  idlePercent: number;
  chargingPercent: number;
  errorPercent: number;
  totalMissions: number;
  mileageKm: number;
  batteryStatus: number;
}

export interface AlarmParetoItem {
  rank: number;
  category: string;
  code: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
  avgResolutionTime: string;
  primarySource: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
}

export interface CycleTimeBreakdownItem {
  taskType: string;
  avgMinutes: number;
  avgFormatted: string;
  p95Minutes: number;
  p95Formatted: string;
  slaLimitMinutes: number;
  slaComplianceRate: number;
  totalTasks: number;
}

export interface ShiftReportItem {
  id: string;
  date: string;
  shift: string;
  shiftHours: string;
  warehouse: string;
  totalTasks: number;
  completed: number;
  failed: number;
  avgCycleTime: string;
  fleetAvailability: string;
  mileageKm: number;
  alarmCount: number;
  supervisor: string;
  complianceRate: number;
  status: 'EXCELLENT' | 'NORMAL' | 'ATTENTION';
}
