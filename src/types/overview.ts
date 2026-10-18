export type RobotStatus = 'Idle' | 'Running' | 'Charging' | 'Offline';
export type RobotLink = 'Online' | 'Lost' | 'Degraded';

export interface RobotFleetItem {
  id: string;
  status: RobotStatus;
  task: string;
  battery: number;
  link: RobotLink;
}

export interface EquipmentHealthCategory {
  name: string;
  ready: number;
  total: number;
  note?: string;
  status: 'ready' | 'fault';
}

export interface IntegrationAdapter {
  name: string;
  role: string;
  status: 'connected' | 'error' | 'disconnected';
}

export interface ActiveTaskMini {
  id: string;
  type: string;
  source: string;
  destination: string;
  priority: 'Normal' | 'High' | 'Low';
  status: 'Running' | 'Delayed' | 'Queued';
  resource: string;
}

export interface TaskDistributionItem {
  type: string;
  count: number;
  percentage: number;
}

export interface RecentEventItem {
  time: string;
  text: string;
  highlight: string;
}

export interface ActiveAlarmItem {
  id: string;
  title: string;
  time: string;
  description: string;
  severity: 'critical' | 'warning';
  acknowledged: boolean;
}

export interface HourlyCompletionItem {
  hour: string;
  completed: number;
  isPartial?: boolean;
}

export interface OverviewMetrics {
  activeTasks: number;
  runningTasks: number;
  queuedTasks: number;
  completedToday: number;
  sinceTime: string;
  inProgress: number;
  inProgressBreakdown: string;
  waiting: number;
  waitingReason: string;
  delayed: number;
  delayedNote: string;
  fleetAvailability: number;
  fleetRatio: string;
}
