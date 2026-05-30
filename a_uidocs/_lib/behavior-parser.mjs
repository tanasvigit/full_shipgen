/**
 * Parses Ember JS for implementation-level behavior documentation.
 */
import fs from 'fs';

export function read(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

export function parseServices(src) {
  const s = [];
  for (const m of src.matchAll(/@service(?:\(['"]([^'"]+)['"]\))?\s+(\w+)/g)) s.push({ name: m[2], key: m[1] || m[2] });
  for (const m of src.matchAll(/@service\(['"]([^'"]+)['"]\)/g)) {
    if (!s.some((x) => x.key === m[1])) s.push({ name: m[1].split('/').pop(), key: m[1] });
  }
  return s;
}

export function parseConditionals(hbs) {
  return [...hbs.matchAll(/\{\{#if\s+([^}]+)\}\}/g)].map((m) => m[1].trim());
}

export function parseLoadingStates(hbs, src) {
  const states = [];
  if (hbs.includes('@isLoading') || hbs.includes('isLoading')) states.push('Button/component `@isLoading` binds to async task running state');
  if (hbs.includes('Spinner')) states.push('Spinner shown during upload/async operations');
  if (hbs.includes('@isLoadingActivity')) states.push('Activity panel loading via `@isLoadingActivity`');
  for (const m of (src + hbs).matchAll(/\.isRunning/g)) states.push('Task `.isRunning` disables UI during ember-concurrency task');
  for (const m of (src + hbs).matchAll(/\.isIdle/g)) states.push('Waits for task `.isIdle` before rendering (e.g. 2FA settings)');
  if (hbs.includes('{{else}}') && hbs.includes('#each')) states.push('Empty state: `{{else}}` branch on `#each` when no records');
  return [...new Set(states)];
}

export function extractActionMethods(src) {
  const methods = [];
  const actionRegex =
    /@action\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*@(?:action|task)|\n\s*#\w|\n\s*(?:get |set )?\w+\s*[=({]|\n\})/g;
  let m;
  while ((m = actionRegex.exec(src)) !== null) {
    methods.push({ name: m[1], body: m[2], kind: 'action' });
  }
  const taskRegex =
    /@task\s+\*?(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n\s*@(?:action|task)|\n\s*#\w|\n\s*(?:get |set )?\w+\s*[=({]|\n\})/g;
  while ((m = taskRegex.exec(src)) !== null) {
    methods.push({ name: m[1], body: m[2], kind: 'task' });
  }
  for (const m of src.matchAll(/^\s{4}(\w+)\([^)]*\)\s*\{/gm)) {
    const name = m[1];
    if (['constructor', 'initialize', 'willDestroy'].includes(name)) continue;
    if (methods.some((x) => x.name === name)) continue;
    const start = m.index;
    const body = src.slice(start, start + 800);
    methods.push({ name, body, kind: 'method' });
  }
  return methods;
}

export function parseServiceSurface(src) {
  const surface = { panel: [], modal: [], transition: [], custom: [] };
  for (const block of ['panel', 'modal', 'transition']) {
    const re = new RegExp(`${block}\\s*=\\s*\\{([\\s\\S]*?)\\n\\s*\\};`, 'm');
    const match = src.match(re);
    if (!match) continue;
    for (const key of match[1].matchAll(/(\w+)\s*:/g)) surface[block].push(key[1]);
  }
  for (const m of src.matchAll(/@action\s+(?:async\s+)?(\w+)/g)) {
    if (!surface.custom.includes(m[1])) surface.custom.push(m[1]);
  }
  return surface;
}

const RESOURCE_ACTION_BASE = 'packages/ember-core/addon/services/resource-action.js';
let _baseMethodsCache = null;

function getResourceActionBaseMethods() {
  if (_baseMethodsCache) return _baseMethodsCache;
  const fp = RESOURCE_ACTION_BASE;
  _baseMethodsCache = extractActionMethods(read(fp)).map((m) => ({
    ...m,
    ...analyzeMethodBody(m.body, m.name),
    kind: m.kind,
    inherited: true,
  }));
  return _baseMethodsCache;
}

export function analyzeMethodBody(body, methodName) {
  const b = {
    name: methodName,
    triggers: [],
    modals: [],
    apis: [],
    notifications: [],
    navigation: [],
    stateChanges: [],
    permissions: [],
    earlyReturns: [],
    loading: [],
    errors: [],
    sockets: [],
    validation: [],
  };

  if (/modalsManager\.confirm/.test(body)) {
    const title = body.match(/title:\s*this\.intl\.t\(['"]([^'"]+)['"]\)/);
    const accept = body.match(/acceptButtonText:\s*this\.intl\.t\(['"]([^'"]+)['"]\)/);
    b.modals.push({
      type: 'confirm',
      title: title?.[1] || 'confirm dialog',
      accept: accept?.[1],
      flow: 'User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`',
    });
  }
  if (/modalsManager\.show/.test(body)) {
    const comp = body.match(/(?:component:|content:|['"]modals\/([^'"]+)['"]|show\(['"]([^'"]+)['"])/);
    b.modals.push({
      type: 'show',
      component: comp?.[1] || comp?.[2] || 'modal component',
      flow: 'Opens modal; confirm handler may call save/API; decline may rollback',
    });
  }
  if (/return this\.notifications\.warning/.test(body)) b.earlyReturns.push('Shows warning toast and returns (no modal)');
  if (/if\s*\(!/.test(body)) b.earlyReturns.push('Guard clause with early return on missing preconditions');

  for (const api of body.matchAll(/this\.fetch\.(get|post|put|patch|delete)\(\s*[`'"]([^`'"]+)[`'"]/g)) {
    b.apis.push({ method: api[1].toUpperCase(), path: api[2] });
  }
  for (const api of body.matchAll(/\.save\(\)/g)) b.apis.push({ method: 'SAVE', path: 'Ember Data record.save()' });
  for (const n of body.matchAll(/notifications\.(success|error|warning|serverError)\(/g)) {
    const msg = body.match(new RegExp(`notifications\\.${n[1]}\\([^)]*intl\\.t\\(['"]([^'"]+)['"]`));
    b.notifications.push({ type: n[1], messageKey: msg?.[1] || '(dynamic)' });
  }
  for (const t of body.matchAll(/transitionTo\(['"]([^'"]+)['"]/g)) b.navigation.push(`transitionTo \`${t[1]}\``);
  for (const t of body.matchAll(/hostRouter\.transitionTo\(['"]([^'"]+)['"]/g)) b.navigation.push(`hostRouter.transitionTo \`${t[1]}\``);
  for (const t of body.matchAll(/hostRouter\.refresh/g)) b.navigation.push('`hostRouter.refresh()` after success');
  for (const t of body.matchAll(/router\.refresh/g)) b.navigation.push('`router.refresh()` after success');
  for (const s of body.matchAll(/\.set\(['"]([^'"]+)['"],\s*([^)]+)\)/g)) b.stateChanges.push(`set \`${s[1]}\` = ${s[2].trim()}`);
  for (const s of body.matchAll(/\.setProperties\(\{([^}]+)\}/g)) b.stateChanges.push(`setProperties { ${s[1].trim()} }`);
  for (const p of body.matchAll(/abilities\.cannot\(['"]([^'"]+)['"]\)/g)) b.permissions.push(`Blocked if cannot \`${p[1]}\``);
  if (/modal\.startLoading/.test(body)) b.loading.push('Modal accept: `startLoading()`');
  if (/modal\.stopLoading/.test(body)) b.loading.push('On error: `modal.stopLoading()`');
  if (/modal\.done/.test(body)) b.loading.push('On success: `modal.done()` closes modal');
  if (/rollbackAttributes/.test(body)) b.errors.push('Decline/cancel: `rollbackAttributes()` on model');
  if (/crud\.bulkAction/.test(body)) {
    const path = body.match(/actionPath:\s*['"]([^'"]+)['"]/);
    const method = body.match(/actionMethod:\s*['"]([^'"]+)['"]/);
    b.apis.push({ method: method?.[1] || 'POST', path: path?.[1] || 'bulk action', bulk: true });
    b.triggers.push('Bulk action via `crud.bulkAction` with selected table rows');
  }
  if (/tableContext\.getSelectedRows/.test(body)) b.triggers.push('Uses `tableContext.getSelectedRows()` for selection');
  if (/resourceContextPanel\.open/.test(body)) b.triggers.push('Opens `resourceContextPanel` side panel instead of full route');

  return b;
}

export function parseControllerBehavior(src) {
  const b = {
    services: parseServices(src),
    queryParams: [],
    tasks: [],
    actionButtons: [],
    disabledRules: [],
    permissions: [],
    hooks: [],
  };
  for (const m of src.matchAll(/queryParams\s*=\s*\{([^}]+)\}/gs)) {
    for (const q of m[1].matchAll(/(\w+):/g)) b.queryParams.push(q[1]);
  }
  for (const m of src.matchAll(/queryParams\s*=\s*\[([^\]]+)\]/g)) {
    b.queryParams.push(...m[1].split(',').map((s) => s.trim().replace(/['"]/g, '')));
  }
  if (src.includes('get bulkActions()')) {
    b.bulkActions = [];
    const block = src.match(/get bulkActions\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/);
    if (block) {
      for (const ob of block[1].split(/\n\s*\{/).slice(1)) {
        const chunk = `{${ob}`;
        if (chunk.includes('separator')) continue;
        const label = chunk.match(/label:\s*this\.intl\.t\(['"]([^'"]+)['"]/)?.[1];
        const fn = chunk.match(/fn:\s*this\.(\w+)\.(\w+)/);
        if (label || fn) {
          b.bulkActions.push({
            label: label || fn[2],
            handler: fn ? `${fn[1]}.${fn[2]}` : null,
          });
        }
      }
    }
  }
  if (src.includes('get actionButtons()')) {
    const block = src.match(/get actionButtons\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/);
    if (block) {
      const body = block[1];
      const itemBlocks = body.includes('items:')
        ? [...body.matchAll(/\{\s*text:[\s\S]*?(?=\n\s*\},|\n\s*\{)/g)].map((m) => m[0])
        : body.split(/\n\s*\{/).slice(1).map((s) => `{${s}`);
      for (const ib of itemBlocks) {
        const text =
          ib.match(/text:\s*'([^']+)'/)?.[1] ||
          ib.match(/text:\s*this\.intl\.t\(['"]([^'"]+)['"]\)/)?.[1] ||
          ib.match(/helpText:\s*this\.intl\.t\(['"]([^'"]+)['"]\)/)?.[1];
        if (!text && !ib.includes('onClick') && !ib.includes('fn:')) continue;
        const btn = {
          text: text || '(action)',
          disabled: ib.match(/disabled:\s*([^,\n}]+)/)?.[1]?.trim(),
          handler:
            ib.match(/fn:\s*\(\)\s*=>\s*this\.(\w+)\.(\w+)/)?.slice(1).join('.') ||
            ib.match(/onClick:\s*this\.(\w+)\.(\w+)/)?.slice(1).join('.') ||
            ib.match(/onClick:\s*\(\)\s*=>\s*this\.(\w+)\.(\w+)/)?.slice(1).join('.') ||
            null,
        };
        b.actionButtons.push(btn);
        if (btn.disabled) b.disabledRules.push(btn.disabled);
      }
    }
  }
  if (src.includes('get tabs()')) {
    b.tabs = [];
    const block = src.match(/get tabs\(\)[\s\S]*?return\s*\[([\s\S]*?)\];/);
    if (block) {
      for (const m of block[1].matchAll(/label:\s*'([^']+)'/g)) b.tabs.push(m[1]);
      for (const m of block[1].matchAll(/route:\s*'([^']+)'/g)) b.tabs.push(`route: ${m[1]}`);
    }
  }
  for (const m of src.matchAll(/@task\s+\*?(\w+)/g)) b.tasks.push(m[1]);
  for (const m of src.matchAll(/@action\s+(\w+)/g)) b.hooks.push(`@action ${m[1]}`);
  if (src.includes('sidebar.hideNow')) b.hooks.push('`sidebar.hideNow()` on setup — hides sidebar');
  if (src.includes('orderSocketEvents.start')) b.hooks.push('`orderSocketEvents.start(model)` — realtime channel subscription');
  if (src.includes('orderSocketEvents.stop')) b.hooks.push('`orderSocketEvents.stop` on route exit');
  return b;
}

export function parseRouteBehavior(src) {
  const b = { permissions: [], model: null, includes: [], hooks: [], apis: [] };
  for (const m of src.matchAll(/cannot\(['"]([^'"]+)['"]\)/g)) {
    b.permissions.push({ rule: m[1], effect: 'redirect/warning — see route for target' });
  }
  const qm = src.match(/queryRecord\(['"]([^'"]+)['"][\s\S]*?\{([\s\S]*?)\}\s*\)/);
  if (qm) {
    b.model = qm[1];
    const withM = qm[2].match(/with:\s*\[([\s\S]*?)\]/);
    if (withM) {
      b.includes = withM[1].split(',').map((s) => s.trim().replace(/['"]/g, '')).filter(Boolean);
    }
    if (qm[2].includes('single: true')) b.queryOptions = ['single: true', ...(b.includes?.length ? [`with: [${b.includes.length} relations]`] : [])];
  }
  if (src.includes('willTransition')) b.hooks.push('`willTransition`: cleanup listeners, map controls, restore sidebar');
  if (src.includes('loadTrackingActivity')) b.hooks.push('`afterModel`: `order.loadTrackingActivity()` then optional `order.reload()` if `meta._index_resource`');
  else if (src.includes('afterModel')) b.hooks.push('`afterModel`: secondary loads after primary model');
  if (src.includes('beforeModel')) b.hooks.push('`beforeModel`: auth/permission gate before fetch');
  if (src.includes('error(')) b.hooks.push('`error` action: `notifications.serverError` + redirect');
  for (const m of src.matchAll(/transitionTo\(['"]([^'"]+)['"]/g)) b.hooks.push(`On failure redirects to \`${m[1]}\``);
  return b;
}

export function parseComponentBehavior(src) {
  const b = parseControllerBehavior(src);
  if (src.includes('@args.resource') || src.includes('this.args.resource')) {
    b.args = ['resource', 'onChange', 'isLoading', 'isLoadingActivity'].filter((a) => src.includes(a));
  }
  if (src.includes('appCache.get')) {
    const m = src.match(/appCache\.get\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/);
    if (m) b.persistedUi = { key: m[1], default: m[2] };
  }
  if (src.includes('appCache.set')) b.hooks.push('Persists UI preference via `appCache.set`');
  return b;
}

export function formatBehaviorSection(ctx) {
  const {
    screenName,
    controller,
    route,
    template,
    hbs,
    serviceBehaviors = [],
    extra = '',
    isListScreen = false,
    resourceKey = null,
  } = ctx;
  let md = `\n\n---\n\n## 17. Runtime behavior (source-traced)\n\n`;
  md += `> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.\n\n`;

  if (route) {
    md += `### Route lifecycle\n\n`;
    if (route.permissions?.length) {
      md += `| Permission | Effect |\n|------------|--------|\n`;
      for (const p of route.permissions) md += `| \`${p.rule}\` | ${p.effect} |\n`;
    }
    if (route.model) {
      md += `\n**Model load:** \`store.queryRecord('${route.model}'${route.includes?.length ? `, { single: true, with: [${route.includes.join(', ')}] }` : ''})\`\n`;
    }
    if (route.permissions?.length) {
      md += `\n**beforeModel:** unauthorized users get warning toast + redirect (see route source)\n`;
    }
    for (const h of route.hooks || []) md += `- ${h}\n`;
    md += '\n';
  }

  if (controller) {
    md += `### Controller state & services\n\n`;
    md += `**Injected services:** ${controller.services?.map((s) => `\`${s.key}\``).join(', ') || '_none_'}\n\n`;
    if (controller.queryParams?.length) md += `**Query params:** ${controller.queryParams.map((q) => `\`${q}\``).join(', ')}\n\n`;
    if (controller.tasks?.length) md += `**Tasks:** ${controller.tasks.map((t) => `\`${t}\``).join(', ')} — use \`.perform()\`, UI bound via \`.isRunning\`\n\n`;
    if (controller.tabs?.length) {
      md += `**Tabs:**\n`;
      for (const t of controller.tabs) md += `- ${t}\n`;
      md += '\n';
    }
    if (controller.bulkActions?.length && ctx.isListScreen) {
      md += `### Bulk actions (table selection)\n\n`;
      md += `| Label | Handler |\n|-------|--------|\n`;
      for (const ba of controller.bulkActions) {
        md += `| ${ba.label} | \`${ba.handler || 'fn'}\` |\n`;
      }
      md += '\n';
    }
    if (controller.actionButtons?.length) {
      md += `### Action menu / header buttons\n\n`;
      md += `| Action | Handler | Disabled when |\n|--------|---------|---------------|\n`;
      controller.actionButtons.forEach((btn) => {
        md += `| ${btn.text} | \`${btn.handler || 'inline fn'}\` | \`${btn.disabled || '—'}\` |\n`;
      });
      md += '\n';
    }
    for (const h of controller.hooks || []) md += `- **Setup/teardown:** ${h}\n`;
    md += '\n';
  }

  const conds = parseConditionals(hbs || '');
  if (conds.length) {
    md += `### Template conditionals\n\n`;
    for (const c of conds) md += `- \`{{#if ${c}}}\` — branch UI visibility\n`;
    md += '\n';
  }

  const loading = parseLoadingStates(hbs || '', '');
  if (loading.length) {
    md += `### Loading / empty states\n\n`;
    for (const l of loading) md += `- ${l}\n`;
    md += '\n';
  }

  if (serviceBehaviors.length) {
    md += `### Service action flows\n\n`;
    for (const sb of serviceBehaviors) {
      md += `#### \`${sb.service}.${sb.name}()\`\n\n`;
      if (sb.modals.length) {
        for (const mod of sb.modals) {
          md += `**Modal (${mod.type}):** ${mod.title || mod.component}\n\n`;
          md += `- Flow: ${mod.flow}\n`;
        }
      }
      if (sb.apis.length) {
        md += `| API | Details |\n|-----|--------|\n`;
        for (const a of sb.apis) md += `| ${a.method} | \`${a.path}\`${a.bulk ? ' (bulk)' : ''} |\n`;
      }
      if (sb.notifications.length) {
        md += `\n**Toasts:**\n`;
        for (const n of sb.notifications) md += `- \`${n.type}\`: i18n \`${n.messageKey}\`\n`;
      }
      if (sb.navigation.length) {
        md += `\n**Navigation:**\n`;
        for (const n of sb.navigation) md += `- ${n}\n`;
      }
      if (sb.stateChanges.length) {
        md += `\n**Local state after success:**\n`;
        for (const s of sb.stateChanges) md += `- ${s}\n`;
      }
      if (sb.earlyReturns.length) {
        md += `\n**Early exit:**\n`;
        for (const e of sb.earlyReturns) md += `- ${e}\n`;
      }
      md += '\n';
    }
  }

  md += `### Notifications pattern (global)\n\n`;
  md += `- Success: \`notifications.success(intl.t(...))\`\n`;
  md += `- Warning: \`notifications.warning(...)\` — validation/precondition failed\n`;
  md += `- Error: \`notifications.serverError(error)\` — parses API error payload\n\n`;

  md += `### Realtime / sockets\n\n`;
  if (resourceKey === 'order') {
    md += `- Order detail: channel \`order.{public_id}\`; reloadable: \`order.created\`, \`order.completed\`, \`waypoint.activity\`, \`entity.activity\`, status change on \`order.updated\`\n`;
    md += `- Debounced \`hostRouter.refresh()\` + map routing control replace on reloadable events\n`;
    md += `- Leave route: \`orderSocketEvents.stop(model)\`\n`;
  } else {
    md += `- Realtime only where \`orderSocketEvents\` or SocketCluster is injected on this screen (see service flows above)\n`;
    md += `- Company channel \`company.{companyId}\` may patch models (e.g. \`order.driver_assigned\`) — see \`order-socket-events\` service doc\n`;
  }
  md += '\n';

  md += `### Permission branching\n\n`;
  md += `- Use \`abilities.can('fleet-ops <verb> <resource>')\` / \`cannot\` in routes and column definitions\n`;
  md += `- Table row actions inherit \`permission\` on column definitions\n\n`;

  md += `### Registry / extensions\n\n`;
  md += `- Dynamic tabs/components from \`menuService.getMenuItems(registryName)\`\n`;
  md += `- \`RegistryYield\` renders extension components with \`@permission\` prop\n\n`;

  md += `### Mobile / responsive\n\n`;
  md += `- Console \`hiddenSidebarRoutes\` forces header-only nav on home, notifications, virtual pages\n`;
  md += `- Order detail hides sidebar entirely; map layout uses full width\n`;
  md += `- Tables: fixed footer pagination; horizontal scroll on narrow viewports\n\n`;

  if (extra) md += extra;
  return md;
}

export function parseActionServiceFile(filePath) {
  const src = read(filePath);
  const name = filePath.split(/[/\\]/).pop().replace('.js', '');
  const childMethods = extractActionMethods(src);
  const byName = new Map();
  if (filePath.includes('-actions.js') || name === 'resource-action') {
    for (const m of getResourceActionBaseMethods()) {
      if (name !== 'resource-action') byName.set(m.name, { ...m, inherited: true });
    }
  }
  for (const m of childMethods) {
    byName.set(m.name, {
      ...m,
      ...analyzeMethodBody(m.body, m.name),
      kind: m.kind,
      inherited: false,
    });
  }
  const surface = parseServiceSurface(src);
  return {
    name,
    path: filePath,
    surface,
    methods: [...byName.values()],
  };
}

export function serviceDocMarkdown(svc) {
  let md = `# Service: ${svc.name}\n\n**Source:** \`${svc.path}\`\n\n`;
  if (svc.surface && (svc.surface.panel.length || svc.surface.modal.length || svc.surface.transition.length)) {
    md += `## API surface (objects)\n\n`;
    if (svc.surface.transition.length) md += `- **transition:** ${svc.surface.transition.join(', ')}\n`;
    if (svc.surface.panel.length) md += `- **panel:** ${svc.surface.panel.join(', ')}\n`;
    if (svc.surface.modal.length) md += `- **modal:** ${svc.surface.modal.join(', ')}\n`;
  }
  const customOnly = svc.methods.filter((m) => !m.inherited);
  if (customOnly.length) {
    md += `\n## Custom actions/tasks (${customOnly.length})\n\n`;
    for (const m of customOnly) {
      md += docMethodBlock(m);
    }
  }
  const inherited = svc.methods.filter((m) => m.inherited);
  if (inherited.length) {
    md += `\n## Inherited from resource-action (${inherited.length})\n\n`;
    md += `create, update, delete, bulkDelete, export, import, refresh, transitionTo, search — see [resource-action.md](./resource-action.md)\n\n`;
    for (const m of inherited.filter((x) => !['create', 'update', 'delete', 'bulkDelete', 'export', 'import', 'refresh', 'transitionTo', 'search'].includes(x.name))) {
      md += docMethodBlock(m);
    }
  }
  return md;
}

function docMethodBlock(m) {
  let md = `### ${m.kind === 'task' ? 'task' : 'action'} \`${m.name}\`${m.inherited ? ' _(inherited)_' : ''}\n\n`;
  if (m.modals.length) {
    md += `**Modal:**\n`;
    for (const mod of m.modals) md += `- **${mod.type}**: ${mod.title || mod.component} — ${mod.flow}\n`;
  }
  if (m.apis.length) {
    md += `| Method | Path |\n|--------|------|\n`;
    for (const a of m.apis) md += `| ${a.method} | \`${a.path}\` |\n`;
  }
  if (m.notifications.length) {
    for (const n of m.notifications) md += `- **${n.type}**: \`${n.messageKey}\`\n`;
  }
  if (m.navigation.length) {
    for (const n of m.navigation) md += `- ${n}\n`;
  }
  if (m.stateChanges.length) {
    for (const s of m.stateChanges) md += `- ${s}\n`;
  }
  if (m.earlyReturns.length) {
    for (const e of m.earlyReturns) md += `- ${e}\n`;
  }
  md += '\n';
  return md;
}
