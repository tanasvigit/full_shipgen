import type { TestInfo } from '@playwright/test';
import type { AppRole } from './env';

export const seededUsers: Record<
  AppRole,
  { email: string; password: string; displayName: string; dashboardHeading: string; dashboardPath: string }
> = {
  admin: {
    email: 'admin@parkflow.com',
    password: 'admin123',
    displayName: 'Rajesh Kumar',
    dashboardHeading: 'Dashboard',
    dashboardPath: '/admin/dashboard',
  },
  supervisor: {
    email: 'supervisor@parkflow.com',
    password: 'supervisor123',
    displayName: 'Sunil Mehta',
    dashboardHeading: 'Supervisor Dashboard',
    dashboardPath: '/supervisor/dashboard',
  },
  operator: {
    email: 'operator@parkflow.com',
    password: 'operator123',
    displayName: 'Priya Sharma',
    dashboardHeading: 'Operator Dashboard',
    dashboardPath: '/operator/dashboard',
  },
};

export function uniqueSuffix(prefix = 'qa'): string {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(-10);
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${stamp}-${random}`;
}

export function buildAutomationUser() {
  const suffix = uniqueSuffix('user');
  return {
    name: `Playwright ${suffix}`,
    email: `qa+${suffix}@parkflow.com`,
    password: 'operator123',
    updatedName: `Updated ${suffix}`,
  };
}

export function buildAutomationFloor() {
  const suffix = uniqueSuffix('floor');
  return {
    name: `Automation ${suffix}`,
    updatedName: `Automation Updated ${suffix}`,
    twoWheelerCapacity: '12',
    fourWheelerCapacity: '8',
    heavyVehicleCapacity: '4',
  };
}

export function buildAutomationVehicle(prefix = 'KA'): string {
  const suffix = uniqueSuffix('vh').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(-6);
  return `${prefix}${suffix}`;
}

export function annotateTest(
  testInfo: TestInfo,
  metadata: {
    route?: string;
    page?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    coverage?: string[];
  },
) {
  if (metadata.route) {
    testInfo.annotations.push({ type: 'route', description: metadata.route });
  }

  if (metadata.page) {
    testInfo.annotations.push({ type: 'page', description: metadata.page });
  }

  if (metadata.severity) {
    testInfo.annotations.push({ type: 'severity', description: metadata.severity });
  }

  for (const area of metadata.coverage ?? []) {
    testInfo.annotations.push({ type: 'coverage', description: area });
  }
}
