import { TaskPriority, TaskType } from './task';

export type DispatchStatus =
  | 'Queued'
  | 'Assigning'
  | 'Dispatched'
  | 'Executing'
  | 'Completed'
  | 'Delayed'
  | 'Suspended'
  | 'Aborted';

export interface DispatchMission {
  id: string; // e.g., 'DSP-101'
  taskId: string; // e.g., 'T-001'
  taskType: TaskType;
  priority: TaskPriority;
  assignedResource: string; // 'AMR-02', 'PUDU-01', 'Unassigned'
  resourceType: 'AMR' | 'AGV' | 'Conveyor' | 'Lift';
  origin: string;
  destination: string;
  currentWaypoint: string;
  dispatchStatus: DispatchStatus;
  progressPercent: number;
  stepCurrent: number;
  stepTotal: number;
  stepDescription: string;
  dispatchedAt: string;
  estimatedCompletion: string;
  elapsed: string;
  batteryAtDispatch: number;
  currentBattery: number;
  speedMps: number;
  payloadId: string;
  payloadWeightKg: number;
  adapterChannel: 'RCS / PUDU Cloud API' | 'PLC Modbus TCP' | 'PLC OPC UA' | 'Internal Adapter';
  isManualDispatch: boolean;
  overrideReason?: string;
}

export interface DispatchMetrics {
  activeMissions: number;
  queuedTasks: number;
  fleetReadyCount: number;
  fleetTotalCount: number;
  avgDispatchLatencySec: number;
  autoDispatchRate: number;
  engineStatus: 'Running' | 'Paused' | 'Degraded';
}

export interface FleetResourceItem {
  id: string; // AMR-01
  name: string;
  model: string;
  status: 'Idle' | 'Moving' | 'Executing' | 'Charging' | 'Offline' | 'Fault';
  battery: number;
  isCharging: boolean;
  currentLocation: string;
  currentMissionId?: string;
  maxPayloadKg: number;
  linkStatus: 'Online' | 'Weak' | 'Lost';
}

export interface EquipmentResourceItem {
  id: string;
  name: string;
  type: 'Conveyor' | 'Lift' | 'Transfer Station';
  status: 'Ready' | 'Operating' | 'Fault' | 'Maintenance';
  zone: string;
  activeLoad?: string;
}

export interface DispatchFilterState {
  search: string;
  status: string;
  resourceType: string;
  priority: string;
}
