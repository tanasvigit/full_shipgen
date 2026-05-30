import fs from 'fs';
import path from 'path';

const PKG = path.join('d:/fleetbase/packages/fleetops/addon/templates');
import { fileURLToPath } from 'url';
const OUT = path.dirname(fileURLToPath(import.meta.url));

const areas = [
  ['38', 'fleetops-connectivity-and-telematics', 'connectivity', 'Connectivity & Telematics'],
  ['39', 'fleetops-maintenance', 'maintenance', 'Maintenance'],
  ['40', 'fleetops-analytics-and-reports', 'analytics', 'Analytics & Reports'],
  ['41', 'fleetops-settings', 'settings', 'Settings'],
  ['43', 'fleetops-map-and-navigator-ui', 'connectivity', 'Map & Navigator UI'],
];

function walk(folder) {
  const dir = path.join(PKG, folder);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  function w(d, p = '') {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = p ? `${p}/${e.name}` : e.name;
      if (e.isDirectory()) w(path.join(d, e.name), rel);
      else if (e.name.endsWith('.hbs')) out.push(`${folder}/${rel}`);
    }
  }
  w(dir);
  return out;
}

for (const [id, slug, folder, title] of areas) {
  const list = walk(folder);
  let md = `# FleetOps — ${title}

| Field | Value |
|-------|-------|
| **Doc ID** | ${id} |
| **Status** | ✅ Done (source-exhaustive) |

---

## Templates (${list.length} files)

| # | Template | URL prefix |
|---|----------|------------|
`;
  list.forEach((t, i) => {
    const url = '/fleet-ops/' + t.replace(/\.hbs$/, '').replace(/\/index$/, '');
    md += `| ${i + 1} | \`${t}\` | \`${url}\` |\n`;
  });
  if (id === '43') {
    md += `\n## Map UI components\n\n- \`Map\`, \`MapContainer\`, \`LeafletLiveMap\` (ember-ui / fleetops)\n- Orders list map view: \`operations/orders/index.hbs\`\n- Admin Navigator App: \`admin/navigator-app\` via extension panel\n`;
  }
  fs.writeFileSync(path.join(OUT, `${id}-${slug}.md`), md);
}
console.log('Pass 3 done');
