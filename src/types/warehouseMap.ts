export interface MapPoint {
  x: number;
  y: number;
  z?: number;
}

export interface IsometricZone {
  id: string;
  name: string;
  code: 'RMW' | 'ASSEMBLY' | 'FGW' | 'STAGING' | 'CHARGING';
  gx: number; // grid X
  gy: number; // grid Y
  gw: number; // grid width in tiles
  gh: number; // grid height in tiles
  color: string;
  borderColor: string;
  label: string;
}

export interface IsometricRack {
  id: string;
  zone: string;
  gx: number;
  gy: number;
  gw: number;
  gh: number;
  height: number; // visual height in pixels
  tiers: number;
  occupancy: number; // 0 to 100%
  color: string;
}

export interface IsometricRobot {
  id: string;
  name: string;
  model: string;
  status: 'Moving' | 'Idle' | 'Charging' | 'Offline';
  battery: number;
  speed: number; // m/s
  temperature: number; // °C
  currentTask?: string;
  source?: string;
  destination?: string;
  payload?: {
    id: string;
    name: string;
    weightKg: number;
  };
  gx: number;
  gy: number;
  headingAngle: number; // degrees 0-360
  pathWaypoints: MapPoint[];
  currentWaypointIdx: number;
  linkStatus: 'Online' | 'Lost';
  color: string;
}

export interface IsometricChargingBay {
  id: string;
  gx: number;
  gy: number;
  status: 'available' | 'occupied' | 'fault';
  occupiedBy?: string;
}

export interface MapLayerState {
  racks: boolean;
  routes: boolean;
  robots: boolean;
  chargingBays: boolean;
  safetyZones: boolean;
  labels: boolean;
}
