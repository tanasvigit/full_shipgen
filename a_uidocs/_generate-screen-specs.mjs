/**
 * Generates developer-ready per-screen specs under a_uidocs/screens/
 * Run: node a_uidocs/_generate-screen-specs.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCREENS = path.join(__dirname, 'screens');

const ENGINES = [
  { id: 'console', label: 'Console', tpl: 'console/app/templates', ctrl: 'console/app/controllers', routes: 'console/app/routes', mount: '' },
  { id: 'fleet-ops', label: 'FleetOps', tpl: 'packages/fleetops/addon/templates', ctrl: 'packages/fleetops/addon/controllers', routes: 'packages/fleetops/addon/routes', comp: 'packages/fleetops/addon/components', mount: '/fleet-ops' },
  { id: 'storefront', label: 'Storefront', tpl: 'packages/storefront/addon/templates', ctrl: 'packages/storefront/addon/controllers', routes: 'packages/storefront/addon/routes', comp: 'packages/storefront/addon/components', mount: '/storefront' },
  { id: 'ledger', label: 'Ledger', tpl: 'packages/ledger/addon/templates', ctrl: 'packages/ledger/addon/controllers', routes: 'packages/ledger/addon/routes', comp: 'packages/ledger/addon/components', mount: '/ledger' },
  { id: 'iam', label: 'IAM', tpl: 'packages/iam-engine/addon/templates', ctrl: 'packages/iam-engine/addon/controllers', routes: 'packages/iam-engine/addon/routes', comp: 'packages/iam-engine/addon/components', mount: '/iam' },
  { id: 'developers', label: 'Developers', tpl: 'packages/dev-engine/addon/templates', ctrl: 'packages/dev-engine/addon/controllers', routes: 'packages/dev-engine/addon/routes', comp: 'packages/dev-engine/addon/components', mount: '/developers' },
  { id: 'extensions', label: 'Registry', tpl: 'packages/registry-bridge/addon/templates', ctrl: 'packages/registry-bridge/addon/controllers', routes: 'packages/registry-bridge/addon/routes', comp: 'packages/registry-bridge/addon/components', mount: '/extensions' },
  { id: 'pallet', label: 'Pallet', tpl: 'packages/pallet/addon/templates', ctrl: 'packages/pallet/addon/controllers', routes: 'packages/pallet/addon/routes', comp: 'packages/pallet/addon/components', mount: '/pallet' },
];

function read(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function walk(dir, ext, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, ext, out);
    else if (!ext || e.name.endsWith(ext)) out.push(p);
  }
  return out;
}

function kebab(s) {
  return s.replace(/::/g, '/').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function componentToPath(compRef, compRoot) {
  // Order::Details -> order/details.hbs
  const p = kebab(compRef).replace(/^layout\//, 'layout/');
  const hbs = path.join(compRoot, `${p}.hbs`);
  if (fs.existsSync(hbs)) return hbs;
  const alt = path.join(compRoot, `${p}/index.hbs`);
  if (fs.existsSync(alt)) return alt;
  return null;
}

function extractComponents(hbs) {
  const comps = new Set();
  for (const m of hbs.matchAll(/<([A-Z][A-Za-z0-9:.-]*)/g)) {
    const c = m[1];
    if (!['Input', 'LinkTo', 'FaIcon', 'Spinner', 'div', 'form', 'label', 'span', 'a', 'p', 'h1', 'h2', 'h3', 'legend', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img', 'ul', 'li', 'button'].includes(c.split('::')[0])) {
      comps.add(c);
    }
  }
  return [...comps];
}

function extractFields(hbs) {
  const fields = [];
  for (const m of hbs.matchAll(/InputGroup\s+@name=\{\{([^}]+)\}\}[^]*?(?:@value=\{\{([^}]+)\}\}|@type="([^"]+)")?/g)) {
    fields.push({ label: m[1], value: m[2] || '—', type: m[3] || 'text' });
  }
  for (const m of hbs.matchAll(/InputGroup\s+@name="([^"]+)"[^]*?@value=\{\{([^}]+)\}\}/g)) {
    fields.push({ label: m[1], value: m[2], type: 'text' });
  }
  for (const m of hbs.matchAll(/Input\s+[^@]*@value=\{\{([^}]+)\}\}[^]*@type="([^"]+)"/g)) {
    fields.push({ label: '(input)', value: m[1], type: m[2] });
  }
  return fields;
}

function extractButtons(hbs) {
  const btns = [];
  for (const m of hbs.matchAll(/<Button[^>]*@text=\{\{([^}]+)\}\}[^>]*(?:@onClick=\{\{([^}]+)\}\})?/g)) {
    btns.push({ text: m[1], action: m[2] || '—' });
  }
  for (const m of hbs.matchAll(/<Button[^>]*@text="([^"]+)"[^>]*(?:@onClick=\{\{([^}]+)\}\})?/g)) {
    btns.push({ text: m[1], action: m[2] || '—' });
  }
  return btns;
}

function extractLayout(hbs) {
  const layouts = [];
  if (hbs.includes('Layout::Section::Header')) layouts.push('Section header with title/actions');
  if (hbs.includes('Layout::Section::Body')) layouts.push('Scrollable section body');
  if (hbs.includes('Layout::Resource::Tabular')) layouts.push('Resource tabular (list + filters + table)');
  if (hbs.includes('Layout::Sidebar')) layouts.push('Sidebar navigation');
  if (hbs.includes('<Overlay')) layouts.push('Right overlay panel');
  if (hbs.includes('<Map ') || hbs.includes('<Map>')) layouts.push('Full map container');
  if (hbs.includes('ContentPanel')) layouts.push('Collapsible content panels');
  if (hbs.includes('RegistryYield')) layouts.push('Extension registry injection slot');
  if (hbs.includes('LazyEngineComponent')) layouts.push('Lazy-loaded extension component');
  return layouts;
}

function parseController(ctrlPath) {
  const result = { queryParams: [], permissions: [], columns: [], tabs: [], actionButtons: [], tasks: [] };
  const src = read(ctrlPath);
  if (!src) return result;

  for (const m of src.matchAll(/queryParams\s*=\s*\{([^}]+)\}/gs)) {
    for (const q of m[1].matchAll(/(\w+):/g)) result.queryParams.push(q[1]);
  }
  for (const m of src.matchAll(/abilities\.cannot\(['"]([^'"]+)['"]\)/g)) result.permissions.push(`cannot: ${m[1]}`);
  for (const m of src.matchAll(/permission:\s*['"]([^'"]+)['"]/g)) result.permissions.push(m[1]);
  for (const m of src.matchAll(/@task\s+\*?(\w+)/g)) result.tasks.push(m[1]);

  // columns array - simplified extraction
  const colBlock = src.match(/get columns\(\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\];\s*\}/);
  if (colBlock) {
    for (const m of colBlock[1].matchAll(/label:\s*this\.intl\.t\(['"]([^'"]+)['"]\)[\s\S]*?valuePath:\s*['"]([^'"]+)['"]/g)) {
      result.columns.push({ label: m[1], valuePath: m[2] });
    }
    for (const m of colBlock[1].matchAll(/filterParam:\s*['"]([^'"]+)['"]/g)) {
      /* filters exist */
    }
  }

  // tabs getter
  if (src.includes("get tabs()")) {
    const tabBlock = src.match(/get tabs\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/);
    if (tabBlock) {
      for (const m of tabBlock[1].matchAll(/label:\s*['"]([^'"]+)['"]/g)) result.tabs.push({ label: m[1] });
      if (src.includes('fleet-ops:component:order:details')) {
        result.tabs.push({ label: '+ extension tabs from registry fleet-ops:component:order:details' });
      }
    }
  }

  // action buttons
  if (src.includes('get actionButtons()')) {
    for (const m of src.matchAll(/text:\s*['"]([^'"]+)['"]/g)) result.actionButtons.push(m[1]);
    for (const m of src.matchAll(/disabled:\s*([^,\n}]+)/g)) {
      if (m[1].includes('model')) result.actionButtons.push(`(conditional disabled: ${m[1].trim()})`);
    }
  }

  return result;
}

function parseRoute(routePath) {
  const r = { apis: [], permissions: [], modelIncludes: [] };
  const src = read(routePath);
  if (!src) return r;
  for (const m of src.matchAll(/abilities\.cannot\(['"]([^'"]+)['"]\)/g)) r.permissions.push(m[1]);
  for (const m of src.matchAll(/queryRecord\(['"]([^'"]+)['"]/g)) {
    r.apis.push(`store.queryRecord('${m[1]}', ...)`);
    const withM = src.match(/with:\s*\[([^\]]+)\]/);
    if (withM) r.modelIncludes = withM[1].split(',').map((s) => s.trim().replace(/['"]/g, ''));
  }
  for (const m of src.matchAll(/store\.query\(['"]([^'"]+)['"]/g)) r.apis.push(`store.query('${m[1]}')`);
  for (const m of src.matchAll(/this\.fetch\.(get|post|put|patch|delete)\(['"]([^'"]+)['"]/g)) {
    r.apis.push(`${m[1].toUpperCase()} ${m[2]}`);
  }
  return r;
}

function templateToRouteName(tplRel, engineId) {
  let r = tplRel.replace(/\.hbs$/, '').replace(/\/index$/, '').replace(/\//g, '.');
  if (engineId !== 'console') r = engineId.replace(/-/g, '_') + '.' + r.replace(/-/g, '_');
  else r = 'console.' + r.replace(/-/g, '_');
  return r;
}

function templateToUrl(tplRel, mount) {
  let u = tplRel.replace(/\.hbs$/, '').replace(/\/index$/, '');
  if (mount) u = mount + '/' + u;
  else u = '/' + u;
  return u.replace(/\/+/g, '/');
}

function resolveController(tplPath, ctrlRoot, tplRel) {
  const base = tplRel.replace(/\.hbs$/, '');
  const candidates = [
    path.join(ctrlRoot, base + '.js'),
    path.join(ctrlRoot, base.replace(/\/index$/, '.js')),
    path.join(ctrlRoot, base.replace(/\/index$/, '/index.js')),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function resolveRoute(tplPath, routesRoot, tplRel) {
  const base = tplRel.replace(/\.hbs$/, '');
  const candidates = [
    path.join(routesRoot, base + '.js'),
    path.join(routesRoot, base.replace(/\/index$/, '.js')),
    path.join(routesRoot, base.replace(/\/index$/, '/index.js')),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function expandWrapperComponents(hbs, compRoot, depth = 0, seen = new Set()) {
  const sections = [];
  const comps = extractComponents(hbs);
  for (const c of comps) {
    if (!c.includes('::') && !c.match(/^[A-Z]/)) continue;
    const p = componentToPath(c, compRoot);
    if (!p || seen.has(p) || depth > 3) continue;
    seen.add(p);
    const chbs = read(p);
    const cjs = p.replace('.hbs', '.js');
    sections.push({
      component: c,
      path: p,
      fields: extractFields(chbs),
      buttons: extractButtons(chbs),
      layouts: extractLayout(chbs),
      children: depth < 2 ? expandWrapperComponents(chbs, compRoot, depth + 1, seen) : [],
    });
  }
  return sections;
}

function generateSpec(engine, tplPath, tplRel) {
  const ctrlPath = resolveController(tplPath, path.join(ROOT, engine.ctrl), tplRel);
  const routePath = resolveRoute(tplPath, path.join(ROOT, engine.routes), tplRel);
  const hbs = read(tplPath);
  const ctrl = parseController(ctrlPath || '');
  const route = parseRoute(routePath || '');
  const compRoot = engine.comp ? path.join(ROOT, engine.comp) : null;

  const routeName = templateToRouteName(tplRel, engine.id);
  const url = templateToUrl(tplRel, engine.mount);

  let md = `# Screen: ${tplRel.replace(/\.hbs$/, '')}

| Property | Value |
|----------|-------|
| **Engine** | ${engine.label} |
| **Route name** | \`${routeName}\` |
| **URL** | \`${url}\` |
| **Template** | \`${engine.tpl}/${tplRel}\` |
| **Controller** | ${ctrlPath ? `\`${path.relative(ROOT, ctrlPath)}\`` : '_none / parent controller_'} |
| **Route** | ${routePath ? `\`${path.relative(ROOT, routePath)}\`` : '_none_'} |

---

## 1. Layout structure

${extractLayout(hbs).length ? extractLayout(hbs).map((l) => `- ${l}`).join('\n') : '- Standard section outlet (infer from parent route template)'}

\`\`\`
${inferWireframe(hbs, ctrl, engine)}
\`\`\`

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
${extractFields(hbs).map((f) => `| ${f.label} | \`${f.value}\` | ${f.type} | |`).join('\n') || '| _No InputGroup fields in route template — see composed components below_ | | | |'}

---

## 3. Tables

${formatColumns(ctrl.columns)}

---

## 4. Tabs

${ctrl.tabs?.length ? ctrl.tabs.map((t) => `- ${t.label || t}`).join('\n') : '_No tab getter — single panel or tabs in parent_'}

---

## 5. Buttons & actions

| Label | Action / handler | Conditions |
|-------|------------------|------------|
${extractButtons(hbs).map((b) => `| ${b.text} | \`${b.action}\` | |`).join('\n') || ''}
${ctrl.actionButtons?.length ? ctrl.actionButtons.map((t) => `| ${t} | controller \`actionButtons\` | see disabled rules in controller |`).join('\n') : ''}

---

## 6. Modals, drawers, overlays

${extractOverlays(hbs)}

---

## 7. Filters & query params

**Query params:** ${ctrl.queryParams.length ? ctrl.queryParams.map((q) => `\`${q}\``).join(', ') : '_none in controller_'}

${hbs.includes('filter') || hbs.includes('Filter') ? '- Template uses filter components — see Layout::Resource::Tabular filterPicker props' : ''}

---

## 8. Validations & conditional logic

${extractConditionals(hbs, ctrlPath)}

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
${route.apis?.map((a) => `| Data load | \`${a}\` |`).join('\n') || '| Data load | _Infer model from route/controller_ |'}
${route.modelIncludes?.length ? `| Includes | ${route.modelIncludes.join(', ')} |` : ''}

---

## 10. Permissions

${[...new Set([...ctrl.permissions, ...route.permissions])].map((p) => `- \`${p}\``).join('\n') || '- _Check abilities service in route beforeModel_'}

---

## 11. Registries / extensions / hooks

${extractRegistries(hbs)}

---

## 12. Navigation flow

- **Enter:** Navigate to \`${url}\`
- **Exit:** Standard back or transition per host router
${routePath && read(routePath).includes('transitionTo') ? '- **Error/unauthorized:** redirect defined in route' : ''}

---

## 13. Responsive / mobile

- Console shell uses \`Layout::MobileNavbar\` for primary nav on small screens
- Sidebar hidden on map-heavy FleetOps detail routes (see parent controller \`sidebar.hideNow()\`)
- Tables use horizontal scroll / pagination footer

---

## 14. Reusable component mapping

| Ember | Custom design system |
|-------|---------------------|
${extractComponents(hbs).slice(0, 25).map((c) => `| \`${c}\` | TBD |`).join('\n')}

---

## 15. Composed components (full UI)

`;

  if (compRoot) {
    const expanded = expandWrapperComponents(hbs, compRoot);
    if (expanded.length) {
      for (const sec of expanded) {
        md += `### \`${sec.component}\`\n\n`;
        md += `**Source:** \`${path.relative(ROOT, sec.path)}\`\n\n`;
        if (sec.layouts.length) md += `**Layout:** ${sec.layouts.join('; ')}\n\n`;
        if (sec.fields.length) {
          md += '| Field | Binding |\n|-------|----------|\n';
          for (const f of sec.fields) md += `| ${f.label} | \`${f.value}\` |\n`;
          md += '\n';
        }
        if (sec.buttons.length) {
          md += '**Buttons:** ' + sec.buttons.map((b) => b.text).join(', ') + '\n\n';
        }
        for (const ch of sec.children || []) {
          md += `#### Child: \`${ch.component}\`\n\n`;
          if (ch.fields.length) {
            md += '| Field | Binding |\n|-------|----------|\n';
            for (const f of ch.fields) md += `| ${f.label} | \`${f.value}\` |\n`;
          }
          md += '\n';
        }
      }
    }
  }

  md += `\n---\n\n## 16. Source files to mirror\n\n`;
  md += `- Template: \`${engine.tpl}/${tplRel}\`\n`;
  if (ctrlPath) md += `- Controller: \`${path.relative(ROOT, ctrlPath)}\`\n`;
  if (routePath) md += `- Route: \`${path.relative(ROOT, routePath)}\`\n`;

  return md;
}

function formatColumns(cols) {
  if (!cols?.length) return '_No `columns` getter — not a list page or uses Resource::Tabular internal columns._\n';
  let s = '| Column (i18n) | valuePath | Sort | Filter |\n|---------------|-----------|------|--------|\n';
  for (const c of cols) s += `| ${c.label} | \`${c.valuePath}\` | yes | yes |\n`;
  return s;
}

function extractOverlays(hbs) {
  const o = [];
  if (hbs.includes('<Overlay')) o.push('- `Overlay` — right-side panel (check @width, @onClose)');
  if (hbs.includes('modalsManager') || hbs.includes('ModalsManager')) o.push('- Modal via `modalsManager` service');
  if (hbs.includes('ResourceContextPanel')) o.push('- `ResourceContextPanel` — global context inspector');
  return o.length ? o.join('\n') : '_None in template — may be triggered from controller actions_';
}

function extractRegistries(hbs) {
  const r = [];
  for (const m of hbs.matchAll(/@registry="([^"]+)"/g)) r.push(`- RegistryYield / registry: \`${m[1]}\``);
  for (const m of hbs.matchAll(/registry="([^"]+)"/g)) r.push(`- registry: \`${m[1]}\``);
  if (hbs.includes('LazyEngineComponent')) r.push('- LazyEngineComponent — extension page host');
  return r.length ? r.join('\n') : '_No registry slots in this template_';
}

function extractConditionals(hbs, ctrlPath) {
  const lines = [];
  for (const m of hbs.matchAll(/\{\{#if\s+([^}]+)\}\}/g)) lines.push(`- Template: \`{{#if ${m[1]}}}\``);
  const src = read(ctrlPath || '');
  for (const m of src.matchAll(/disabled:\s*([^,\n}]+)/g)) lines.push(`- Action disabled when: \`${m[1].trim()}\``);
  return lines.length ? lines.join('\n') : '- _See controller and component JS for business rules_';
}

function inferWireframe(hbs, ctrl, engine) {
  if (hbs.includes('Layout::Resource::Tabular')) {
    return `[Header: title + actions]\n[Filters row]\n[Data table with pagination]\n[Optional: map/kanban toggle above]`;
  }
  if (hbs.includes('Order::Details') || hbs.includes('order/details')) {
    return `[Map layout - sidebar hidden]\n[Tab bar: Overview + registry tabs]\n[Action menu: Edit, Cancel, Delete, ...]\n[Tab content: Activity | Detail | Payload | Map | ...]`;
  }
  if (hbs.includes('Layout::Section::Header')) {
    return `[Section Header + actions]\n[Section Body - scrollable form/panels]`;
  }
  return `[Page outlet content]`;
}

// --- main ---
if (fs.existsSync(SCREENS)) fs.rmSync(SCREENS, { recursive: true, force: true });
fs.mkdirSync(SCREENS, { recursive: true });

const index = [];
let total = 0;

for (const engine of ENGINES) {
  const tplRoot = path.join(ROOT, engine.tpl);
  const templates = walk(tplRoot, '.hbs');
  const engineDir = path.join(SCREENS, engine.id);
  fs.mkdirSync(engineDir, { recursive: true });

  for (const tplPath of templates.sort()) {
    const tplRel = path.relative(tplRoot, tplPath).replace(/\\/g, '/');
    const spec = generateSpec(engine, tplPath, tplRel);
    const outName = tplRel.replace(/\.hbs$/, '.md').replace(/\//g, '__');
    const outPath = path.join(engineDir, outName);
    fs.writeFileSync(outPath, spec, 'utf8');
    index.push({ engine: engine.id, file: outName, url: templateToUrl(tplRel, engine.mount), tpl: tplRel });
    total++;
  }
}

// Order detail sub-components as separate specs
const foComp = path.join(ROOT, 'packages/fleetops/addon/components');
const orderDetails = walk(path.join(foComp, 'order/details'), '.hbs');
const odDir = path.join(SCREENS, 'fleet-ops', '_components');
fs.mkdirSync(odDir, { recursive: true });
for (const p of orderDetails) {
  const rel = 'components/order/details/' + path.basename(p);
  const hbs = read(p);
  const spec = `# Component screen: order/details/${path.basename(p, '.hbs')}

Part of **Order detail** (\`/fleet-ops/operations/orders/:public_id\`).

## Layout
${extractLayout(hbs).map((l) => `- ${l}`).join('\n') || '- Panel section'}

## Fields
| Label | Binding |
|-------|---------|
${extractFields(hbs).map((f) => `| ${f.label} | \`${f.value}\` |`).join('\n') || '| _see template_ |'}

## Buttons
${extractButtons(hbs).map((b) => `- ${b.text} → ${b.action}`).join('\n') || '_none_'}

## Registry
${extractRegistries(hbs)}

## Source
\`packages/fleetops/addon/components/order/details/${path.basename(p)}\`
`;
  fs.writeFileSync(path.join(odDir, `order-details__${path.basename(p, '.hbs')}.md`), spec);
  index.push({ engine: 'fleet-ops', file: `_components/order-details__${path.basename(p, '.hbs')}.md`, url: '(order detail tab)', tpl: rel });
  total++;
}

// Write index
let idxMd = `# Screen specifications index

**Total specs:** ${total}  
**Generated:** ${new Date().toISOString().split('T')[0]}

Each file is developer-ready: layout, fields, tables, APIs, permissions, components.

## By engine

`;
for (const e of ENGINES) {
  const n = index.filter((i) => i.engine === e.id).length;
  idxMd += `### ${e.label} (\`${e.id}/\`) — ${n} screens\n\n`;
  const items = index.filter((i) => i.engine === e.id && !i.file.startsWith('_components'));
  idxMd += `| URL | Spec file | Template |\n|-----|-----------|----------|\n`;
  for (const i of items.slice(0, 500)) {
    idxMd += `| \`${i.url}\` | [${i.file}](./${e.id}/${i.file}) | \`${i.tpl}\` |\n`;
  }
  if (items.length > 500) idxMd += `\n_...and ${items.length - 500} more in \`${e.id}/\`_\n`;
  idxMd += '\n';
}

idxMd += `## Order detail sub-panels\n\n`;
for (const i of index.filter((x) => x.file.includes('order-details__'))) {
  idxMd += `- [${i.file}](./fleet-ops/_components/${i.file})\n`;
}

fs.writeFileSync(path.join(SCREENS, 'README.md'), idxMd);
console.log(`Generated ${total} screen specs in ${SCREENS}`);
