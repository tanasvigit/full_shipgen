import { adminNav, operatorNav, supervisorNav } from '../../src/config/navigation';
import type { AppRole } from './env';

export interface RouteDefinition {
  role: AppRole;
  path: string;
  label: string;
  heading: string;
  coverage: string[];
}

const routeHeadings: Record<string, string> = {
  '/login': 'Sign in to your account',
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'Employee Management',
  '/admin/pricing': 'Pricing',
  '/admin/parking': 'Parking Management',
  '/admin/parking-floors': 'Floor Management',
  '/admin/reports': 'Reports',
  '/admin/hardware': 'Hardware',
  '/admin/qr-monitoring': 'QR Monitoring',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/settings': 'Settings',
  '/supervisor/dashboard': 'Supervisor Dashboard',
  '/supervisor/monitoring': 'Parking Monitoring',
  '/supervisor/parking-floors': 'Floor Management',
  '/supervisor/vehicle-search': 'Vehicle Search',
  '/supervisor/qr-monitoring': 'QR Monitoring',
  '/supervisor/reports': 'Reports',
  '/supervisor/operator-activity': 'Operator Activity',
  '/supervisor/recent-tickets': 'Recent Tickets',
  '/operator/dashboard': 'Operator Dashboard',
  '/operator/occupancy': 'Occupancy Summary',
  '/operator/new-ticket': 'New Ticket',
  '/operator/collect-payment': 'Collect Payment',
  '/operator/qr-print': 'QR Ticket Print',
  '/operator/vehicle-search': 'Vehicle Search',
  '/operator/recent-tickets': 'Recent Tickets',
  '/operator/settings': 'Settings',
};

const routeCoverage: Record<string, string[]> = {
  '/login': ['auth', 'forms'],
  '/admin/dashboard': ['dashboard', 'charts'],
  '/admin/users': ['crud', 'forms', 'table', 'modal'],
  '/admin/pricing': ['forms', 'pricing'],
  '/admin/parking': ['table', 'dashboard'],
  '/admin/parking-floors': ['crud', 'forms', 'table'],
  '/admin/reports': ['dashboard', 'charts', 'buttons'],
  '/admin/hardware': ['cards', 'buttons'],
  '/admin/qr-monitoring': ['table', 'monitoring'],
  '/admin/audit-logs': ['table', 'audit'],
  '/admin/settings': ['forms'],
  '/supervisor/dashboard': ['dashboard', 'table', 'monitoring'],
  '/supervisor/monitoring': ['dashboard', 'table', 'monitoring'],
  '/supervisor/parking-floors': ['table'],
  '/supervisor/vehicle-search': ['search', 'table'],
  '/supervisor/qr-monitoring': ['monitoring', 'table'],
  '/supervisor/reports': ['dashboard', 'charts', 'buttons'],
  '/supervisor/operator-activity': ['monitoring', 'table'],
  '/supervisor/recent-tickets': ['table'],
  '/operator/dashboard': ['dashboard', 'navigation'],
  '/operator/occupancy': ['dashboard', 'table'],
  '/operator/new-ticket': ['forms', 'ticketing'],
  '/operator/collect-payment': ['payments', 'search'],
  '/operator/qr-print': ['qr', 'printing'],
  '/operator/vehicle-search': ['search', 'table'],
  '/operator/recent-tickets': ['table'],
  '/operator/settings': ['forms'],
};

function withMetadata(role: AppRole, path: string, label: string): RouteDefinition {
  return {
    role,
    path,
    label,
    heading: routeHeadings[path] ?? label,
    coverage: routeCoverage[path] ?? ['route'],
  };
}

export const publicRoutes = [withMetadata('admin', '/login', 'Login')];

export const routesByRole: Record<AppRole, RouteDefinition[]> = {
  admin: adminNav.map((item) => withMetadata('admin', item.path, item.label)),
  supervisor: supervisorNav.map((item) => withMetadata('supervisor', item.path, item.label)),
  operator: operatorNav.map((item) => withMetadata('operator', item.path, item.label)),
};

export const allProtectedRoutes = Object.values(routesByRole).flat();
