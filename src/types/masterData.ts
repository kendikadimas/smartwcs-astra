export type MasterCategoryKey =
  | 'robots'
  | 'equipment'
  | 'locations'
  | 'materials'
  | 'task-types'
  | 'zones'
  | 'charging-stations'
  | 'conveyors'
  | 'racks'
  | 'workstations'
  | 'routes';

export type RobotMasterStatus = 'Idle' | 'Running' | 'Charging' | 'Offline' | 'Fault';

export interface RobotMasterItem {
  id: string;
  name: string;
  type: string; // AMR, AMR Forklift, Tugger
  model: string; // Astra 600, PUDU T300, Astra Lift, Toyota Traigo
  status: RobotMasterStatus;
  battery: number; // 0 - 100
  currentLocation: string; // e.g. RMW-A01, ASSY-02
  currentTask: string; // e.g. Transport to ASSY-02, —
  taskIcon?: 'box' | 'zap' | 'alert' | 'none';
  vendor: string; // Astra Robotics, Pudu Robotics, Toyota Material Handling
  protocol: string; // VDA5050 v2.0, Modbus TCP, Proprietary RCS
  maxPayloadKg: number;
  lastUpdate: string; // 10:23:15
  lastUpdateDate: string; // 16 Jun 2025
}

export type EquipmentMasterStatus = 'Online' | 'Offline' | 'Error' | 'Maintenance';

export interface EquipmentMasterItem {
  id: string;
  name: string;
  equipmentType: string; // Conveyor, Lifter, Pallet Wrapper, PLC Gateway, Barcode Scanner
  location: string;
  vendor: string;
  status: EquipmentMasterStatus;
  integrationSource: string; // OPC UA, Modbus TCP, REST API
  capabilities: string[];
  lastHeartbeat: string;
  lastUpdateDate: string;
}

export type LocationMasterStatus = 'Active' | 'Inactive' | 'Occupied' | 'Reserved';

export interface LocationMasterItem {
  id: string;
  code: string;
  name: string;
  zone: string;
  locationType: string; // Storage Bay, Pickup Point, Dropoff Point, Charging Dock, Staging Lane
  status: LocationMasterStatus;
  maxCapacityKg: number;
  nodeId?: string;
  coordinates: string; // e.g. [X: 12.5, Y: 14.0]
  lastUpdateDate: string;
}

export interface MaterialMasterItem {
  id: string;
  sku: string;
  name: string;
  materialType: string; // Raw Material, Finished Goods, Packaging, Spare Parts
  unit: string; // PCS, BOX, PALLET, DRUM
  availableQty: number;
  inUseQty: number;
  weightKg: number;
  status: 'Available' | 'Low Stock' | 'Allocated';
  lastUpdateDate: string;
}

export interface ZoneMasterItem {
  id: string;
  code: string;
  name: string;
  zoneType: string; // Inbound, Outbound, Storage, Production, Quarantine
  warehouse: string;
  areaM2: number;
  locationCount: number;
  status: 'Active' | 'Restricted';
  lastUpdateDate: string;
}

export interface ChargingStationMasterItem {
  id: string;
  name: string;
  zone: string;
  dockCount: number;
  availableDocks: number;
  powerKw: number;
  inUseRobot?: string;
  status: 'Online' | 'Maintenance' | 'Offline';
  lastUpdateDate: string;
}

export interface TaskTypeMasterItem {
  id: string;
  code: string;
  name: string;
  defaultPriority: 'High' | 'Medium' | 'Low';
  timeoutSec: number;
  allowedResource: 'EQUIPMENT' | 'ROBOT' | 'ANY';
  status: 'Active' | 'Inactive';
  description: string;
}

export interface ConveyorMasterItem {
  id: string;
  name: string;
  line: string;
  speedMps: number;
  direction: 'Uni-directional' | 'Bi-directional';
  zone: string;
  status: 'Running' | 'Stopped' | 'Fault';
  lastUpdateDate: string;
}

export interface RackMasterItem {
  id: string;
  code: string;
  zone: string;
  levels: number;
  bays: number;
  totalCapacityPallets: number;
  occupiedPallets: number;
  occupancyPercent: number;
  status: 'Active' | 'Full' | 'Maintenance';
  lastUpdateDate: string;
}

export interface WorkstationMasterItem {
  id: string;
  name: string;
  workstationType: string; // Quality Inspection, Packing & Labeling, Assembly Line
  zone: string;
  operatorAssigned?: string;
  status: 'Active' | 'Idle' | 'Offline';
  lastUpdateDate: string;
}

export interface RouteMasterItem {
  id: string;
  name: string;
  origin: string;
  destination: string;
  resourceType: 'ROBOT' | 'EQUIPMENT' | 'BOTH';
  distanceMeters: number;
  status: 'Active' | 'Blocked';
  lastUpdateDate: string;
}

export interface MasterDataKpis {
  robots: { total: number; active: number; offline: number; fault: number };
  equipment: { total: number; online: number; offline: number };
  locations: { total: number; active: number; inactive: number };
  materials: { total: number; available: number; inUse: number };
  taskTypes: { total: number; activeCount: number };
  userRoles: { total: number; configuredCount: number };
}

export interface MasterDataFilterState {
  search: string;
  status: string;
  type: string;
  model: string;
  location: string;
  // Extended filters
  vendor: string;
  batteryMin: number;
  batteryMax: number;
}
