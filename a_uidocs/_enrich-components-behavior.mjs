/**
 * Appends section 17 to fleet-ops/_components/*.md from component JS/HBS.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  read,
  parseComponentBehavior,
  parseConditionals,
  formatBehaviorSection,
  analyzeMethodBody,
  extractActionMethods,
} from './_lib/behavior-parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const COMP_DIR = path.join(__dirname, 'screens', 'fleet-ops', '_components');
const PKG = path.join(ROOT, 'packages/fleetops/addon');

const SERVICE_CACHE = new Map();
function loadService(rel) {
  if (SERVICE_CACHE.has(rel)) return SERVICE_CACHE.get(rel);
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) return null;
  const methods = extractActionMethods(read(fp));
  const map = new Map(methods.map((m) => [m.name, { ...m, ...analyzeMethodBody(m.body, m.name) }]));
  SERVICE_CACHE.set(rel, map);
  return map;
}

function stripOld(md) {
  const i = md.indexOf('\n## 17. Runtime behavior');
  return i >= 0 ? md.slice(0, i) : md;
}

function extractFieldInfo(hbs) {
  const fields = [];
  for (const m of hbs.matchAll(/field-name[^>]*>\s*(?:<span>)?([^<]+)/g)) {
    const n = m[1].trim();
    if (n && !n.startsWith('{{')) fields.push(n);
  }
  for (const m of hbs.matchAll(/\{\{t\s+"([^"]+)"\}\}/g)) {
    if (/fields\.|column\.|common\./.test(m[1])) fields.push(`i18n:${m[1]}`);
  }
  return [...new Set(fields)];
}

function resolveComponentPaths(res, slug) {
  if (slug === 'positions') {
    return {
      js: path.join(PKG, 'components/positions-replay.js'),
      hbs: path.join(PKG, 'components/positions-replay.hbs'),
    };
  }
  if (slug === 'index' || slug === 'details') {
    return {
      js: path.join(PKG, 'components', res.compKey, 'details.js'),
      hbs: path.join(PKG, 'components', res.compKey, 'details.hbs'),
    };
  }
  const paths = [
    { js: path.join(PKG, 'components', res.compKey, `${slug}.js`), hbs: path.join(PKG, 'components', res.compKey, `${slug}.hbs`) },
    { js: path.join(PKG, 'components', res.compKey, 'details', `${slug}.js`), hbs: path.join(PKG, 'components', res.compKey, 'details', `${slug}.hbs`) },
    { js: path.join(PKG, 'components', 'device', 'manager.js'), hbs: path.join(PKG, 'components', 'device', 'manager.hbs') },
  ];
  if (slug === 'devices') return paths[2];
  return paths.find((p) => fs.existsSync(p.js) || fs.existsSync(p.hbs)) || paths[0];
}

const RESOURCE_COMPONENTS = [
  { prefix: 'order-details', compKey: 'order', service: 'packages/fleetops/addon/services/order-actions.js' },
  { prefix: 'driver-details', compKey: 'driver', service: 'packages/fleetops/addon/services/driver-actions.js' },
  { prefix: 'vehicle-details', compKey: 'vehicle', service: 'packages/fleetops/addon/services/vehicle-actions.js' },
  { prefix: 'place-details', compKey: 'place', service: 'packages/fleetops/addon/services/place-actions.js' },
];

let count = 0;
for (const file of fs.readdirSync(COMP_DIR).filter((f) => f.endsWith('.md'))) {
  const res = RESOURCE_COMPONENTS.find((r) => file.startsWith(`${r.prefix}__`));
  if (!res) continue;
  const slug = file.replace(new RegExp(`^${res.prefix}__`), '').replace(/\.md$/, '');
  const { js: jsPath, hbs: hbsPath } = resolveComponentPaths(res, slug);
  const js = fs.existsSync(jsPath) ? read(jsPath) : '';
  const hbs = fs.existsSync(hbsPath) ? read(hbsPath) : '';
  if (!js && !hbs) continue;

  const fields = extractFieldInfo(hbs);
  let md = stripOld(read(path.join(COMP_DIR, file)));

  if (md.includes('_parse template manually_') && fields.length) {
    md = md.replace(
      /\| Field \/ i18n key \|\n\|----------------\|\n\| _parse template manually_ \|/,
      `| Field / i18n key |\n|----------------|\n${fields.map((f) => `| ${f} |`).join('\n')}`
    );
  }

  const comp = js ? parseComponentBehavior(js) : null;
  const actionMap = loadService(res.service);
  const svcName = path.basename(res.service, '.js');
  const serviceBehaviors = [];
  if (actionMap) {
    for (const m of js.matchAll(/this\.(\w+)\.(\w+)/g)) {
      if (actionMap.has(m[2])) serviceBehaviors.push({ service: svcName, name: m[2], ...actionMap.get(m[2]) });
    }
  }

  let extra = `### Component source\n\n\`${path.relative(ROOT, jsPath || hbsPath).replace(/\\/g, '/')}\`\n\n`;
  if (slug === 'positions') {
    extra += `**Behavior:** GPS replay via \`positionPlayback\` service; date filter; map markers; play/pause; fetches positions for driver or vehicle resource.\n\n`;
  }
  const conds = parseConditionals(hbs);
  if (conds.length) {
    extra += `**Branches:**\n${conds.map((c) => `- \`#if ${c}\``).join('\n')}\n\n`;
  }

  md += formatBehaviorSection({
    controller: comp,
    route: null,
    hbs,
    serviceBehaviors,
    extra,
    isListScreen: false,
  });
  fs.writeFileSync(path.join(COMP_DIR, file), md);
  count++;
}

console.log(`Component behavior sections appended to ${count} specs`);
