import type { UserRole } from '../types';
import type { Permission } from './permissions';
import { PERMISSIONS, roleHasPermission } from './permissions';

export interface NavItemDef {
  label: string;
  path: string;
  permission: Permission;
}

export const adminNav: NavItemDef[] = [
  { label: 'Dashboard', path: '/admin/dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: 'Employee Management', path: '/admin/users', permission: PERMISSIONS.USERS_MANAGE },
  { label: 'Pricing', path: '/admin/pricing', permission: PERMISSIONS.PRICING_CONFIGURE },
  { label: 'Parking Management', path: '/admin/parking', permission: PERMISSIONS.PARKING_MANAGE },
  { label: 'Floor Management', path: '/admin/parking-floors', permission: PERMISSIONS.FLOORS_MANAGE },
  { label: 'Reports', path: '/admin/reports', permission: PERMISSIONS.REPORTS_ADMIN },
  { label: 'Hardware', path: '/admin/hardware', permission: PERMISSIONS.HARDWARE_CONFIGURE },
  { label: 'QR Monitoring', path: '/admin/qr-monitoring', permission: PERMISSIONS.QR_MONITORING },
  { label: 'Audit Logs', path: '/admin/audit-logs', permission: PERMISSIONS.AUDIT_VIEW },
  { label: 'Settings', path: '/admin/settings', permission: PERMISSIONS.SETTINGS_MANAGE },
];

export const supervisorNav: NavItemDef[] = [
  { label: 'Dashboard', path: '/supervisor/dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: 'Parking Monitoring', path: '/supervisor/monitoring', permission: PERMISSIONS.PARKING_STATUS_VIEW },
  { label: 'Floor Management', path: '/supervisor/parking-floors', permission: PERMISSIONS.FLOORS_MONITOR },
  { label: 'Vehicle Search', path: '/supervisor/vehicle-search', permission: PERMISSIONS.VEHICLE_SEARCH },
  { label: 'QR Monitoring', path: '/supervisor/qr-monitoring', permission: PERMISSIONS.QR_MONITORING },
  { label: 'Reports', path: '/supervisor/reports', permission: PERMISSIONS.REPORTS_VIEW },
  { label: 'Operator Activity', path: '/supervisor/operator-activity', permission: PERMISSIONS.OPERATOR_ACTIVITY },
  { label: 'Recent Tickets', path: '/supervisor/recent-tickets', permission: PERMISSIONS.RECENT_TICKETS },
];

export const operatorNav: NavItemDef[] = [
  { label: 'Dashboard', path: '/operator/dashboard', permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: 'Occupancy Summary', path: '/operator/occupancy', permission: PERMISSIONS.FLOORS_SUMMARY },
  { label: 'New Ticket', path: '/operator/new-ticket', permission: PERMISSIONS.TICKETS_CREATE },
  { label: 'Collect Payment', path: '/operator/collect-payment', permission: PERMISSIONS.PAYMENTS_COLLECT },
  { label: 'QR Ticket Print', path: '/operator/qr-print', permission: PERMISSIONS.QR_PRINT },
  { label: 'Vehicle Search', path: '/operator/vehicle-search', permission: PERMISSIONS.VEHICLE_SEARCH },
  { label: 'Recent Tickets', path: '/operator/recent-tickets', permission: PERMISSIONS.RECENT_TICKETS },
  { label: 'Settings', path: '/operator/settings', permission: PERMISSIONS.SETTINGS_MANAGE },
];

const NAV_BY_ROLE: Record<UserRole, NavItemDef[]> = {
  admin: adminNav,
  supervisor: supervisorNav,
  operator: operatorNav,
};

export function getNavForRole(role: UserRole): NavItemDef[] {
  return NAV_BY_ROLE[role].filter((item) => roleHasPermission(role, item.permission));
}
