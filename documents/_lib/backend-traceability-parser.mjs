/**
 * Maps backend REST resources to frontend a_uidocs screen specs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getRouteMeta } from './backend-route-parser.mjs';

/** REST resource slug → console UI area (from a_uidocs naming). */
export const RESOURCE_UI_HINTS = {
  orders: { area: 'fleet-ops/operations/orders', master: 'MASTER__order-detail-complete.md' },
  drivers: { area: 'fleet-ops/management/drivers', master: 'MASTER__driver-detail-complete.md' },
  vehicles: { area: 'fleet-ops/management/vehicles', master: 'MASTER__vehicle-detail-complete.md' },
  places: { area: 'fleet-ops/management/places', master: 'MASTER__place-detail-complete.md' },
  fleets: { area: 'fleet-ops/management/fleets', master: 'MASTER__fleet-detail-complete.md' },
  contacts: { area: 'fleet-ops/management/contacts', master: 'MASTER__contact-detail-complete.md' },
  customers: {
    area: 'fleet-ops/management/contacts/customers',
    master: 'MASTER__customer-detail-complete.md',
  },
  vendors: { area: 'fleet-ops/management/vendors', master: 'MASTER__vendor-detail-complete.md' },
  'integrated-vendors': {
    area: 'fleet-ops/management/vendors/integrated',
    master: 'MASTER__integrated-vendor-detail-complete.md',
  },
  'fuel-reports': {
    area: 'fleet-ops/management/fuel-reports',
    master: 'MASTER__fuel-report-detail-complete.md',
  },
  issues: { area: 'fleet-ops/management/issues', master: 'MASTER__issue-detail-complete.md' },
  'work-orders': {
    area: 'fleet-ops/maintenance/work-orders',
    master: 'MASTER__work-order-detail-complete.md',
  },
  maintenances: {
    area: 'fleet-ops/maintenance/maintenances',
    master: 'MASTER__maintenance-detail-complete.md',
  },
  parts: { area: 'fleet-ops/maintenance/parts', master: 'MASTER__part-detail-complete.md' },
  equipment: { area: 'fleet-ops/maintenance/equipment', master: 'MASTER__equipment-detail-complete.md' },
  'service-rates': {
    area: 'fleet-ops/operations/service-rates',
    master: 'MASTER__service-rate-detail-complete.md',
  },
  devices: { area: 'fleet-ops/connectivity/devices', master: 'MASTER__device-detail-complete.md' },
  sensors: { area: 'fleet-ops/connectivity/sensors', master: 'MASTER__sensor-detail-complete.md' },
  telematics: {
    area: 'fleet-ops/connectivity/telematics',
    master: 'MASTER__telematic-detail-complete.md',
  },
  reports: { area: 'fleet-ops/analytics/reports', master: 'MASTER__report-detail-complete.md' },
  users: { area: 'console/account', master: null },
  companies: { area: 'console/admin/organizations', master: null },
  products: { area: 'storefront/products', master: null },
  stores: { area: 'storefront/stores', master: null },
  invoices: { area: 'billing/invoices', master: null },
  accounts: { area: 'accounting/accounts', master: null },
};

/** Resources that must not match broader slug substrings. */
const RESOURCE_EXCLUDES = {
  orders: ['work-orders', 'order-configs', 'live/orders'],
};

/**
 * @param {string} aUidocsRoot absolute or repo-relative root for a_uidocs
 */
export function indexUiScreens(aUidocsRoot, repoRoot) {
  const screensDir = path.join(repoRoot, aUidocsRoot, 'screens');
  const index = [];
  if (!fs.existsSync(screensDir)) return index;

  function walk(dir, rel = '') {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const relPath = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(path.join(dir, ent.name), relPath);
      else if (ent.name.endsWith('.md') && !ent.name.startsWith('MASTER__')) {
        const slug = ent.name.replace(/\.md$/, '');
        index.push({
          file: `${aUidocsRoot}/screens/${relPath}`.replace(/\\/g, '/'),
          slug,
          engine: relPath.split('/')[0] || 'console',
          relPath,
        });
      }
    }
  }
  walk(screensDir);
  return index;
}

function pathMatchesResource(file, resource, hint) {
  const excludes = RESOURCE_EXCLUDES[resource] || [];
  for (const ex of excludes) {
    if (file.includes(ex)) return false;
  }

  if (hint?.area) {
    const areaPath = hint.area.replace(/\\/g, '/');
    if (file.includes(`/screens/${areaPath}/`) || file.includes(`/screens/${areaPath}.md`)) {
      return true;
    }
    const parts = areaPath.split('/');
    const areaSlug = parts.length > 1 ? parts.slice(1).join('__') : parts.join('__');
    if (areaSlug && file.includes(areaSlug)) return true;
  }

  const slugNeedle = resource.replace(/-/g, '__');
  const fileSlug = file.split('/').pop()?.replace('.md', '') || '';
  if (fileSlug === slugNeedle || fileSlug.endsWith(`__${slugNeedle}`)) return true;

  return false;
}

function rankScreen(resource, file) {
  if (resource === 'orders') {
    if (file.includes('operations__orders__index.md')) return 0;
    if (file.includes('operations__orders__index__details')) return 1;
    if (file.includes('operations__orders')) return 2;
    if (file.includes('_components/order-details')) return 8;
    if (file.includes('driver') && file.includes('orders')) return 9;
    if (file.includes('work-orders')) return 10;
  }
  if (resource === 'work-orders') {
    if (file.includes('maintenance__work-orders__index.md')) return 0;
    if (file.includes('maintenance__work-orders')) return 1;
    return 5;
  }
  if (file.includes('_components/')) return 6;
  if (file.endsWith('__index.md')) return 2;
  return 4;
}

export function matchScreenForResource(resource, uiIndex) {
  const hint = RESOURCE_UI_HINTS[resource];
  const screens = uiIndex
    .filter((s) => pathMatchesResource(s.file, resource, hint))
    .sort((a, b) => rankScreen(resource, a.file) - rankScreen(resource, b.file))
    .map((s) => s.file)
    .slice(0, 6);

  return { hint, screens };
}

/**
 * Resolve internal list path from parsed routes (authoritative).
 * @param {object} pkg
 * @param {string} resource
 * @param {object[]} routes
 */
export function internalPathForResource(pkg, resource, routes = []) {
  const internal = (routes || []).filter((r) => {
    const m = getRouteMeta(r);
    return m.resource === resource && (r.tier === 'internal' || r.path.includes('/int'));
  });
  const list =
    internal.find((r) => getRouteMeta(r).restAction === 'queryRecord') ||
    internal.find((r) => r.methods?.includes('GET') && !r.path.includes('{id}')) ||
    internal[0];
  if (list?.path) {
    return list.path.replace(/\/$/, '') || list.path;
  }

  const intSeg = pkg.prefix?.internal || 'int';
  const parts = [pkg.routePrefix, intSeg, 'v1', resource].filter(
    (p) => p != null && p !== ''
  );
  return ('/' + parts.join('/')).replace(/\/+/g, '/');
}

/**
 * @param {object[]} packages pkgData from build script
 * @param {string} repoRoot
 */
export function buildTraceabilityMatrix(packages, repoRoot) {
  const uiIndex = indexUiScreens('a_uidocs', repoRoot);
  const rows = [];

  for (const pkg of packages) {
    const resources = new Set(pkg.resources || []);
    for (const b of pkg.routeBlocks || []) resources.add(b.resource);
    const routes = pkg.parsedRoutes || [];

    for (const resource of [...resources].sort()) {
      const internalBase = internalPathForResource(pkg, resource, routes);
      const { hint, screens } = matchScreenForResource(resource, uiIndex);
      const reqId = `BE-${pkg.id}-${resource}`.replace(/[^a-z0-9-]/gi, '-');

      const masterPath = hint?.master
        ? `a_uidocs/screens/fleet-ops/${hint.master}`
        : '—';

      rows.push({
        reqId,
        package: pkg.label,
        resource,
        internalPath: internalBase,
        uiArea: hint?.area || '—',
        masterSpec: hint?.master || '—',
        uiScreens: screens.length ? screens.join('; ') : '—',
        masterPath,
        frontendLlrd: screens[0]
          ? screens[0].replace('a_uidocs/screens/', '').replace('.md', '')
          : '—',
      });
    }
  }

  return { rows, uiIndexCount: uiIndex.length };
}
