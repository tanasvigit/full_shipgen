/**
 * Deepens screen specs: parent controllers, field-info blocks, correct URLs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCREENS = path.join(__dirname, 'screens');

function read(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
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

function parseControllerFull(ctrlPath) {
  const src = read(ctrlPath);
  if (!src) return null;
  const o = { raw: src };
  o.actionButtons = [];
  for (const m of src.matchAll(/text:\s*'([^']+)'/g)) o.actionButtons.push(m[1]);
  o.tabs = [];
  for (const m of src.matchAll(/label:\s*'([^']+)'/g)) o.tabs.push(m[1]);
  if (src.includes('fleet-ops:component:order:details')) {
    o.tabs.push('(+ dynamic tabs from menuService registry `fleet-ops:component:order:details`)');
  }
  o.permissions = [...src.matchAll(/cannot\('([^']+)'\)/g)].map((m) => m[1]);
  o.queryParams = [...src.matchAll(/queryParams\s*=\s*\[([^\]]+)\]/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().replace(/['"]/g, '')));
  return o;
}

function parseRouteFull(routePath) {
  const src = read(routePath);
  if (!src) return null;
  const o = {};
  const qm = src.match(/queryRecord\('([^']+)'[\s\S]*?with:\s*\[([^\]]+)\]/);
  if (qm) {
    o.model = qm[1];
    o.with = qm[2].split(',').map((s) => s.trim().replace(/['"]/g, ''));
  }
  o.permissions = [...src.matchAll(/cannot\('([^']+)'\)/g)].map((m) => m[1]);
  o.hooks = [];
  if (src.includes('willTransition')) o.hooks.push('willTransition — cleanup map, sockets, sidebar restore');
  if (src.includes('afterModel')) o.hooks.push('afterModel — load related data');
  if (src.includes('beforeModel')) o.hooks.push('beforeModel — permission gate');
  return o;
}

function fixUrl(tplPath) {
  let u = tplPath.replace(/\.md$/, '').replace(/__/g, '/');
  // fleet-ops URL fixes
  u = u.replace(/\/index\/details\/index$/, '/:public_id');
  u = u.replace(/\/index\/details\/virtual$/, '/:public_id/:slug');
  u = u.replace(/\/details\/index$/, '/:public_id');
  u = u.replace(/\/details\/virtual$/, '/:public_id/:slug');
  u = u.replace(/\/index\/new$/, '/new');
  u = u.replace(/\/index\/edit$/, '/edit/:public_id');
  u = u.replace(/\/edit\/index$/, '/edit/:public_id');
  if (mount && !u.startsWith(mount)) u = mount + '/' + u.replace(/^\//, '');
  if (!mount && !u.startsWith('/console') && !u.startsWith('/auth') && !u.startsWith('/install')) {
    if (u.startsWith('auth') || u.startsWith('console') || u.startsWith('onboard') || u.startsWith('invite')) u = '/' + u;
  }
  return u.replace(/\/index$/, '').replace(/\/+/g, '/');
}

function fixUrlForEngine(file, mount) {
  let u = file.replace(/\.md$/, '').replace(/__/g, '/');
  return fixUrlGeneric(u, mount);
}

function fixUrlGeneric(u, mount) {
  u = u.replace(/\/index\/details\/index$/, '/:public_id');
  u = u.replace(/\/index\/details\/virtual$/, '/:public_id/:slug');
  u = u.replace(/\/details\/index$/, '/:public_id');
  u = u.replace(/\/details\/virtual$/, '/:public_id/:slug');
  u = u.replace(/\/index\/new$/, '/new');
  u = u.replace(/\/edit\/index$/, '/edit/:public_id');
  if (mount && !u.startsWith(mount)) u = mount + '/' + u.replace(/^\//, '');
  return u.replace(/\/index$/, '').replace(/\/+/g, '/');
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

// --- Order detail master spec ---
function buildOrderDetailMaster() {
  const parentCtrl = parseControllerFull(path.join(ROOT, 'packages/fleetops/addon/controllers/operations/orders/index/details.js'));
  const parentRoute = parseRouteFull(path.join(ROOT, 'packages/fleetops/addon/routes/operations/orders/index/details.js'));
  const compDir = path.join(ROOT, 'packages/fleetops/addon/components/order/details');

  let md = `# Screen: Order detail (complete)

| Property | Value |
|----------|-------|
| **URL** | \`/fleet-ops/operations/orders/:public_id\` |
| **Route name** | \`fleet-ops.operations.orders.index.details\` |
| **Parent template** | \`operations/orders/index/details/index.hbs\` |
| **Root component** | \`Order::Details\` |

---

## Wireframe

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│ Console header (map layout active, sidebar HIDDEN)            │
├─────────────────────────────────────────────────────────────┤
│ [Tabs: Overview | Activity | Detail | ... | extension tabs] │
│ [Action dropdown: Edit | Update activity | Unassign | ...]  │
├──────────────────────────┬──────────────────────────────────┤
│  MAP (Leaflet)           │  Active tab panel (scroll)        │
│  - route polyline        │  ContentPanel sections            │
│  - driver marker         │  field-info rows / tables         │
│  - order waypoints       │  registry-injected extension UI   │
└──────────────────────────┴──────────────────────────────────┘
\`\`\`

---

## Parent route — data load

| Item | Value |
|------|-------|
| Model | \`${parentRoute?.model || 'order'}\` |
| Permission | \`${parentRoute?.permissions?.join('`, `') || 'fleet-ops view order'}\` |
| Includes | ${parentRoute?.with?.join(', ') || 'payload, driverAssigned, orderConfig, customer, facilitator, trackingStatuses, trackingNumber, purchaseRate, comments, files'} |

**API:** \`store.queryRecord('order', { public_id, single: true, with: [...] })\`  
**After model:** \`order.loadTrackingActivity()\`, conditional \`order.reload()\`

**Lifecycle hooks:** ${parentRoute?.hooks?.map((h) => `\n- ${h}`).join('') || ''}

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Overview | \`operations.orders.index.details.index\` |
${parentCtrl?.tabs?.map((t) => `| ${t} | (registry or static) |`).join('\n') || ''}

---

## Parent controller — action menu

| Action | Disabled when |
|--------|----------------|
${parentCtrl?.actionButtons?.filter((t) => !t.includes('conditional')).map((t) => `| ${t} | see controller |`).join('\n') || ''}

| Edit details | \`status === 'canceled'\` |
| Update activity | \`status === 'canceled'\` |
| Unassign driver | canceled OR no driver_assigned |
| Cancel order | \`status === 'canceled'\` |
| Delete order | always enabled (confirm modal) |
| Listen to socket channel | → developers socket view |
| View metadata | modal |
| View order label | action |

**Setup (on enter):** switches orders index to map layout; adds routing control; hides sidebar; shows driver layer on map; starts \`orderSocketEvents\`.

---

## Tab panels (composed components)

`;

  for (const f of walk(compDir, '.hbs')) {
    const name = path.basename(f, '.hbs');
    const hbs = read(f);
    const fields = extractFieldInfo(hbs);
    md += `### Tab: \`${name}\`\n\n`;
    md += `**File:** \`order/details/${name}.hbs\`\n\n`;
    if (hbs.includes('ActivityTimeline')) md += '**UI:** Timeline vs list toggle (`layout`)\n\n';
    if (hbs.includes('field-info-container')) {
      md += '| Display field |\n|---------------|\n';
      for (const fd of fields.slice(0, 40)) md += `| ${fd} |\n`;
      md += '\n';
    }
    const btns = [...hbs.matchAll(/@text="([^"]+)"/g)].map((m) => m[1]);
    if (btns.length) md += `**Buttons:** ${btns.join(', ')}\n\n`;
  }

  md += `
---

## Registry

- \`fleet-ops:component:order:details\` — extension tabs/components (Storefront, Ledger, etc.)

## Virtual sub-route

\`/fleet-ops/operations/orders/:public_id/:slug\` — \`details/virtual.hbs\` → LazyEngineComponent

## Mobile

- Sidebar forced hidden on detail
- Map + panel split; on narrow screens stack vertically (implement in custom CSS)

## Custom component map

| Ember | Build as |
|-------|----------|
| Order::Details | OrderDetailPage layout |
| Order::Details::* | Tab panels |
| Driver::Pill / Vehicle::Pill | Assignee chips |
| RegistryYield | Plugin tabs |
| Map / Leaflet | MapView + RouteLayer |
`;

  fs.writeFileSync(
    path.join(SCREENS, 'fleet-ops', 'MASTER__order-detail-complete.md'),
    md
  );
}

buildOrderDetailMaster();

// --- Post-process all engine screen specs ---
let enriched = 0;

const engineDirs = fs.readdirSync(SCREENS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

for (const engineId of engineDirs) {
  if (engineId === '_components') continue;
  const foDir = path.join(SCREENS, engineId);
  const ctrlBase = engineId === 'console'
    ? 'console/app/controllers'
    : `packages/${engineId === 'fleet-ops' ? 'fleetops' : engineId === 'developers' ? 'dev-engine' : engineId === 'extensions' ? 'registry-bridge' : engineId === 'iam' ? 'iam-engine' : engineId}/addon/controllers`;
  const routeBase = ctrlBase.replace('/controllers', '/routes');
  const mount = engineId === 'console' ? '' : `/${engineId === 'fleet-ops' ? 'fleet-ops' : engineId}`;

for (const file of fs.readdirSync(foDir).filter((f) => f.endsWith('.md') && !f.startsWith('MASTER'))) {
  const fp = path.join(foDir, file);
  let md = read(fp);
  const tplPath = file.replace(/\.md$/, '').replace(/__/g, '/');
  const fixedUrl = fixUrlForEngine(file, mount);

  if (md.includes(fixedUrl) === false && md.includes('**URL**')) {
    md = md.replace(/\*\*URL\*\* \| `[^`]+`/, `**URL** | \`${fixedUrl}\``);
  }

  // Find parent controller (strip /index from path)
  const ctrlCandidates = [
    `${ctrlBase}/${tplPath}.js`,
    `${ctrlBase}/${tplPath.replace(/\/index$/, '')}.js`,
    `${ctrlBase}/${tplPath.replace(/\/index\/index$/, '')}.js`,
  ];
  let parentCtrl = null;
  for (const c of ctrlCandidates) {
    const full = path.join(ROOT, c);
    if (fs.existsSync(full)) {
      const p = parseControllerFull(full);
      if (p && (p.actionButtons.length || p.tabs.length)) parentCtrl = { path: c, ...p };
    }
  }

  const routeCandidates = [
    `${routeBase}/${tplPath}.js`,
    `${routeBase}/${tplPath.replace(/\/index$/, '')}.js`,
  ];
  let parentRoute = null;
  for (const c of routeCandidates) {
    const full = path.join(ROOT, c);
    if (fs.existsSync(full)) {
      const p = parseRouteFull(full);
      if (p?.model) parentRoute = { path: c, ...p };
    }
  }

  let appendix = '\n\n---\n\n## Deep specification (auto-enriched)\n\n';
  let changed = false;

  if (parentRoute) {
    changed = true;
    appendix += `### Route model (\`${parentRoute.path}\`)\n\n`;
    appendix += `- **Model:** \`${parentRoute.model}\`\n`;
    appendix += `- **With:** ${parentRoute.with?.join(', ')}\n`;
    appendix += `- **Permissions:** ${parentRoute.permissions?.join(', ')}\n`;
    if (parentRoute.hooks?.length) appendix += `- **Hooks:** ${parentRoute.hooks.join('; ')}\n`;
    appendix += '\n';
  }

  if (parentCtrl && (parentCtrl.actionButtons.length || parentCtrl.tabs.length)) {
    changed = true;
    appendix += `### Controller actions/tabs (\`${parentCtrl.path}\`)\n\n`;
    if (parentCtrl.tabs.length) {
      appendix += '**Tabs:**\n';
      for (const t of parentCtrl.tabs) appendix += `- ${t}\n`;
    }
    if (parentCtrl.actionButtons.length) {
      appendix += '\n**Actions:**\n';
      for (const a of [...new Set(parentCtrl.actionButtons)]) appendix += `- ${a}\n`;
    }
    appendix += '\n';
  }

  // Expand single-component templates
  const compMatch = read(fp).match(/### `([^`]+)`/);
  if (tplPath.includes('details/index') && !md.includes('MASTER')) {
    appendix += `> **Full merged spec:** [MASTER__order-detail-complete.md](./MASTER__order-detail-complete.md)\n\n`;
    changed = true;
  }

  if (changed) {
    if (!md.includes('## Deep specification')) {
      md += appendix;
      fs.writeFileSync(fp, md);
      enriched++;
    }
  }
}
}

// Deepen _components order detail files
const compDir = path.join(ROOT, 'packages/fleetops/addon/components/order/details');
const compOut = path.join(SCREENS, 'fleet-ops', '_components');
for (const f of walk(compDir, '.hbs')) {
  const name = path.basename(f, '.hbs');
  const hbs = read(f);
  const fields = extractFieldInfo(hbs);
  const out = path.join(compOut, `order-details__${name}.md`);
  let md = `# Order detail tab: ${name}

| Property | Value |
|----------|-------|
| **Parent screen** | [Order detail complete](../MASTER__order-detail-complete.md) |
| **Component** | \`Order::Details::${name.charAt(0).toUpperCase() + name.slice(1)}\` |
| **Source** | \`packages/fleetops/addon/components/order/details/${name}.hbs\` |

## Layout

${read(f).includes('ContentPanel') ? '- ContentPanel (bordered-top) with optional actionButtons' : '- Custom layout — read template'}

## Display fields & labels

| Field / i18n key |
|----------------|
${fields.map((fd) => `| ${fd} |`).join('\n') || '| _parse template manually_ |'}

## Buttons

${[...hbs.matchAll(/<Button[^>]*@text=\{\{t\s+"([^"]+)"\}\}/g)].map((m) => `- ${m[1]}`).join('\n') || [...hbs.matchAll(/@text="([^"]+)"/g)].map((m) => `- ${m[1]}`).join('\n') || '_none_'}

## Conditionals

${[...hbs.matchAll(/\{\{#if\s+([^}]+)\}\}/g)].map((m) => `- \`#if ${m[1]}\``).join('\n') || '_none_'}

## Child components

${[...hbs.matchAll(/<([A-Z][A-Za-z0-9:.-]*)/g)].map((m) => m[1]).filter((c) => c.includes('::')).slice(0, 15).map((c) => `- \`${c}\``).join('\n')}

## Custom UI notes

Rebuild as a tab panel inside OrderDetailPage. Bind to \`order\` model properties from doc 33.
`;
  fs.writeFileSync(out, md);
}

console.log(`Deep enrich: ${enriched} fleet-ops screens updated + order detail master + ${walk(compDir, '.hbs').length} tab specs`);
