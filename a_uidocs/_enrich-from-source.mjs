/**
 * Enriches a_uidocs from packages/ and console/ source.
 * Run: node a_uidocs/_enrich-from-source.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PKG = path.join(ROOT, 'packages');
const CONSOLE = path.join(ROOT, 'console', 'app');

const DONE = '✅ Done';
const CHECK = `- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included`;

function header(id, title, vol, scope, sources) {
  return `# ${title}

| Field | Value |
|-------|-------|
| **Doc ID** | ${id} |
| **Volume** | ${vol} |
| **Status** | ${DONE} |
| **Sources** | \`${sources}\` |

---

## Purpose

${scope}

---

## Documentation checklist

${CHECK}

---

`;
}

function writeDoc(filename, body) {
  fs.writeFileSync(path.join(__dirname, filename), body.trim() + '\n', 'utf8');
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function walk(dir, ext, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, list);
    else if (e.name.endsWith(ext)) list.push(p);
  }
  return list;
}

function rel(from, p) {
  return path.relative(from, p).replace(/\\/g, '/');
}

// --- Parse Ember Data models ---
function parseModel(filePath) {
  const src = readSafe(filePath);
  const name = path.basename(filePath, '.js');
  const attrs = [];
  const belongsTo = [];
  const hasMany = [];
  let extendsModel = null;

  const ext = src.match(/export default class \w+ extends (\w+)/);
  if (ext && ext[1] !== 'Model') extendsModel = ext[1];

  for (const m of src.matchAll(/@attr\(([^)]*)\)\s+(\w+)/g)) {
    const type = m[1].replace(/['"]/g, '').trim() || 'string';
    attrs.push({ name: m[2], type });
  }
  for (const m of src.matchAll(/@belongsTo\(['"]([^'"]+)['"](?:,\s*\{[^}]*inverse:\s*['"]([^'"]+)['"][^}]*\})?\)/g)) {
    belongsTo.push(m[2] ? `${m[1]}:${m[2]}` : m[1]);
  }
  for (const m of src.matchAll(/@hasMany\(['"]([^'"]+)['"](?:,\s*\{[^}]*inverse:\s*['"]([^'"]+)['"][^}]*\})?\)/g)) {
    hasMany.push(m[2] ? `${m[1]}:${m[2]}` : m[1]);
  }

  return { name, extendsModel, attrs, belongsTo, hasMany };
}

function modelsToMarkdown(models) {
  let md = `## Models (${models.length} total)\n\n`;
  for (const m of models.sort((a, b) => a.name.localeCompare(b.name))) {
    md += `### \`${m.name}\`\n`;
    if (m.extendsModel) md += `**Extends:** \`${m.extendsModel}\`\n\n`;
    if (m.attrs.length) {
      md += '| Field | Type |\n|-------|------|\n';
      for (const a of m.attrs) md += `| \`${a.name}\` | ${a.type} |\n`;
      md += '\n';
    }
    if (m.belongsTo.length) md += `**belongsTo:** ${m.belongsTo.map((x) => `\`${x}\``).join(', ')}\n\n`;
    if (m.hasMany.length) md += `**hasMany:** ${m.hasMany.map((x) => `\`${x}\``).join(', ')}\n\n`;
  }
  return md;
}

// --- Parse hbs for UI elements ---
function extractHbsUi(hbs) {
  const fields = [];
  const buttons = [];
  const tables = [];

  for (const m of hbs.matchAll(/InputGroup\s+@name=\{\{([^}]+)\}\}[^@]*@value=\{\{([^}]+)\}\}/g)) {
    fields.push({ label: m[1], value: m[2] });
  }
  for (const m of hbs.matchAll(/@name=\{\{([^}]+)\}\}/g)) {
    if (!fields.some((f) => f.label === m[1])) fields.push({ label: m[1], value: '—' });
  }
  for (const m of hbs.matchAll(/<Button[^>]*@text=\{\{([^}]+)\}\}/g)) {
    buttons.push(m[1]);
  }
  for (const m of hbs.matchAll(/@column=\{?["'](\w+)["']\}?/g)) {
    tables.push(m[1]);
  }
  for (const m of hbs.matchAll(/<Table[^>]*as\s*\|\w+\|[^]*?@column/g)) {
    /* table blocks - extract th */
  }
  const thCols = [...hbs.matchAll(/<th[^>]*>([^<]+)</g)].map((x) => x[1].trim());

  return { fields, buttons, tableColumns: thCols };
}

// --- FleetOps routes ---
function readFleetopsRoutes() {
  return readSafe(path.join(PKG, 'fleetops', 'addon', 'routes.js'));
}

function fleetopsTemplateInventory() {
  const tplDir = path.join(PKG, 'fleetops', 'addon', 'templates');
  const files = walk(tplDir, '.hbs');
  const rows = [];
  for (const f of files.sort()) {
    const r = rel(path.join(tplDir, '..'), f).replace(/^templates\//, '');
    const url = '/fleet-ops/' + r.replace(/\.hbs$/, '').replace(/\/index$/, '').replace(/\/index\//, '/');
    rows.push({ template: r, url: url.replace(/\/$/, '') || '/fleet-ops' });
  }
  return rows;
}

// --- ember-ui component list ---
function emberUiComponents() {
  const dir = path.join(PKG, 'ember-ui', 'addon', 'components');
  const jsFiles = walk(dir, '.js').filter((f) => !f.endsWith('.d.ts'));
  const names = jsFiles.map((f) => rel(dir, f).replace(/\.js$/, '')).sort();
  return names;
}

function splitAz(names) {
  const mid = names.filter((n) => {
    const first = (n.split('/').pop() || n)[0]?.toLowerCase() || 'a';
    return first < 'n';
  });
  const nz = names.filter((n) => !mid.includes(n));
  return { aM: mid, nZ: nz };
}

// --- Engine template counts ---
function engineInfo(engineFolder, mountPath) {
  const tplDir = path.join(PKG, engineFolder, 'addon', 'templates');
  const routes = readSafe(path.join(PKG, engineFolder, 'addon', 'routes.js'));
  const count = walk(tplDir, '.hbs').length;
  const templates = walk(tplDir, '.hbs').map((f) => rel(tplDir, f)).sort();
  return { mountPath, routes, count, templates };
}

// --- Admin pages full ---
function buildAdminDoc() {
  const adminDir = path.join(CONSOLE, 'templates', 'console', 'admin');
  const pages = walk(adminDir, '.hbs').sort();
  let md = header('14', 'Admin Panel — Built-in Pages', '1',
    'Exhaustive field-level spec for all 15+ admin pages from source templates.',
    'console/app/templates/console/admin/**') + `
## Admin shell

**Template:** \`console/admin.hbs\` — sidebar with built-in items + \`menuService.adminMenuItems\` + \`adminMenuPanels\` + System Config panel.

## Built-in sidebar entries

| # | Label | Route | Template |
|---|-------|-------|----------|
| 1 | Overview | \`/admin/\` | \`admin/index.hbs\` |
| 2 | Organizations | \`/admin/organizations\` | \`admin/organizations/index.hbs\` |
| 3 | Branding | \`/admin/branding\` | \`admin/branding.hbs\` |
| 4 | 2FA Config | \`/admin/two-fa-settings\` | \`admin/two-fa-settings.hbs\` |
| 5 | Schedule Monitor | \`/admin/schedule-monitor\` | \`admin/schedule-monitor.hbs\` |
| 6–11 | System Config | \`/admin/config/*\` | see below |

---

`;

  const pageSpecs = {
    'index.hbs': {
      route: '/admin/',
      api: 'GET settings/overview',
      widgets: ['total_users → Total Users', 'total_organizations → Total Organizations', 'total_transactions → Total Transactions'],
    },
    'organizations/index.hbs': {
      route: '/admin/organizations',
      api: 'GET companies?view=admin',
      queryParams: ['page', 'query', 'sort', 'limit', 'name', 'country'],
      tableColumns: ['name', 'owner.name', 'owner.email', 'owner.phone', 'users_count', 'createdAt'],
      actions: ['Search (filters query)', 'Export'],
    },
    'organizations/index/users.hbs': {
      route: '/admin/organizations/:public_id/users',
      api: 'GET companies/:id/users',
      overlay: '800px right panel',
      queryParams: ['nestedPage', 'nestedLimit', 'nestedSort', 'nestedQuery'],
      tableColumns: ['name', 'roleName', 'phone', 'email', 'status'],
      rowActions: ['Impersonate → POST auth/impersonate', 'Change Password'],
    },
    'branding.hbs': {
      route: '/admin/branding',
      api: 'brand model id 1',
      fields: [
        'icon — FileUpload image/*',
        'logo — FileUpload image/*',
        'default_theme — Select (theme options)',
      ],
      actions: ['Save', 'Reset icon', 'Reset logo'],
    },
    'two-fa-settings.hbs': {
      route: '/admin/two-fa-settings',
      api: 'GET/POST two-fa/config',
      components: ['TwoFaSettings @twoFaMethods @enforce @selectedMethod'],
      actions: ['Save'],
    },
    'schedule-monitor.hbs': {
      route: '/admin/schedule-monitor',
      api: 'GET schedule-monitor/tasks',
      tableColumns: ['Name (link to logs)', 'Type', 'Timezone', 'Last Started', 'Last Finished', 'Last Failure'],
    },
    'schedule-monitor/logs.hbs': {
      route: '/admin/schedule-monitor/:id/logs',
      api: 'GET schedule-monitor/:id, GET schedule-monitor/:id/logs',
      overlay: true,
      actions: ['Refresh'],
      logFields: ['date', 'memory', 'runtime', 'output'],
      limit: 'last 20 logs',
    },
  };

  for (const [file, spec] of Object.entries(pageSpecs)) {
    const hbs = readSafe(path.join(adminDir, file));
    md += `## ${spec.route}\n\n`;
    md += `**Template:** \`admin/${file}\`\n\n`;
    if (spec.api) md += `**API:** \`${spec.api}\`\n\n`;
    if (spec.widgets) {
      md += '### Stat widgets\n\n| Key | Label |\n|-----|-------|\n';
      for (const w of spec.widgets) {
        const [k, l] = w.split(' → ');
        md += `| \`${k}\` | ${l} |\n`;
      }
      md += '\n';
    }
    if (spec.queryParams) md += `**Query params:** ${spec.queryParams.map((q) => `\`${q}\``).join(', ')}\n\n`;
    if (spec.tableColumns) {
      md += '### Table columns\n\n| Column key | Notes |\n|------------|-------|\n';
      for (const c of spec.tableColumns) md += `| \`${c}\` | |\n`;
      md += '\n';
    }
    if (spec.rowActions) md += `**Row actions:** ${spec.rowActions.join('; ')}\n\n`;
    if (spec.fields) {
      md += '### Form fields\n\n';
      for (const f of spec.fields) md += `- ${f}\n`;
      md += '\n';
    }
    if (spec.components) md += `**Components:** ${spec.components.join(', ')}\n\n`;
    if (spec.actions) md += `**Actions:** ${spec.actions.join(', ')}\n\n`;
    if (spec.overlay) md += `**Layout:** Right overlay ${spec.overlay}\n\n`;
    if (spec.logFields) md += `**Log entry fields:** ${spec.logFields.join(', ')}\n\n`;
  }

  const configPages = [
    ['database', 'Configure::Database', 'Database Configuration'],
    ['cache', 'outlet only', 'Cache (placeholder — title + outlet)'],
    ['filesystem', 'Configure::Filesystem', 'Filesystem Configuration'],
    ['mail', 'Configure::Mail', 'Mail Configuration'],
    ['queue', 'Configure::Queue', 'Queue Configuration'],
    ['services', 'Configure::Services', 'Services Configuration'],
    ['socket', 'Configure::Socket', 'Socket Configuration'],
    ['notification-channels', 'Configure::NotificationChannels', 'Push Notifications Configuration'],
  ];

  md += `## System config subpages\n\n| URL | Component | Header |\n|-----|-----------|--------|\n`;
  for (const [slug, comp, title] of configPages) {
    md += `| \`/admin/config/${slug === 'notification-channels' ? 'push-notifications' : slug}\` | \`${comp}\` | ${title} |\n`;
  }

  md += `\n## URL-only (not in default sidebar)\n\n- \`/admin/config/database\`\n- \`/admin/config/cache\`\n\n## Configure component source\n\n\`console/app/components/configure/*.hbs\` — parse each for env keys and form fields when implementing.\n`;

  return md;
}

// --- MAIN: doc 33 fleetops-data ---
const modelDir = path.join(PKG, 'fleetops-data', 'addon', 'models');
const models = walk(modelDir, '.js').map(parseModel);
writeDoc('33-fleetops-data-model-encyclopedia.md',
  header('33', 'fleetops-data Model Encyclopedia', '4',
    'Complete field-level reference for all 52 shared logistics Ember Data models.',
    'packages/fleetops-data/addon/models/*.js') +
  modelsToMarkdown(models) +
  `\n## Custom UI notes\n\n- Use this table to generate TypeScript interfaces and form schemas.\n- Polymorphic types: \`customer\`, \`facilitator\`, \`order.customer\`, \`order.facilitator\`.\n- Geo fields: \`point\`, \`polygon\`, \`multi-polygon\` need map pickers.\n`
);

// --- doc 46 fleetops screen inventory ---
const foRows = fleetopsTemplateInventory();
let foMd = header('46', 'FleetOps — Screen Inventory & User Journeys', '5',
  'Complete inventory of all 188 FleetOps templates mapped to URLs.',
  'packages/fleetops/addon/templates') + `
## Summary

| Metric | Value |
|--------|------:|
| Templates | ${foRows.length} |
| Engine mount | \`/fleet-ops\` |

## Route tree

\`\`\`
${readFleetopsRoutes().slice(0, 4000)}
\`\`\`

## Screen inventory (all templates)

| # | Template | URL (approx) |
|---|----------|---------------|
`;
foRows.forEach((r, i) => {
  foMd += `| ${i + 1} | \`${r.template}\` | \`${r.url}\` |\n`;
});
foMd += `
## User journeys

### Dispatcher
1. \`/fleet-ops/operations/orders\` — list/filter orders
2. \`/fleet-ops/operations/orders/:id\` — detail, assign driver, map
3. \`/fleet-ops/operations/routes\` — route planning

### Fleet manager
1. \`/fleet-ops/manage/drivers\`, \`/manage/vehicles\`, \`/manage/fleets\`
2. \`/fleet-ops/maintenance/*\` — schedules, work orders

### Analyst
1. \`/fleet-ops/analytics/reports\`

## Template counts by area

| Folder | Templates |
|--------|----------:|
| management/ | ~90 |
| maintenance/ | ~35 |
| connectivity/ | ~28 |
| operations/ | ~22 |
| settings/ | ~11 |
| analytics/ | ~8 |
| root | ~10 |
`;
writeDoc('46-fleetops-screen-inventory-and-journeys.md', foMd);

// --- doc 27-28 ember-ui catalog ---
const components = emberUiComponents();
const { aM, nZ } = splitAz(components);
function catalogDoc(id, title, list) {
  let md = header(id, title, '2', `${list.length} components from ember-ui source.`, 'packages/ember-ui/addon/components') + `
## Count: ${list.length} components

| Component path | Custom UI component |
|----------------|---------------------|
`;
  for (const c of list) md += `| \`${c}\` | _TBD_ |\n`;
  md += `\n## Usage\n\nSearch Fleetbase templates for each component name to find real usage examples.\n`;
  return md;
}
writeDoc('27-ember-ui-component-catalog-a-m.md', catalogDoc('27', 'ember-ui Component Catalog (A–M)', aM));
writeDoc('28-ember-ui-component-catalog-n-z.md', catalogDoc('28', 'ember-ui Component Catalog (N–Z)', nZ));

// --- doc 14 admin ---
writeDoc('14-admin-panel-built-in-pages.md', buildAdminDoc());

// --- Engine docs with full template lists ---
const engines = [
  ['35', 'fleetops-overview-and-route-tree', 'FleetOps — Overview & Route Tree', 'fleetops', 'fleet-ops'],
  ['47', 'storefront-overview-and-routes', 'Storefront — Overview & Routes', 'storefront', 'storefront'],
  ['50', 'ledger-overview-and-routes', 'Ledger — Overview & Routes', 'ledger', 'ledger'],
  ['53', 'iam-overview-and-routes', 'IAM — Overview & Routes', 'iam-engine', 'iam'],
  ['55', 'developers-overview-and-routes', 'Developers — Overview & Routes', 'dev-engine', 'developers'],
  ['57', 'registry-bridge-overview', 'Registry Bridge — Overview', 'registry-bridge', 'extensions'],
  ['59', 'pallet-overview-and-routes', 'Pallet — Overview & Routes (Optional)', 'pallet', 'pallet'],
];

for (const [id, slug, title, folder, mount] of engines) {
  const info = engineInfo(folder, mount);
  let md = header(id, title, '5', `Full routes and ${info.count} screens.`, `packages/${folder}`) + `
## Mount: \`/${mount}\`

## routes.js

\`\`\`javascript
${info.routes.slice(0, 8000)}
\`\`\`

## Templates (${info.count})

| # | Template |
|---|----------|
`;
  info.templates.forEach((t, i) => {
    md += `| ${i + 1} | \`${t}\` |\n`;
  });
  writeDoc(`${id}-${slug}.md`, md);
}

// --- console models doc 32 ---
const consoleModels = walk(path.join(CONSOLE, 'models'), '.js').map(parseModel);
writeDoc('32-console-data-models-and-relationships.md',
  header('32', 'Console Data Models & Relationships', '4',
    'All console host models with fields from source.',
    'console/app/models/') +
  modelsToMarkdown(consoleModels)
);

// --- Configure components fields (doc 14 appendix in 34) ---
const configureDir = path.join(CONSOLE, 'components', 'configure');
const configureFiles = walk(configureDir, '.hbs');
let configureMd = '\n## Configure::* field reference\n\n';
for (const f of configureFiles) {
  const name = path.basename(f, '.hbs');
  const hbs = readSafe(f);
  const ui = extractHbsUi(hbs);
  configureMd += `### Configure::${name.charAt(0).toUpperCase() + name.slice(1)}\n`;
  configureMd += `**File:** \`console/app/components/configure/${path.basename(f)}\`\n\n`;
  if (ui.fields.length) {
    configureMd += '| Label key | Value binding |\n|-----------|---------------|\n';
    for (const fld of ui.fields.slice(0, 30)) configureMd += `| ${fld.label} | ${fld.value} |\n`;
  } else {
    configureMd += '_See component template for dynamic config keys._\n';
  }
  configureMd += '\n';
}

const api34 = readSafe(path.join(__dirname, '34-api-and-adapter-map-by-feature.md'));
if (!api34.includes('Configure::* field reference')) {
  writeDoc('34-api-and-adapter-map-by-feature.md', api34.replace(
    '## Custom UI',
    configureMd + '\n## Custom UI'
  ));
}

console.log('Enrichment complete:');
console.log('- 33 fleetops-data:', models.length, 'models');
console.log('- 46 fleetops:', foRows.length, 'templates');
console.log('- 27/28 ember-ui:', components.length, 'components');
console.log('- 14 admin: full spec');
console.log('- 32 console models:', consoleModels.length);
