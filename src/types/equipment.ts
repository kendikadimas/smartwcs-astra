// Equipment & Resources Types according to docs/Data per menu dashboard WCS apa yang tampil dan dari mana.md

export type RobotOperationalState = 'Idle' | 'Working' | 'Paused' | 'Error';
export type RobotMoveState = 'Stopped' | 'Moving' | 'Rotating' | 'Docking';
export type ChargingStage = 'None' | 'Trickle' | 'ConstantCurrent' | 'Floating' | 'Full';

export interface RobotStatusLogEntry {
  timestamp: string;
  status: string;
  durationMinutes: number;
  description: string;
}

export interface RobotResourceItem {
  id: string; // e.g. 'AMR-01'
  name: string; // 'Heavy Transport AMR #1'
  model: string; // 'PUDU T600 Industrial AMR'
  vendor: string; // 'Pudu Robotics'
  serialNumber: string; // 'SN-PUDU-T600-8821'
  robotType: string; // 'Heavy Transport AMR' | 'Assembly Shuttle AMR' | 'Tote Runner'
  
  // Status robot terkini (PuduRobotState)
  online: boolean;
  runState: RobotOperationalState;
  moveState: RobotMoveState;
  battery: number; // 0 - 100
  isCharging: boolean;
  chargeStage: ChargingStage;
  
  // Posisi terakhir (PuduRobotState.x, y, yaw, lastPoseAt)
  x: number;
  y: number;
  yaw: number;
  lastPoseAt: string;
  currentMapId: string;
  currentMapName: string;
  
  // Task & Performance (WCS & PuduPoseLog)
  currentTaskId?: string;
  currentTaskName?: string;
  speedMps: number; // Dihitung WCS dari PuduPoseLog
  totalDistanceMeters: number; // Dihitung WCS dari PuduPoseLog
  totalRunHours: number;
  
  // Hardware & Specs
  maxPayloadKg: number;
  currentPayloadKg?: number;
  ipAddress: string;
  firmwareVersion: string;
  adapterChannel: 'RCS / PUDU Cloud API' | 'PLC Modbus TCP' | 'PLC OPC UA';
  
  // Riwayat Status (PuduRobotStatusLog)
  recentStatusLogs?: RobotStatusLogEntry[];
}

export interface ChargingStationResource {
  id: string;
  name: string;
  code: string;
  zone: string;
  dockCount: number;
  occupiedCount: number;
  powerKw: number;
  voltageV: number;
  currentA: number;
  status: 'Available' | 'Busy' | 'Maintenance' | 'Fault';
  dockedRobots: Array<{
    robotId: string;
    battery: number;
    chargeStage: ChargingStage;
    chargingSince: string;
  }>;
}

export interface ConveyorResource {
  id: string;
  name: string;
  code: string;
  zone: string;
  type: 'Roller' | 'Belt' | 'Chain';
  status: 'Operating' | 'Ready' | 'Fault' | 'Maintenance';
  speedMps: number;
  direction: 'Forward' | 'Reverse' | 'Stopped';
  activeLoad?: string;
  plcProtocol: 'Modbus TCP' | 'OPC UA';
  plcGatewayIp: string;
  emergencyStop: boolean;
}

export interface LifterResource {
  id: string;
  name: string;
  code: string;
  zone: string;
  status: 'Ready' | 'Operating' | 'Fault' | 'Maintenance';
  levelCurrent: number;
  levelTarget: number;
  maxLevels: number;
  doorInterlock: 'Locked' | 'Open' | 'Tripped';
  activeLoad?: string;
}

export interface TransferStationResource {
  id: string;
  name: string;
  code: string;
  zone: string;
  status: 'Ready' | 'Transferring' | 'SensorBlocked' | 'Offline';
  opticalSensorsOk: boolean;
  activePalletId?: string;
}

export interface EquipmentMetrics {
  totalRobots: number;
  robotsOnline: number;
  robotsMoving: number;
  robotsCharging: number;
  robotsFault: number;
  avgFleetBattery: number;
  totalChargingStations: number;
  chargingDocksAvailable: number;
  conveyorsOperating: number;
  conveyorsTotal: number;
  activeAlarmsCount: number;
}

export interface EquipmentFilterState {
  tab: 'all' | 'robots' | 'conveyors' | 'lifts' | 'charging';
  search: string;
  status: string;
  zone: string;
}
