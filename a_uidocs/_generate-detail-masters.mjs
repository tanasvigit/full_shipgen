/**
 * Generates MASTER detail specs + _components tab specs for driver, vehicle, place.
 * Run: node a_uidocs/_generate-detail-masters.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  read,
  parseControllerBehavior,
  parseRouteBehavior,
  parseComponentBehavior,
  formatBehaviorSection,
  extractActionMethods,
  analyzeMethodBody,
} from './_lib/behavior-parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCREENS = path.join(__dirname, 'screens', 'fleet-ops');
const COMP_OUT = path.join(SCREENS, '_components');
const PKG = path.join(ROOT, 'packages/fleetops/addon');

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

function extractFieldInfo(hbs) {
  const fields = [];
  for (const m of hbs.matchAll(/field-name[^>]*>\s*(?:<span>)?([^<]+)/g)) {
    const name = m[1].trim();
    if (name && !name.startsWith('{{')) fields.push(name);
  }
  for (const m of hbs.matchAll(/\{\{t\s+"([^"]+)"\}\}/g)) {
    const k = m[1];
    if (k.includes('fields.') || k.includes('column.') || k.includes('common.')) fields.push(`i18n:${k}`);
  }
  return [...new Set(fields)];
}

function parseTabsFromController(ctrlSrc) {
  const tabs = [];
  const block = ctrlSrc.match(/get tabs\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/);
  if (!block) return tabs;
  for (const m of block[1].matchAll(/route:\s*'([^']+)'[\s\S]*?label:\s*(?:this\.intl\.t\(['"]([^'"]+)['"]\)|'([^']+)')/g)) {
    tabs.push({ route: m[1], label: m[2] || m[3] });
  }
  for (const m of block[1].matchAll(/label:\s*'([^']+)'[\s\S]*?route:\s*'([^']+)'/g)) {
    if (!tabs.some((t) => t.route === m[2])) tabs.push({ route: m[2], label: m[1] });
  }
  return tabs;
}

function parseActionMenu(ctrlSrc) {
  const rows = [];
  if (!ctrlSrc.includes('get actionButtons()')) return rows;
  const block = ctrlSrc.match(/get actionButtons\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/)?.[1] || '';
  const chunks = block.includes('items:')
    ? [...block.matchAll(/text:\s*this\.intl\.t\(['"]([^'"]+)['"]\)[\s\S]*?(?:permission:\s*'([^']+)')?[\s\S]*?fn:\s*\(\)\s*=>\s*this\.(\w+)\.(\w+)/g)]
    : [];
  for (const m of chunks) {
    rows.push({ text: m[1], permission: m[2] || '—', handler: `${m[3]}.${m[4]}` });
  }
  if (block.includes("transitionTo('console.fleet-ops.management.drivers.index.edit") || block.includes('management.drivers.index.edit')) {
    rows.unshift({ text: 'Edit (pencil icon)', permission: '—', handler: 'hostRouter.transitionTo → edit route' });
  }
  if (block.includes('management.vehicles.index.edit')) {
    rows.unshift({ text: 'Edit (pencil icon)', permission: 'fleet-ops update vehicle', handler: 'hostRouter.transitionTo → edit route' });
  }
  if (block.includes('management.places.index.edit')) {
    rows.unshift({ text: 'Edit (pencil icon)', permission: '—', handler: 'hostRouter.transitionTo → edit route' });
  }
  return rows;
}

function resolveTabComponent(tplHbs) {
  const t = tplHbs.trim();
  const comp = t.match(/<([A-Z][A-Za-z0-9:]*)/)?.[1];
  if (comp) return comp;
  if (t === '{{outlet}}') return '(nested outlet)';
  return t.slice(0, 80);
}

function loadServiceBehaviors(serviceRel, methodNames = null) {
  const fp = path.join(PKG, serviceRel);
  if (!fs.existsSync(fp)) return [];
  const methods = extractActionMethods(read(fp));
  const out = [];
  for (const m of methods) {
    if (methodNames && !methodNames.includes(m.name)) continue;
    out.push({
      service: path.basename(serviceRel, '.js'),
      name: m.name,
      ...analyzeMethodBody(m.body, m.name),
    });
  }
  return out;
}

const RESOURCES = [
  {
    key: 'driver',
    masterFile: 'MASTER__driver-detail-complete.md',
    url: '/fleet-ops/management/drivers/:public_id',
    routeName: 'fleet-ops.management.drivers.index.details',
    parentTpl: 'management/drivers/index/details.hbs',
    ctrl: 'controllers/management/drivers/index/details.js',
    route: 'routes/management/drivers/index/details.js',
    registry: 'fleet-ops:component:driver:details',
    headerComponent: 'driver/panel-header',
    service: 'services/driver-actions.js',
    model: 'driver',
    permission: 'fleet-ops view driver',
    api: "`store.findRecord('driver', public_id)`",
    afterModel: 'None',
    wireframe: `Panel layout (sidebar visible). Header: driver name + panel-header. Tabs below header.`,
    listScreen: 'management__drivers__index.md',
    detailScreen: 'management__drivers__index__details__index.md',
    tabsDir: 'templates/management/drivers/index/details',
    compPrefix: 'driver-details',
    compNamespace: 'Driver',
    detailActions: ['locate', 'assignOrder', 'assignVehicle', 'delete', 'bulkDelete'],
    listActions: ['bulkDelete', 'import', 'export', 'locate', 'assignOrder', 'assignVehicle'],
  },
  {
    key: 'vehicle',
    masterFile: 'MASTER__vehicle-detail-complete.md',
    url: '/fleet-ops/management/vehicles/:public_id',
    routeName: 'fleet-ops.management.vehicles.index.details',
    parentTpl: 'management/vehicles/index/details.hbs',
    ctrl: 'controllers/management/vehicles/index/details.js',
    route: 'routes/management/vehicles/index/details.js',
    registry: 'fleet-ops:component:vehicle:details',
    headerComponent: 'vehicle/panel-header',
    service: 'services/vehicle-actions.js',
    model: 'vehicle',
    permission: 'fleet-ops view vehicle',
    api: "`store.findRecord('vehicle', public_id)`",
    afterModel: '`model.loadDriver()`',
    wireframe: `Panel layout. Header: vehicle display name. Tabs: Overview, Positions, Devices, Schedules, Work Orders, Maintenance (+ registry).`,
    listScreen: 'management__vehicles__index.md',
    detailScreen: 'management__vehicles__index__details__index.md',
    tabsDir: 'templates/management/vehicles/index/details',
    compPrefix: 'vehicle-details',
    compNamespace: 'Vehicle',
    detailActions: ['locate', 'scheduleMaintenance', 'createWorkOrder', 'logMaintenance', 'delete', 'bulkDelete'],
    listActions: ['bulkDelete', 'import', 'export', 'locate', 'scheduleMaintenance', 'createWorkOrder', 'logMaintenance'],
  },
  {
    key: 'place',
    masterFile: 'MASTER__place-detail-complete.md',
    url: '/fleet-ops/management/places/:public_id',
    routeName: 'fleet-ops.management.places.index.details',
    parentTpl: 'management/places/index/details.hbs',
    ctrl: 'controllers/management/places/index/details.js',
    route: 'routes/management/places/index/details.js',
    registry: 'fleet-ops:component:place:details',
    headerComponent: '(title from name or street1)',
    service: 'services/place-actions.js',
    model: 'place',
    permission: 'fleet-ops view place',
    api: "`store.findRecord('place', public_id)`",
    afterModel: 'None',
    wireframe: `Panel layout. Header: place name or street1. Tabs: Overview (+ registry). Additional routes exist for activity, map, etc.`,
    listScreen: 'management__places__index.md',
    detailScreen: 'management__places__index__details__index.md',
    tabsDir: 'templates/management/places/index/details',
    compPrefix: 'place-details',
    compNamespace: 'Place',
    detailActions: ['locate', 'assignVendor', 'viewVendor', 'delete', 'bulkDelete'],
    listActions: ['bulkDelete', 'import', 'export', 'locate', 'assignVendor', 'viewVendor'],
  },
];

function buildMaster(res) {
  const ctrlSrc = read(path.join(PKG, res.ctrl));
  const routeSrc = read(path.join(PKG, res.route));
  const controller = parseControllerBehavior(ctrlSrc);
  const route = parseRouteBehavior(routeSrc);
  const tabsFromCtrl = parseTabsFromController(ctrlSrc);
  const actions = parseActionMenu(ctrlSrc);

  let md = `# Screen: ${res.key.charAt(0).toUpperCase() + res.key.slice(1)} detail (complete)

| Property | Value |
|----------|-------|
| **URL** | \`${res.url}\` |
| **Route name** | \`${res.routeName}\` |
| **Parent template** | \`${res.parentTpl}\` |
| **Layout** | \`Layout::Resource::Panel\` + \`TabNavigation\` |
| **Header** | \`${res.headerComponent}\` |

---

## Wireframe

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ Console header                                                │
├─────────────────────────────────────────────────────────────┤
│ [← Back to list]  Title + header component                    │
│ [Action buttons: edit, dropdown actions...]                   │
├─────────────────────────────────────────────────────────────┤
│ [Tabs from controller + registry extensions]                │
├─────────────────────────────────────────────────────────────┤
│  Active tab outlet (scrollable)                               │
│  - field-info panels / tables / map / schedule UI             │
└─────────────────────────────────────────────────────────────┘
\`\`\`

${res.wireframe}

---

## Parent route — data load

| Item | Value |
|------|-------|
| Model | \`${res.model}\` |
| Permission | \`${res.permission}\` |
| API | ${res.api} |
| After model | ${res.afterModel} |

**Error handling:** \`notifications.serverError(error)\`; if message ends with \`not found\` → redirect to list index.

**beforeModel:** \`abilities.cannot('${res.permission}')\` → warning toast + redirect to list.

---

## Parent controller — tabs

| Tab label | Route |
|-----------|-------|
${tabsFromCtrl.map((t) => `| ${t.label} | \`${t.route}\` |`).join('\n') || '| _see controller_ |'}
| (+ extension tabs) | \`menuService.getMenuItems('${res.registry}')\` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
${actions.map((a) => `| ${a.text} | \`${a.permission}\` | \`${a.handler}\` |`).join('\n') || '| Edit | — | transition to edit route |'}

**Cancel / back:** \`onPressCancel\` → \`transition-to\` list index route.

---

## Tab panels (route outlets)

`;

  const tabsDir = path.join(PKG, res.tabsDir);
  for (const f of walk(tabsDir, '.hbs').sort()) {
    const slug = path.basename(f, '.hbs');
    if (slug === 'virtual') {
      md += `### Tab: \`virtual\` (extension)\n\n`;
      md += `**Template:** LazyEngineComponent from registry tab definition.\n\n`;
      continue;
    }
    const tplHbs = read(f);
    const component = resolveTabComponent(tplHbs);
    md += `### Tab: \`${slug}\`\n\n`;
    md += `**Template:** \`${res.tabsDir}/${slug}.hbs\`\n\n`;
    md += `**Renders:** \`${component}\`\n\n`;

    let compHbsPath = null;
    if (slug === 'index') {
      compHbsPath = path.join(PKG, 'components', res.key, 'details.hbs');
    } else if (component.includes('::')) {
      const parts = component.replace(/::/g, '/').toLowerCase().split('/');
      compHbsPath = path.join(PKG, 'components', ...parts) + '.hbs';
    } else if (fs.existsSync(path.join(PKG, 'components', res.key, `${slug}.hbs`))) {
      compHbsPath = path.join(PKG, 'components', res.key, `${slug}.hbs`);
    } else if (fs.existsSync(path.join(PKG, 'components', res.key, 'details', `${slug}.hbs`))) {
      compHbsPath = path.join(PKG, 'components', res.key, 'details', `${slug}.hbs`);
    }

    if (compHbsPath && fs.existsSync(compHbsPath)) {
      const chbs = read(compHbsPath);
      const fields = extractFieldInfo(chbs);
      if (fields.length) {
        md += '| Display field |\n|---------------|\n';
        for (const fd of fields.slice(0, 50)) md += `| ${fd} |\n`;
        md += '\n';
      }
    }
    const flatComp = path.join(PKG, 'components', res.key, `${slug}.hbs`);
    if (fs.existsSync(flatComp)) {
      const ch = read(flatComp);
      const inner = resolveTabComponent(ch);
      md += `**Component file:** \`components/${res.key}/${slug}.hbs\` → \`${inner}\`\n\n`;
      if (ch.includes('field-info')) {
        const fields = extractFieldInfo(ch);
        if (fields.length) {
          md += '| Display field (component) |\n|---------------------------|\n';
          for (const fd of fields.slice(0, 40)) md += `| ${fd} |\n`;
          md += '\n';
        }
      }
    } else if (tplHbs.includes('{{outlet}}') && slug !== 'index') {
      md += `_Nested outlet — see route + \`components/${res.key}/${slug}\` if present._\n\n`;
    }
  }

  md += `
---

## Registry

- \`${res.registry}\` — extension tabs and \`RegistryYield\` panels on overview component

## List screen (related)

- Spec: [\`${res.listScreen}\`](./${res.listScreen})
- Service: \`${path.basename(res.service)}\` — create/edit via panel or modal; row click → detail route

## Panel / modal flows (from *-actions service)

| Flow | Entry |
|------|-------|
| Create | \`panel.create\` / \`modal.create\` → form component |
| Edit | \`panel.edit\` / \`modal.edit\` → reload if \`_index_resource\` |
| Quick view | \`panel.view\` with \`panelTabs\` (driver/vehicle) or modal (place) |
| Delete | \`delete(model, { onConfirm }) → redirect list |

## Mobile / responsive

- \`Layout::Resource::Panel\` with \`@bodyClass="no-scroll"\` — tab content scrolls inside panel
- Table list uses standard pagination; vehicle list supports table/grid layout toggle

## Custom component map

| Ember | Build as |
|-------|----------|
| ${res.compNamespace}::Details | Overview tab |
| Layout::Resource::Panel | Detail page shell |
| TabNavigation | Tab bar |
| RegistryYield | Extension panels |
`;

  const serviceBehaviors = loadServiceBehaviors(res.service);
  md += formatBehaviorSection({
    controller,
    route,
    hbs: read(path.join(PKG, res.parentTpl)),
    serviceBehaviors,
    isListScreen: false,
  });

  fs.writeFileSync(path.join(SCREENS, res.masterFile), md);
  return res;
}

function buildComponentSpecs(res) {
  const masterLink = res.masterFile;
  const tabsDir = path.join(PKG, res.tabsDir);

  for (const f of walk(tabsDir, '.hbs')) {
    const slug = path.basename(f, '.hbs');
    if (slug === 'virtual') continue;

    const tplHbs = read(f);
    const component = resolveTabComponent(tplHbs);

    let compJs = null;
    let compHbs = null;
    if (slug === 'index') {
      compHbs = path.join(PKG, 'components', res.key, 'details.hbs');
      compJs = path.join(PKG, 'components', res.key, 'details.js');
    } else if (fs.existsSync(path.join(PKG, 'components', res.key, `${slug}.js`))) {
      compJs = path.join(PKG, 'components', res.key, `${slug}.js`);
      compHbs = path.join(PKG, 'components', res.key, `${slug}.hbs`);
    } else if (fs.existsSync(path.join(PKG, 'components', res.key, 'details', `${slug}.js`))) {
      compJs = path.join(PKG, 'components', res.key, 'details', `${slug}.js`);
      compHbs = path.join(PKG, 'components', res.key, 'details', `${slug}.hbs`);
    }

    const hbs = compHbs && fs.existsSync(compHbs) ? read(compHbs) : tplHbs;
    const js = compJs && fs.existsSync(compJs) ? read(compJs) : '';
    const fields = extractFieldInfo(hbs);
    const compName =
      slug === 'index'
        ? `${res.compNamespace}::Details`
        : component.includes('::')
          ? component
          : `${res.compNamespace}::${slug.charAt(0).toUpperCase() + slug.slice(1)}`;

    let md = `# ${res.key} detail tab: ${slug}

| Property | Value |
|----------|-------|
| **Parent screen** | [${res.key} detail complete](../${masterLink}) |
| **Route** | \`${res.routeName}.${slug}\` |
| **Component** | \`${compName}\` |
| **Template** | \`${res.tabsDir}/${slug}.hbs\` |

## Layout

${hbs.includes('ContentPanel') ? '- ContentPanel section(s) with optional `@actionButtons`' : '- See template / component source'}

## Display fields & labels

| Field / i18n key |
|----------------|
${fields.map((fd) => `| ${fd} |`).join('\n') || '| _parse template manually_ |'}

## Buttons

${[...hbs.matchAll(/<Button[^>]*@text=\{\{t\s+"([^"]+)"\}\}/g)].map((m) => `- i18n: ${m[1]}`).join('\n') || '_see actionButtons in component JS_'}

## Conditionals

${[...hbs.matchAll(/\{\{#if\s+([^}]+)\}\}/g)].map((m) => `- \`#if ${m[1]}\``).join('\n') || '_none_'}

## Child components

${[...hbs.matchAll(/<([A-Z][A-Za-z0-9:.-]*)/g)].map((m) => m[1]).filter((c) => c.includes('::') || /^[A-Z]/.test(c)).slice(0, 20).map((c) => `- \`${c}\``).join('\n') || '_none_'}

## Custom UI notes

Rebuild as a tab inside ${res.key} detail. Model: \`${res.model}\` (doc 33).
`;

    if (js) {
      const comp = parseComponentBehavior(js);
      const svc = path.basename(res.service);
      const serviceBehaviors = [];
      const map = loadServiceBehaviors(res.service);
      for (const btn of comp.actionButtons || []) {
        if (!btn.handler) continue;
        const method = btn.handler.split('.').pop();
        const hit = map.find((b) => b.name === method);
        if (hit) serviceBehaviors.push(hit);
      }
      for (const m of js.matchAll(/this\.(\w+Actions)\.(\w+)/g)) {
        const hit = map.find((b) => b.name === m[2]);
        if (hit) serviceBehaviors.push(hit);
      }
      const seen = new Set();
      const unique = serviceBehaviors.filter((b) => {
        const k = b.name;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      md += formatBehaviorSection({
        controller: comp,
        route: null,
        hbs,
        serviceBehaviors: unique,
        extra: `\n### Component JS\n\n\`${compJs.replace(/\\/g, '/').split('packages/fleetops/addon/')[1] || compJs}\`\n`,
        isListScreen: false,
      });
    }

    const outFile = path.join(COMP_OUT, `${res.compPrefix}__${slug}.md`);
    fs.writeFileSync(outFile, md);
  }
}

function patchDetailScreenLinks(res) {
  const detailPath = path.join(SCREENS, res.detailScreen);
  if (!fs.existsSync(detailPath)) return;
  let md = read(detailPath);
  md = md.replace(
    /> \*\*Full merged spec:\*\* \[MASTER__order-detail-complete\.md\].*?\n\n/g,
    `> **Full merged spec:** [${res.masterFile}](./${res.masterFile})\n\n`
  );
  if (!md.includes(res.masterFile)) {
    const anchor = '\n---\n\n## Deep specification';
    if (md.includes(anchor)) {
      md = md.replace(anchor, `\n\n> **Full merged spec:** [${res.masterFile}](./${res.masterFile})\n${anchor}`);
    } else {
      md += `\n\n> **Full merged spec:** [${res.masterFile}](./${res.masterFile})\n`;
    }
  }
  fs.writeFileSync(detailPath, md);
}

function patchAllWrongMasterLinks() {
  const map = [
    { pattern: /management__drivers__/, master: 'MASTER__driver-detail-complete.md' },
    { pattern: /management__vehicles__/, master: 'MASTER__vehicle-detail-complete.md' },
    { pattern: /management__places__/, master: 'MASTER__place-detail-complete.md' },
    { pattern: /operations__orders__/, master: 'MASTER__order-detail-complete.md' },
  ];
  for (const file of fs.readdirSync(SCREENS).filter((f) => f.endsWith('.md') && f.includes('details'))) {
    const fp = path.join(SCREENS, file);
    let md = read(fp);
    const rule = map.find((r) => r.pattern.test(file));
    if (!rule) continue;
    if (md.includes('MASTER__order-detail-complete') && rule.master !== 'MASTER__order-detail-complete.md') {
      md = md.replace(/MASTER__order-detail-complete\.md/g, rule.master);
      fs.writeFileSync(fp, md);
    }
  }
}

for (const res of RESOURCES) {
  buildMaster(res);
  buildComponentSpecs(res);
  patchDetailScreenLinks(res);
  console.log(`Built ${res.masterFile} + component specs for ${res.key}`);
}

patchAllWrongMasterLinks();
console.log('Fixed cross-linked MASTER references on detail screens');
