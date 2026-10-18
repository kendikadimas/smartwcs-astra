export type PrdTaskStatus =
  | 'CREATED'
  | 'VALIDATED'
  | 'QUEUED'
  | 'ASSIGNED'
  | 'DISPATCHED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRY'
  | 'CANCELLED';

export type TaskDisplayStatus =
  | 'Executing'
  | 'Running'
  | 'Delayed'
  | 'Queued'
  | 'Assigned'
  | 'Completed'
  | 'Failed';

export type TaskPriority = 'High' | 'Medium' | 'Normal' | 'Low';

export type TaskType = 'Transport' | 'Delivery' | 'Pickup' | 'Move' | 'Putaway';

export interface TaskItem {
  id: string;
  type: TaskType;
  origin: string;
  destination: string;
  priority: TaskPriority;
  status: TaskDisplayStatus;
  prdStatus: PrdTaskStatus;
  resource: string;
  createdAt: string;
  createdDate: string;
  elapsed: string;
  isDelayed?: boolean;
  material?: string;
  materialSku?: string;
  quantity?: number;
  containerId?: string;
  progressPercent?: number;
  failureReason?: string;
}

export interface TaskFilterState {
  search: string;
  status: string;
  taskType: string;
  priority: string;
  resource: string;
  dateRange: string;
}

export interface TaskMetrics {
  total: number;
  totalChangePercent: number;
  queued: number;
  queuedPercent: number;
  running: number;
  runningPercent: number;
  failed: number;
  failedPercent: number;
}
