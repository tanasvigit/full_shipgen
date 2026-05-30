/**
 * Generates behavior docs for all *-actions services and core platform services.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseActionServiceFile, serviceDocMarkdown, read } from './_lib/behavior-parser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'behavior', 'services');

fs.mkdirSync(OUT, { recursive: true });

const serviceDirs = [
  path.join(ROOT, 'packages/fleetops/addon/services'),
  path.join(ROOT, 'packages/ember-core/addon/services'),
];

const catalog = [];

for (const dir of serviceDirs) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.js') || f.includes('universe')) continue;
    const fp = path.join(dir, f);
    if (f.endsWith('-actions.js') || f === 'resource-action.js' || f === 'crud.js' || f === 'notifications.js' || f === 'order-socket-events.js') {
      const svc = parseActionServiceFile(fp);
      const md = serviceDocMarkdown({ ...svc, path: path.relative(ROOT, fp) });
      fs.writeFileSync(path.join(OUT, `${svc.name}.md`), md);
      catalog.push({ name: svc.name, methods: svc.methods.length, file: `${svc.name}.md` });
    }
  }
}

// Platform patterns doc
fs.writeFileSync(
  path.join(__dirname, 'behavior', 'PLATFORM-RUNTIME-PATTERNS.md'),
  read(path.join(__dirname, 'behavior', 'PLATFORM-RUNTIME-PATTERNS.md')) ||
    `# Platform runtime patterns

## modalsManager

| Method | Use |
|--------|-----|
| \`confirm({ title, body, confirm, decline })\` | Destructive/irreversible actions |
| \`show(component, options)\` | Forms and multi-step editors |
| \`modal.startLoading()\` | Disables accept during async |
| \`modal.stopLoading()\` | Re-enable on error |
| \`modal.done()\` | Close modal on success |

## ember-concurrency tasks

- UI: \`@isLoading={{task.isRunning}}\` or \`perform this.task\`
- Cancel: task restarts on route change unless \`drop: true\`

## ResourceActionService (base for *-actions)

- \`delete\` → confirm → \`deleteTask\` → refresh optional
- \`create/update\` → \`createTask/updateTask\` → success toast + \`events.track*\`
- \`bulkDelete\` → \`crud.bulkDelete\` → refresh + untoggleSelectAll
- \`refresh\` → \`router.refresh()\`

## notifications

- \`success\` / \`warning\` / \`error\`
- \`serverError(error)\` — first API error message or fallback

## order-socket-events

- \`start(order, onEvent, { debounceMs })\` → subscribe \`order.{public_id}\`
- Reloadable: order.created, order.completed, waypoint.activity, entity.activity
- \`stop(order)\` on route exit

## abilities

- Route \`beforeModel\`: \`abilities.cannot('fleet-ops view order')\` → warning + redirect
- Columns: \`permission: 'fleet-ops view order'\`

## tableContext

- Bulk ops use \`getSelectedRows()\` / \`getSelectedIds()\`
- After bulk success: \`untoggleSelectAll()\`

## resourceContextPanel

- Side panel alternative to modal for create/edit (orders use for route editor, create order)
`
);

let idx = `# Behavior service catalog\n\n| Service | Methods documented |\n|---------|------------------:|\n`;
for (const c of catalog.sort((a, b) => a.name.localeCompare(b.name))) {
  idx += `| [${c.name}](./services/${c.file}) | ${c.methods} |\n`;
}
idx += `\nSee also [PLATFORM-RUNTIME-PATTERNS.md](./PLATFORM-RUNTIME-PATTERNS.md)\n`;
fs.writeFileSync(path.join(__dirname, 'behavior', 'README.md'), idx);

console.log(`Behavior catalog: ${catalog.length} services → ${OUT}`);
