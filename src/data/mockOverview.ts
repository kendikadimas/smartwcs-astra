import {
  OverviewMetrics,
  RobotFleetItem,
  EquipmentHealthCategory,
  IntegrationAdapter,
  ActiveTaskMini,
  TaskDistributionItem,
  RecentEventItem,
  ActiveAlarmItem,
  HourlyCompletionItem,
} from '@/types/overview';

export const mockOverviewMetrics: OverviewMetrics = {
  activeTasks: 12,
  runningTasks: 8,
  queuedTasks: 4,
  completedToday: 32,
  sinceTime: 'Since 00:00 WIB',
  inProgress: 8,
  inProgressBreakdown: '6 AMR · 1 PUDU · 1 PLC',
  waiting: 4,
  waitingReason: 'Awaiting eligible resource',
  delayed: 2,
  delayedNote: 'Overlapping active-task flag',
  fleetAvailability: 65,
  fleetRatio: '13 / 20 dispatch-eligible',
};

export const mockRobotFleet: RobotFleetItem[] = [
  { id: 'AMR-01', status: 'Idle', task: '—', battery: 82, link: 'Online' },
  { id: 'AMR-02', status: 'Running', task: 'T-001', battery: 61, link: 'Online' },
  { id: 'AMR-03', status: 'Charging', task: '—', battery: 25, link: 'Online' },
  { id: 'AMR-04', status: 'Offline', task: 'T-005', battery: 18, link: 'Lost' },
  { id: 'PUDU-01', status: 'Running', task: 'T-006', battery: 66, link: 'Online' },
];

export const mockEquipmentHealth: EquipmentHealthCategory[] = [
  { name: 'Conveyors', ready: 8, total: 8, status: 'ready' },
  { name: 'Lifts', ready: 2, total: 3, note: 'LIFT-01 fault', status: 'fault' },
  { name: 'Transfer stations', ready: 8, total: 8, status: 'ready' },
];

export const mockIntegrationAdapters: IntegrationAdapter[] = [
  { name: 'WMS', role: 'Inventory / orders', status: 'connected' },
  { name: 'RCS', role: 'Robot execution', status: 'connected' },
  { name: 'PLC', role: 'Equipment control', status: 'connected' },
];

export const mockActiveTasksMini: ActiveTaskMini[] = [
  { id: 'T-001', type: 'Transport', source: 'RMW-A01', destination: 'ASSY-02', priority: 'Normal', status: 'Running', resource: 'AMR-02' },
  { id: 'T-005', type: 'Delivery', source: 'ASSY-03', destination: 'FGW-01', priority: 'High', status: 'Delayed', resource: 'AMR-04' },
  { id: 'T-003', type: 'Delivery', source: 'ASSY-01', destination: 'FGW-01', priority: 'High', status: 'Queued', resource: 'Unassigned' },
  { id: 'T-006', type: 'Pickup', source: 'RMW-A03', destination: 'ASSY-01', priority: 'Normal', status: 'Running', resource: 'PUDU-01' },
];

export const mockTaskDistribution: TaskDistributionItem[] = [
  { type: 'Transport', count: 6, percentage: 60 },
  { type: 'Pickup', count: 3, percentage: 30 },
  { type: 'Delivery', count: 2, percentage: 20 },
  { type: 'Docking', count: 1, percentage: 10 },
];

export const mockRecentEvents: RecentEventItem[] = [
  { time: '10:23:15', text: 'T-006 started · PUDU-01', highlight: 'PUDU-01' },
  { time: '10:21:48', text: 'T-001 assigned · AMR-02', highlight: 'AMR-02' },
  { time: '10:20:06', text: 'T-002 completed · FGW-02', highlight: 'FGW-02' },
];

export const mockActiveAlarms: ActiveAlarmItem[] = [
  {
    id: 'ALM-101',
    title: 'AMR-04 · connection lost',
    time: '10:19:33',
    description: 'T-005 stalled · Unacknowledged',
    severity: 'critical',
    acknowledged: false,
  },
  {
    id: 'ALM-102',
    title: 'LIFT-01 · controller-reported fault',
    time: '09:48:21',
    description: 'Equipment unavailable · Acknowledged',
    severity: 'warning',
    acknowledged: true,
  },
];

export const mockHourlyCompletion: HourlyCompletionItem[] = [
  { hour: '06:00', completed: 3 },
  { hour: '07:00', completed: 6 },
  { hour: '08:00', completed: 8 },
  { hour: '09:00', completed: 9 },
  { hour: '10:00*', completed: 6, isPartial: true },
];
