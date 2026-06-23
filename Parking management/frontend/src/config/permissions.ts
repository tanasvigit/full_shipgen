import type { UserRole } from '../types';

export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  PARKING_STATUS_VIEW: 'parking.status.view',
  PARKING_MANAGE: 'parking.manage',
  VEHICLE_MONITORING: 'vehicle.monitoring',
  ENTRY_EXIT_MONITORING: 'entry_exit.monitoring',
  RECENT_TICKETS: 'recent.tickets',
  QR_MONITORING: 'qr.monitoring',
  REPORTS_VIEW: 'reports.view',
  REPORTS_ADMIN: 'reports.admin',
  OPERATOR_ACTIVITY: 'operator.activity',
  VEHICLE_SEARCH: 'vehicle.search',
  OCCUPANCY_ANALYTICS: 'occupancy.analytics',
  FLOORS_MANAGE: 'floors.manage',
  FLOORS_MONITOR: 'floors.monitor',
  FLOORS_SUMMARY: 'floors.summary',
  USERS_MANAGE: 'users.manage',
  ROLES_MANAGE: 'roles.manage',
  PRICING_CONFIGURE: 'pricing.configure',
  HARDWARE_CONFIGURE: 'hardware.configure',
  AUDIT_VIEW: 'audit.view',
  SETTINGS_MANAGE: 'settings.manage',
  SYSTEM_CONFIGURE: 'system.configure',
  SECURITY_SETTINGS: 'security.settings',
  TICKETS_CREATE: 'tickets.create',
  PAYMENTS_COLLECT: 'payments.collect',
  QR_PRINT: 'qr.print',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const SUPERVISOR_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.PARKING_STATUS_VIEW,
  PERMISSIONS.VEHICLE_MONITORING,
  PERMISSIONS.ENTRY_EXIT_MONITORING,
  PERMISSIONS.RECENT_TICKETS,
  PERMISSIONS.QR_MONITORING,
  PERMISSIONS.REPORTS_VIEW,
  PERMISSIONS.OPERATOR_ACTIVITY,
  PERMISSIONS.VEHICLE_SEARCH,
  PERMISSIONS.OCCUPANCY_ANALYTICS,
  PERMISSIONS.FLOORS_MONITOR,
];

const OPERATOR_PERMISSIONS: Permission[] = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.TICKETS_CREATE,
  PERMISSIONS.PAYMENTS_COLLECT,
  PERMISSIONS.QR_PRINT,
  PERMISSIONS.VEHICLE_SEARCH,
  PERMISSIONS.RECENT_TICKETS,
  PERMISSIONS.SETTINGS_MANAGE,
  PERMISSIONS.FLOORS_SUMMARY,
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...SUPERVISOR_PERMISSIONS,
  ...OPERATOR_PERMISSIONS,
  PERMISSIONS.PARKING_MANAGE,
  PERMISSIONS.FLOORS_MANAGE,
  PERMISSIONS.REPORTS_ADMIN,
  PERMISSIONS.USERS_MANAGE,
  PERMISSIONS.ROLES_MANAGE,
  PERMISSIONS.PRICING_CONFIGURE,
  PERMISSIONS.HARDWARE_CONFIGURE,
  PERMISSIONS.AUDIT_VIEW,
  PERMISSIONS.SYSTEM_CONFIGURE,
  PERMISSIONS.SECURITY_SETTINGS,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  supervisor: SUPERVISOR_PERMISSIONS,
  operator: OPERATOR_PERMISSIONS,
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getDashboardPath(role: UserRole): string {
  return `/${role}/dashboard`;
}
