export type RoleName =
  | 'WAREHOUSE_OPERATOR'
  | 'WAREHOUSE_SUPERVISOR'
  | 'WCS_ADMINISTRATOR'
  | 'MAINTENANCE_ENGINEER'
  | 'SYSTEM_INTEGRATOR'
  | 'OPERATOR_PRODUKSI'
  | 'OPERATOR_PACKAGING'
  | 'OPERATOR_DELIVERY';

export interface UserItem {
  userId: string;
  username: string;
  fullName: string;
  email: string;
  roleName: RoleName;
  roleLabel: string;
  active: boolean;
  shift: string;
  lastLoginAt: string;
  createdAt: string;
  avatarColor: string;
}

export interface RoleDefinition {
  roleId: string;
  name: RoleName;
  label: string;
  description: string;
  category: 'STANDARD' | 'PROPOSED';
  usersCount: number;
  badgeTheme: { bg: string; text: string; border: string };
  permissionsCount: number;
}

export interface PermissionMatrixRow {
  moduleName: string;
  feature: string;
  roles: Record<RoleName, 'FULL' | 'READ_WRITE' | 'READ_ONLY' | 'NONE'>;
}

export interface UserFilterState {
  search: string;
  role: string;
  status: string;
}
