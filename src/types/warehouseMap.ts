export type RobotState = 'Moving' | 'Running' | 'Idle' | 'Charging' | 'Offline';
export type RobotType = 'AMR' | 'FORKLIFT' | 'TUGGER';

export interface WarehouseRobot {
  id: string;
  name: string;
  model: string;
  type: RobotType;
  status: RobotState;
  battery: number;
  speed: number; // m/s
  temperature: number; // °C
  link: 'Online' | 'Lost';
  currentTask: string;
  taskType: string;
  load: string;
  currentLocation: string;
  nextWaypoint: string;
  eta: string;
  gx: number;
  gy: number;
  heading: number;
  path: { x: number; y: number }[];
  color: string;
}

export interface WarehouseZone {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  color: string;
  borderColor: string;
  badgeBg: string;
  badgeColor: string;
}

export interface WarehouseRack {
  id: string;
  zoneId: string;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  height: number;
  tiers: number;
  occupancy: number; // 0 to 100%
  color: string;
}

export interface MapLayerFilters {
  zones: boolean;
  racks: boolean;
  robots: boolean;
  routes: boolean;
  equipment: boolean;
  safetyZones: boolean;
}

export interface RecentEvent {
  id: string;
  time: string;
  dotColor: string;
  text: string;
  highlightText?: string;
}

export interface MapKpiSummary {
  robotsOnline: { current: number; total: number; percentage: number };
  activeTasks: { total: number; running: number; queued: number };
  charging: { count: number; resources: string };
  idle: { count: number; note: string };
  offlineFault: { count: number; resources: string };
  conveyors: { current: number; total: number; statusText: string };
}
