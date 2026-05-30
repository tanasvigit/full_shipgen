/**
 * Appends section 17 runtime behavior to every screen spec.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  read,
  parseControllerBehavior,
  parseRouteBehavior,
  parseConditionals,
  parseLoadingStates,
  formatBehaviorSection,
  parseActionServiceFile,
  analyzeMethodBody,
  extractActionMethods,
} from './_lib/behavior-parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCREENS = path.join(__dirname, 'screens');

const SERVICE_CACHE = new Map();

function loadService(relPath) {
  const key = relPath.replace(/\\/g, '/');
  if (SERVICE_CACHE.has(key)) return SERVICE_CACHE.get(key);
  const fp = path.join(ROOT, relPath);
  if (!fs.existsSync(fp)) return null;
  const svc = parseActionServiceFile(fp);
  const map = new Map(svc.methods.map((m) => [m.name, m]));
  SERVICE_CACHE.set(key, map);
  return map;
}

function resolvePaths(engineId, fileName) {
  const tplPath = fileName.replace(/\.md$/, '').replace(/__/g, '/');
  const pkgMap = {
    'fleet-ops': 'packages/fleetops',
    console: 'console/app',
    storefront: 'packages/storefront',
    ledger: 'packages/ledger',
    iam: 'packages/iam-engine',
    developers: 'packages/dev-engine',
    extensions: 'packages/registry-bridge',
    pallet: 'packages/pallet',
  };
  const base = pkgMap[engineId];
  if (!base) return {};
  const addon = engineId === 'console' ? '' : '/addon';
  return {
    template: `${base}${addon}/templates/${tplPath}.hbs`,
    controller: `${base}${addon}/controllers/${tplPath.replace(/\/index$/, '/index')}.js`,
    route: `${base}${addon}/routes/${tplPath.replace(/\/index$/, '/index')}.js`,
    tplRel: tplPath + '.hbs',
  };
}

function detailsControllerPath(base, tplPath) {
  const dm = tplPath.match(/^(.+\/details)(?:\/[^/]+)?\.hbs$/);
  if (!dm) return null;
  const p = `${base}/controllers/${dm[1]}.js`;
  return fs.existsSync(path.join(ROOT, p)) ? p : null;
}

function findControllerPaths(base, tplPath) {
  const detailsCtrl = detailsControllerPath(base, tplPath);
  if (detailsCtrl) return detailsCtrl;

  const candidates = [
    `${base}/controllers/${tplPath.replace(/\/index\.hbs$/, '')}.js`,
    `${base}/controllers/${tplPath.replace(/\.hbs$/, '')}.js`,
    `${base}/controllers/${tplPath.replace(/\.hbs$/, '/index')}.js`,
  ];
  for (const c of candidates) {
    const fp = path.join(ROOT, c.replace(/\//g, path.sep));
    if (fs.existsSync(fp)) return c;
  }
  return null;
}

function findRoutePaths(base, tplPath) {
  const dm = tplPath.match(/^(.+\/details)(?:\/[^/]+)?\.hbs$/);
  if (dm) {
    const p = `${base}/routes/${dm[1]}.js`;
    if (fs.existsSync(path.join(ROOT, p))) return p;
  }
  const candidates = [
    `${base}/routes/${tplPath.replace(/\/index\.hbs$/, '')}.js`,
    `${base}/routes/${tplPath.replace(/\.hbs$/, '')}.js`,
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(ROOT, c))) return c;
  }
  return null;
}

function resolveServiceBehaviors(controller, engineId) {
  const behaviors = [];
  if (!controller?.actionButtons) return behaviors;

  const pkg = {
    'fleet-ops': 'packages/fleetops/addon/services',
    console: null,
    storefront: 'packages/storefront/addon/services',
    ledger: 'packages/ledger/addon/services',
  }[engineId];

  if (!pkg) return behaviors;

  for (const btn of controller.actionButtons) {
    if (!btn.handler) continue;
    const [svcName, method] = btn.handler.replace('()', '').split('.');
    const svcFile = `${pkg}/${svcName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}.js`;
    // camelCase to kebab: orderActions -> order-actions
    const kebab = svcName.replace(/([A-Z])/g, (_, l) => `-${l.toLowerCase()}`).replace(/^-/, '');
    const fp = `${pkg}/${kebab}.js`;
    const map = loadService(fp);
    if (map && map.has(method)) {
      behaviors.push({ service: kebab, ...map.get(method) });
    }
  }
  return behaviors;
}

const FLEETOPS_LIST_RULES = [
  {
    test: /operations\/orders\/index\.hbs$|operations\/orders\.hbs$/,
    service: 'packages/fleetops/addon/services/order-actions.js',
    methods: ['bulkCancel', 'bulkDispatch', 'bulkAssignDriver', 'importOrders', 'optimizeOrderRoutes'],
    inject: 'orderActions',
  },
  {
    test: /management\/drivers\/index\.hbs$/,
    service: 'packages/fleetops/addon/services/driver-actions.js',
    methods: ['bulkDelete', 'import', 'export'],
    inject: 'driverActions',
  },
  {
    test: /management\/vehicles\/index\.hbs$/,
    service: 'packages/fleetops/addon/services/vehicle-actions.js',
    methods: ['bulkDelete', 'import', 'export'],
    inject: 'vehicleActions',
  },
  {
    test: /management\/places\/index\.hbs$/,
    service: 'packages/fleetops/addon/services/place-actions.js',
    methods: ['bulkDelete', 'import', 'export'],
    inject: 'placeActions',
  },
];

const DETAIL_SERVICE_MAP = [
  [/operations__orders/, 'order-actions', true],
  [/management__drivers/, 'driver-actions', false],
  [/management__vehicles/, 'vehicle-actions', false],
  [/management__places/, 'place-actions', false],
  [/management__fleets/, 'fleet-actions', false],
  [/management__contacts__customers/, 'customer-actions', false],
  [/management__contacts/, 'contact-actions', false],
  [/management__vendors__integrated/, 'integrated-vendor-actions', false],
  [/management__vendors/, 'vendor-actions', false],
  [/management__issues/, 'issue-actions', false],
  [/management__fuel-reports/, 'fuel-report-actions', false],
  [/maintenance__work-orders/, 'work-order-actions', false],
  [/maintenance__schedules/, 'maintenance-schedule-actions', false],
  [/maintenance__maintenances/, 'maintenance-actions', false],
  [/maintenance__parts/, 'part-actions', false],
  [/maintenance__equipment/, 'equipment-actions', false],
  [/operations__service-rates/, 'service-rate-actions', false],
  [/connectivity__devices/, 'device-actions', false],
  [/connectivity__sensors/, 'sensor-actions', false],
  [/connectivity__telematics/, 'telematic-actions', false],
  [/analytics__reports/, 'report-actions', false],
];

function inferFleetOpsListActions(tplRel, ctrlSrc) {
  const behaviors = [];
  for (const rule of FLEETOPS_LIST_RULES) {
    if (!rule.test.test(tplRel)) continue;
    const map = loadService(rule.service);
    if (!map) continue;
    const svc = path.basename(rule.service, '.js');
    for (const name of rule.methods) {
      if (map.has(name)) behaviors.push({ service: svc, ...map.get(name) });
    }
    if (rule.inject && ctrlSrc.includes(rule.inject)) {
      for (const m of ctrlSrc.matchAll(new RegExp(`this\\.${rule.inject}\\.(\\w+)`, 'g'))) {
        if (map.has(m[1])) behaviors.push({ service: svc, ...map.get(m[1]) });
      }
    }
  }
  return behaviors;
}

function inferFleetOpsDetailActions(fileName) {
  const behaviors = [];
  if (!fileName.includes('details__index')) return behaviors;
  const entry = DETAIL_SERVICE_MAP.find(([re]) => re.test(fileName));
  if (!entry) return behaviors;
  const [, svcFile, socket] = entry;
  const map = loadService(`packages/fleetops/addon/services/${svcFile}.js`);
  if (!map) return behaviors;
  for (const name of map.keys()) {
    behaviors.push({ service: svcFile, ...map.get(name) });
  }
  if (socket) {
    behaviors.push({
      service: 'order-socket-events',
      name: 'start',
      modals: [],
      apis: [],
      notifications: [],
      navigation: ['On reloadable events → hostRouter.refresh()'],
      stateChanges: [],
      earlyReturns: [],
    });
  }
  return behaviors;
}

function stripOldBehavior(md) {
  const idx = md.indexOf('\n## 17. Runtime behavior');
  if (idx >= 0) return md.slice(0, idx);
  const idx2 = md.indexOf('\n---\n\n## 17. Runtime behavior');
  if (idx2 >= 0) return md.slice(0, idx2);
  return md;
}

let count = 0;
const engines = fs.readdirSync(SCREENS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

for (const engineId of engines) {
  const pkgBase = engineId === 'console' ? 'console/app' : `packages/${engineId === 'fleet-ops' ? 'fleetops' : engineId === 'developers' ? 'dev-engine' : engineId === 'extensions' ? 'registry-bridge' : engineId === 'iam' ? 'iam-engine' : engineId}/addon`;

  const dir = path.join(SCREENS, engineId);
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const fp = path.join(dir, file);
    let md = read(fp);
    md = stripOldBehavior(md);

    const tplRel = file.replace(/\.md$/, '').replace(/__/g, '/') + '.hbs';
    const ctrlRel = findControllerPaths(pkgBase, tplRel);
    const routeRel = findRoutePaths(pkgBase, tplRel);
    const tplPath = path.join(ROOT, pkgBase, 'templates', tplRel);
    const hbs = read(tplPath);

    const ctrlSrc = ctrlRel ? read(path.join(ROOT, ctrlRel)) : '';
    const routeSrc = routeRel ? read(path.join(ROOT, routeRel)) : '';

    let controller = ctrlSrc ? parseControllerBehavior(ctrlSrc) : null;
    let route = routeSrc ? parseRouteBehavior(routeSrc) : null;

    const isListScreen =
      engineId === 'fleet-ops' &&
      FLEETOPS_LIST_RULES.some((r) => r.test.test(tplRel));

    let serviceBehaviors = resolveServiceBehaviors(controller, engineId);
    if (engineId === 'fleet-ops' && isListScreen) {
      serviceBehaviors = [...serviceBehaviors, ...inferFleetOpsListActions(tplRel, ctrlSrc)];
      if (isListScreen && controller?.bulkActions) {
        const resMap = loadService('packages/ember-core/addon/services/resource-action.js');
        for (const ba of controller.bulkActions) {
          if (!ba.handler) continue;
          const [svcName, method] = ba.handler.split('.');
          const svcPath = `packages/fleetops/addon/services/${svcName.replace(/([A-Z])/g, (m) => '-' + m.toLowerCase()).replace(/^-/, '')}.js`;
          const kebab = svcName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
          const map = loadService(`packages/fleetops/addon/services/${kebab}.js`);
          if (map?.has(method)) serviceBehaviors.push({ service: kebab, ...map.get(method) });
          if (method === 'bulkDelete' && resMap?.has('bulkDelete')) {
            serviceBehaviors.push({ service: 'resource-action', ...resMap.get('bulkDelete') });
          }
        }
      }
      const seen = new Set();
      serviceBehaviors = serviceBehaviors.filter((b) => {
        const k = `${b.service}.${b.name}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }

    if (engineId === 'fleet-ops' && file.includes('details__index')) {
      serviceBehaviors = [...serviceBehaviors, ...inferFleetOpsDetailActions(file)];
      const seen = new Set();
      serviceBehaviors = serviceBehaviors.filter((b) => {
        const k = `${b.service}.${b.name}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    }

    let extra = '';
    if (hbs.includes('Layout::Resource::Tabular')) {
      extra += `### List resource behavior\n\n`;
      extra += `- Uses \`Layout::Resource::Tabular\` — search debounced via controller task\n`;
      extra += `- Pagination: \`page\` query param updates model\n`;
      extra += `- Bulk actions from \`bulkActions\` getter on controller\n`;
      extra += `- Row click → transition to details route\n`;
      extra += `- Export/import via \`*Actions.export/import\`\n\n`;
    }
    if (hbs.includes('MapContainer') || hbs.includes('changeLayout')) {
      extra += `### Map layout behavior\n\n`;
      extra += `- \`changeLayout('map'|'table'|'kanban')\` toggles view; persists in controller state\n`;
      extra += `- Map: live markers via leaflet services; order list overlay\n\n`;
    }

    let resourceKey = null;
    if (tplRel.includes('operations/orders')) resourceKey = 'order';
    md += formatBehaviorSection({
      controller,
      route,
      hbs,
      serviceBehaviors,
      extra,
      isListScreen,
      resourceKey,
    });

    fs.writeFileSync(fp, md);
    count++;
  }
}

for (const engineDir of ['fleet-ops', 'ledger']) {
  const dir = path.join(SCREENS, engineDir);
  if (!fs.existsSync(dir)) continue;
  for (const masterFile of fs.readdirSync(dir).filter((f) => f.startsWith('MASTER__'))) {
    const masterPath = path.join(dir, masterFile);
    const slug = masterFile.replace(/^MASTER__/, '').replace(/-detail-complete\.md$/, '');
    const ctrlCandidates = [
      `packages/${engineDir === 'fleet-ops' ? 'fleetops' : 'ledger'}/addon/controllers/**/details.js`,
    ];
    let ctrlPath = null;
    let routePath = null;
    for (const c of walk(path.join(ROOT, `packages/${engineDir === 'fleet-ops' ? 'fleetops' : 'ledger'}/addon/controllers`), '.js')) {
      if (!c.endsWith('details.js')) continue;
      const rel = path.relative(path.join(ROOT, `packages/${engineDir === 'fleet-ops' ? 'fleetops' : 'ledger'}/addon/controllers`), c).replace(/\\/g, '/');
      if (rel.includes(slug.replace(/-/g, '/')) || rel.includes(slug.split('-')[0])) {
        ctrlPath = c;
        routePath = c.replace(/controllers/, 'routes');
        break;
      }
    }
    if (!ctrlPath || !fs.existsSync(routePath)) continue;
    let md = stripOldBehavior(read(masterPath));
    const ctrl = parseControllerBehavior(read(ctrlPath));
    const route = parseRouteBehavior(read(routePath));
    const svcName = `${slug}-actions.js`;
    const svcPath = path.join(ROOT, `packages/fleetops/addon/services/${svcName}`);
    const map = fs.existsSync(svcPath) ? loadService(`packages/fleetops/addon/services/${svcName}`) : null;
    const serviceBehaviors = [];
    if (map) for (const name of map.keys()) serviceBehaviors.push({ service: slug, ...map.get(name) });
    md += formatBehaviorSection({
      controller: ctrl,
      route,
      hbs: '',
      serviceBehaviors,
      isListScreen: false,
      resourceKey: slug === 'order' ? 'order' : null,
    });
    fs.writeFileSync(masterPath, md);
  }
}

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

console.log(`Behavior sections appended to ${count} screen specs`);
