/**
 * Auto-generates MASTER detail specs for every details.js controller in FleetOps + Ledger.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  read,
  parseControllerBehavior,
  parseRouteBehavior,
  formatBehaviorSection,
  extractActionMethods,
  analyzeMethodBody,
} from './_lib/behavior-parser.mjs';
import { buildRegistryFromMasters, patchMasterLinksInFile } from './_lib/master-registry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

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
    const n = m[1].trim();
    if (n && !n.startsWith('{{')) fields.push(n);
  }
  for (const m of hbs.matchAll(/\{\{t\s+"([^"]+)"\}\}/g)) {
    const k = m[1];
    if (/fields\.|column\.|common\./.test(k)) fields.push(`i18n:${k}`);
  }
  return [...new Set(fields)];
}

function parseTabsFromController(ctrlSrc) {
  const tabs = [];
  const block = ctrlSrc.match(/get tabs\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/);
  if (!block) return tabs;
  for (const m of block[1].matchAll(/route:\s*'([^']+)'[\s\S]*?(?:label:\s*(?:this\.intl\.t\(['"]([^'"]+)['"]\)|'([^']+)'))/g)) {
    tabs.push({ route: m[1], label: m[2] || m[3] || m[1] });
  }
  return tabs;
}

function parseActionMenu(ctrlSrc) {
  const rows = [];
  const block = ctrlSrc.match(/get actionButtons\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/)?.[1] || '';
  if (block.includes('transitionTo') && block.includes('.edit')) {
    rows.push({ text: 'Edit', permission: '—', handler: 'hostRouter.transitionTo → edit route' });
  }
  for (const m of block.matchAll(/text:\s*this\.intl\.t\(['"]([^'"]+)['"]\)[\s\S]*?(?:permission:\s*'([^']+)')?[\s\S]*?fn:\s*\(\)\s*=>\s*this\.(\w+)\.(\w+)/g)) {
    rows.push({ text: m[1], permission: m[2] || '—', handler: `${m[3]}.${m[4]}` });
  }
  return rows;
}

function resolveTabComponent(tplHbs) {
  const t = tplHbs.trim();
  return t.match(/<([A-Z][A-Za-z0-9:]*)/)?.[1] || (t === '{{outlet}}' ? '(nested outlet)' : t.slice(0, 60));
}

function singularize(plural) {
  const map = {
    orders: 'order',
    drivers: 'driver',
    vehicles: 'vehicle',
    places: 'place',
    fleets: 'fleet',
    contacts: 'contact',
    customers: 'customer',
    vendors: 'vendor',
    issues: 'issue',
    devices: 'device',
    sensors: 'sensor',
    telematics: 'telematic',
    accounts: 'ledger-account',
    invoices: 'invoice',
  };
  if (map[plural]) return map[plural];
  if (plural.endsWith('ies')) return plural.slice(0, -3) + 'y';
  if (plural.endsWith('s') && plural.length > 3) return plural.slice(0, -1);
  return plural;
}

function guessModelFromPath(basePath, routeSrc) {
  const route = parseRouteBehavior(routeSrc);
  if (route.model) return route.model;
  const parts = basePath.split('/');
  const di = parts.indexOf('details');
  if (di > 0) {
    let seg = parts[di - 1];
    if (seg === 'index' && di >= 2) seg = parts[di - 2];
    if (seg === 'customers') return 'customer';
    if (seg === 'integrated') return 'integrated-vendor';
    return singularize(seg);
  }
  return 'resource';
}

function serviceFileForModel(model) {
  const svcDir = path.join(ROOT, 'packages/fleetops/addon/services');
  if (!fs.existsSync(svcDir)) return null;
  const candidates = [`${model}-actions.js`, `${model.replace(/-/g, '-')}-actions.js`];
  for (const c of fs.readdirSync(svcDir)) {
    if (!c.endsWith('-actions.js')) continue;
    const src = read(path.join(svcDir, c));
    const init = src.match(/initialize\(['"]([^'"]+)['"]/);
    if (init && (init[1] === model || init[1].replace(/-/g, '_') === model.replace(/-/g, '_'))) {
      return `services/${c}`;
    }
  }
  const direct = `${model}-actions.js`;
  if (fs.existsSync(path.join(svcDir, direct))) return `services/${direct}`;
  if (model === 'contact' || model === 'customer') return 'services/customer-actions.js';
  if (model === 'report') return 'services/report-actions.js';
  if (model === 'telematic') return 'services/telematic-actions.js';
  return null;
}

function loadServiceBehaviors(serviceRel, pkgRoot) {
  if (!serviceRel) return [];
  const fp = path.join(pkgRoot, serviceRel);
  if (!fs.existsSync(fp)) return [];
  return extractActionMethods(read(fp)).map((m) => ({
    service: path.basename(serviceRel, '.js'),
    name: m.name,
    ...analyzeMethodBody(m.body, m.name),
  }));
}

function buildMaster(res) {
  const ctrlSrc = read(res.ctrlPath);
  const routeSrc = read(res.routePath);
  const controller = parseControllerBehavior(ctrlSrc);
  const route = parseRouteBehavior(routeSrc);
  const tabsFromCtrl = parseTabsFromController(ctrlSrc);
  const actions = parseActionMenu(ctrlSrc);
  const title = res.title || res.model;

  let md = `# Screen: ${title} detail (complete)

| Property | Value |
|----------|-------|
| **URL** | \`${res.url}\` |
| **Route name** | \`${res.routeName}\` |
| **Controller** | \`${res.ctrlRel}\` |
| **Route** | \`${res.routeRel}\` |
| **Model** | \`${res.model}\` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | \`${res.permission}\` |
| API | ${res.apiNote} |

**Error:** \`serverError\` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
${tabsFromCtrl.map((t) => `| ${t.label} | \`${t.route}\` |`).join('\n') || '| (single panel) | details index |'}

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
${actions.map((a) => `| ${a.text} | \`${a.permission}\` | \`${a.handler}\` |`).join('\n') || '| — | — | — |'}

---

## Tab panels

`;

  const tabsDir = path.join(res.pkgRoot, res.tabsDirRel);
  if (fs.existsSync(tabsDir)) {
    for (const f of walk(tabsDir, '.hbs').sort()) {
      const slug = path.basename(f, '.hbs');
      if (slug === 'virtual') {
        md += `### Tab: virtual\n\nLazyEngineComponent from registry.\n\n`;
        continue;
      }
      const tplHbs = read(f);
      md += `### Tab: \`${slug}\`\n\n**Renders:** \`${resolveTabComponent(tplHbs)}\`\n\n`;
      const compPaths = [
        path.join(res.pkgRoot, 'components', res.compKey, 'details.hbs'),
        path.join(res.pkgRoot, 'components', res.compKey, `${slug}.hbs`),
        path.join(res.pkgRoot, 'components', res.compKey, 'details', `${slug}.hbs`),
        path.join(res.pkgRoot, 'components', `${slug}.hbs`),
        path.join(res.pkgRoot, 'components', 'positions-replay.hbs'),
      ];
      if (resolveTabComponent(tplHbs) === 'PositionsReplay') compPaths.unshift(path.join(res.pkgRoot, 'components', 'positions-replay.hbs'));
      for (const cp of compPaths) {
        if (!fs.existsSync(cp)) continue;
        const ch = read(cp);
        const fields = extractFieldInfo(ch);
        if (fields.length) {
          md += `| Field |\n|-------|\n${fields.slice(0, 45).map((fd) => `| ${fd} |`).join('\n')}\n\n`;
        }
        break;
      }
    }
  }

  md += `
## Related list spec

[\`${res.listScreen}\`](./${res.listScreen})

## Service

\`${res.serviceRel || 'resource-action (base)'}\`
`;

  const serviceBehaviors = loadServiceBehaviors(res.serviceRel, res.pkgRoot);
  md += formatBehaviorSection({
    controller,
    route,
    hbs: read(path.join(res.pkgRoot, res.parentTplRel)) || '',
    serviceBehaviors,
    isListScreen: false,
    resourceKey: res.model === 'order' ? 'order' : null,
  });

  fs.writeFileSync(res.outPath, md);
}

function discoverEngine(pkgFolder, mount, screensDir, engineName) {
  const pkgRoot = path.join(ROOT, 'packages', pkgFolder, 'addon');
  if (!fs.existsSync(pkgRoot)) return [];
  const ctrlRoot = path.join(pkgRoot, 'controllers');
  const found = [];
  for (const ctrlPath of walk(ctrlRoot, '.js')) {
    if (!ctrlPath.endsWith(`${path.sep}details.js`)) continue;
    const ctrlRel = path.relative(pkgRoot, ctrlPath).replace(/\\/g, '/');
    const base = ctrlRel.replace(/^controllers\//, '').replace(/\.js$/, '');
    const routePath = path.join(pkgRoot, 'routes', `${base}.js`);
    const routeSrc = read(routePath);
    const model = guessModelFromPath(base, routeSrc);
    const masterSlug = model.replace(/\//g, '-');
    const masterFile = `MASTER__${masterSlug}-detail-complete.md`;
    const screenBase = base.replace(/\//g, '__');
    const listScreen = `${screenBase.replace(/__details$/, '')}.md`;
    const detailScreen = `${screenBase}__index.md`;
    const permMatch = routeSrc.match(/cannot\('([^']+)'\)/);
    const permission = permMatch?.[1] || `${engineName} view ${model}`;
    const serviceRel = serviceFileForModel(model);
    const urlBase = base.replace(/\/index\/details$/, '').replace(/\/details$/, '');
    found.push({
      model,
      title: titleize(model),
      masterFile,
      outPath: path.join(screensDir, masterFile),
      ctrlPath,
      routePath,
      ctrlRel,
      routeRel: path.relative(pkgRoot, routePath).replace(/\\/g, '/'),
      pkgRoot,
      tabsDirRel: `templates/${base}`,
      parentTplRel: `templates/${base}.hbs`,
      compKey: model.split('-')[0],
      url: `${mount}/${urlBase}/:public_id`.replace(/\/+/g, '/'),
      routeName: `${engineName}.${base.replace(/\//g, '.')}`,
      permission,
      apiNote: routeSrc.includes('queryRecord') ? '`store.queryRecord(...)`' : '`store.findRecord(...)`',
      serviceRel,
      listScreen,
      detailScreen,
    });
  }
  return found;
}

function titleize(s) {
  return s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const fleetOpsDir = path.join(__dirname, 'screens', 'fleet-ops');
const ledgerDir = path.join(__dirname, 'screens', 'ledger');

const discovered = [
  ...discoverEngine('fleetops', '/fleet-ops', fleetOpsDir, 'fleet-ops'),
  ...discoverEngine('ledger', '/ledger', ledgerDir, 'ledger'),
];

const seen = new Set();
for (const res of discovered) {
  if (seen.has(res.masterFile)) continue;
  seen.add(res.masterFile);
  buildMaster(res);
  console.log(`MASTER ${res.masterFile}`);
}

const registry = buildRegistryFromMasters([fleetOpsDir, ledgerDir]);
let patched = 0;
for (const engine of fs.readdirSync(path.join(__dirname, 'screens'), { withFileTypes: true })) {
  if (!engine.isDirectory()) continue;
  const dir = path.join(__dirname, 'screens', engine.name);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md') && x.includes('details'))) {
    const fp = path.join(dir, f);
    let md = read(fp);
    const next = patchMasterLinksInFile(md, f, registry, '.');
    if (next !== md) {
      fs.writeFileSync(fp, next);
      patched++;
    }
  }
}
console.log(`Patched ${patched} detail screen MASTER links`);
console.log(`Generated ${seen.size} MASTER detail specs`);
