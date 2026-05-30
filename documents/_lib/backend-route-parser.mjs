/**
 * Parses Fleetbase package routes.php files into flat endpoint records.
 */

const CONFIG_DEFAULTS = {
  'fleetbase.api.routing.prefix': '',
  'fleetbase.api.routing.internal_prefix': 'int',
  'fleetops.api.routing.prefix': '',
  'fleetops.api.routing.internal_prefix': 'int',
  'storefront.api.routing.prefix': 'storefront',
  'ledger.api.routing.prefix': 'ledger',
  'ledger.api.routing.internal_prefix': 'int',
  'ledger.api.routing.version_prefix': 'v1',
  'registry-bridge.api.routing.prefix': '~registry',
  'registry-bridge.api.routing.internal_prefix': 'v1',
};

const REST_ACTIONS = [
  { method: 'GET', suffix: '', action: 'queryRecord' },
  { method: 'GET', suffix: '/{id}', action: 'findRecord' },
  { method: 'POST', suffix: '', action: 'createRecord' },
  { method: 'PUT', suffix: '/{id}', action: 'updateRecord' },
  { method: 'DELETE', suffix: '/{id}', action: 'deleteRecord' },
];

export function joinPath(...segments) {
  const parts = segments
    .filter((s) => s != null && s !== '' && s !== '/')
    .map((s) => String(s).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  return parts.length ? '/' + parts.join('/') : '';
}

function resolveConfigValue(configKey, fallback) {
  if (CONFIG_DEFAULTS[configKey] !== undefined) return CONFIG_DEFAULTS[configKey];
  return fallback ?? '';
}

export function extractPrefixFromLine(line) {
  const config = line.match(
    /prefix\s*\(\s*config\(\s*['"]([^'"]+)['"]\s*,\s*['"]?([^'")\]]*)['"]?\s*\)/
  );
  if (config) {
    return resolveConfigValue(config[1], config[2]);
  }
  const literal = line.match(/(?:->|Route::)prefix\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  if (literal) return literal[1];
  return null;
}

function extractNamespaceFromLine(line) {
  const ns = line.match(/namespace\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  return ns ? ns[1] : null;
}

function extractMiddlewareFromLine(line) {
  const m = line.match(/middleware\s*\(\s*\[([^\]]*)\]/);
  if (!m) {
    if (line.includes("'fleetbase.protected'")) return ['fleetbase.protected'];
    if (line.includes("'fleetbase.api'")) return ['fleetbase.api'];
    if (line.includes("'storefront.api'")) return ['storefront.api'];
    if (line.includes("'fleetbase.registry'")) return ['fleetbase.registry'];
    return [];
  }
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

/**
 * Merge route group namespace segments without duplicating full namespaces.
 * @param {string} parent
 * @param {string} segment
 */
export function mergeNamespace(parent, segment) {
  if (!segment) return parent || '';
  const s = String(segment).replace(/\\\\/g, '\\').replace(/^\\+|\\+$/g, '');
  const p = String(parent || '')
    .replace(/\\\\/g, '\\')
    .replace(/^\\+|\\+$/g, '');
  if (!p) return s;
  if (s === p) return p;
  if (p.endsWith('\\' + s) || p.endsWith(s)) return p;
  if (s.startsWith(p + '\\')) return s;
  if (s.startsWith('Fleetbase\\') && s.length > p.length && !s.startsWith(p + '\\')) {
    return s;
  }
  return `${p}\\${s}`;
}

/** @param {string} ns */
export function dedupeNamespace(ns) {
  if (!ns) return '';
  const parts = ns.split('\\');
  for (let len = Math.floor(parts.length / 2); len >= 1; len--) {
    const first = parts.slice(0, len).join('\\');
    const next = parts.slice(len, len * 2).join('\\');
    if (first === next) {
      const rest = parts.slice(len * 2);
      return rest.length ? `${first}\\${rest.join('\\')}` : first;
    }
  }
  return ns;
}

function parseGroupAttrsFromBuffer(buf) {
  const attrs = { prefix: null, namespace: null, middleware: null };
  const configPm = buf.match(
    /['"]prefix['"]\s*=>\s*config\(\s*['"]([^'"]+)['"]\s*,\s*['"]?([^'"]*)['"]?\s*\)/
  );
  if (configPm) {
    attrs.prefix = resolveConfigValue(configPm[1], configPm[2]);
  } else {
    const pm = buf.match(/['"]prefix['"]\s*=>\s*['"]([^'"]+)['"]/);
    if (pm) attrs.prefix = pm[1];
  }
  const nm = buf.match(/['"]namespace['"]\s*=>\s*['"]([^'"]+)['"]/);
  if (nm) attrs.namespace = nm[1];
  if (buf.includes('middleware')) {
    attrs.middleware = extractMiddlewareFromLine(buf);
  }
  return attrs;
}

function parseGroupAttrs(line) {
  return parseGroupAttrsFromBuffer(line);
}

/** Read multi-line $router->group([ ... ], function ... */
function parseGroupAttrsBlock(lines, startLine) {
  let buf = '';
  for (let i = startLine; i < Math.min(lines.length, startLine + 40); i++) {
    buf += lines[i] + '\n';
    if (/function\s*\(/.test(lines[i])) break;
  }
  return parseGroupAttrsFromBuffer(buf);
}

function parseHandler(raw, resource = null) {
  const s = raw.trim().replace(/,\s*$/, '');
  const ctrlFn = s.match(/\$controller\(\s*['"](\w+)['"]\s*\)/);
  if (ctrlFn) {
    const method = ctrlFn[1];
    const controller = resource ? resourceToControllerName(resource) : null;
    return {
      controller,
      method,
      raw: s,
      usesControllerClosure: true,
      handlerString: controller ? `${controller}@${method}` : method,
    };
  }
  const arr = s.match(/\[\s*([\w\\]+)::class\s*,\s*['"](\w+)['"]\s*\]/);
  if (arr) {
    return {
      controller: arr[1].split('\\').pop(),
      method: arr[2],
      fqcn: arr[1],
      raw: s,
    };
  }
  const at = s.match(/['"]?([\w\\]+Controller)@(\w+)['"]?/);
  if (at) {
    return {
      controller: at[1].includes('\\') ? at[1].split('\\').pop() : at[1],
      method: at[2],
      fqcn: at[1].includes('\\') ? at[1] : null,
      raw: s,
    };
  }
  return { controller: null, method: null, raw: s };
}

function detectTier(line, current) {
  const l = line.toLowerCase();
  if (l.includes('consumable') && (l.includes('route') || l.includes('api'))) return 'consumable';
  if (l.includes('internal') && l.includes('route')) return 'internal';
  if (l.includes('webhook')) return 'webhook';
  if (l.includes('public') && (l.includes('no auth') || l.includes('callback') || l.includes('customer invoice'))) return 'public';
  if (l.includes('installer') || l.includes('onboard')) return 'setup';
  if (l.includes('auth') && l.includes('---')) return 'auth';
  return current;
}

function pushContext(stack, attrs, tier, pendingChain) {
  const parent = stack[stack.length - 1];
  let prefix = parent.prefix;
  let namespace = parent.namespace;
  let middleware = [...parent.middleware];

  if (pendingChain?.prefix != null) prefix = joinPath(prefix, pendingChain.prefix);
  if (pendingChain?.namespace) {
    namespace = mergeNamespace(namespace, pendingChain.namespace);
  }
  if (pendingChain?.middleware?.length) middleware.push(...pendingChain.middleware);

  if (attrs.prefix != null) prefix = joinPath(prefix, attrs.prefix);
  if (attrs.namespace) {
    namespace = mergeNamespace(namespace, attrs.namespace);
  }
  if (attrs.middleware != null) middleware.push(...attrs.middleware);

  stack.push({
    prefix,
    namespace,
    middleware: [...new Set(middleware)],
    tier: tier || parent.tier,
  });
}

function currentCtx(stack) {
  return stack[stack.length - 1];
}

function joinPrefixForRest(ctx, options) {
  const bp = (options.basePrefix || '').replace(/^\/+|\/+$/g, '');
  const cp = (ctx.prefix || '').replace(/^\/+|\/+$/g, '');
  if (!bp) return joinPath(cp);
  if (!cp || cp === bp || cp.startsWith(`${bp}/`)) return joinPath(cp);
  return joinPath(bp, cp);
}

/** Normalize route fields whether spread at top level or under meta. */
export function getRouteMeta(route) {
  return {
    resource: route?.resource ?? route?.meta?.resource ?? null,
    restAction: route?.restAction ?? route?.meta?.restAction ?? null,
    expanded: route?.expanded ?? route?.meta?.expanded ?? false,
    custom: route?.custom ?? route?.meta?.custom ?? false,
  };
}

function makeRoute({ methods, path, handler, ctx, tier, source, meta = {} }) {
  const h = parseHandler(handler, meta.resource);
  return {
    methods: Array.isArray(methods) ? methods : [methods],
    path,
    handler: h,
    handlerString:
      h.handlerString ||
      (h.fqcn
        ? `${h.fqcn}@${h.method}`
        : h.controller
          ? `${h.controller}@${h.method}`
          : h.method || handler),
    middleware: ctx.middleware,
    namespace: ctx.namespace,
    tier: tier || ctx.tier,
    source,
    meta,
    ...meta,
  };
}

export function expandAuthRoutes(ctx, options) {
  const base = joinPath(options.basePrefix || '', ctx.prefix, 'auth');
  const publicRoutes = [
    ['POST', 'login', 'login'],
    ['POST', 'sign-up', 'signUp'],
    ['POST', 'logout', 'logout'],
    ['POST', 'get-magic-reset-link', 'createPasswordReset'],
    ['POST', 'reset-password', 'resetPassword'],
    ['POST', 'create-verification-session', 'createVerificationSession'],
    ['POST', 'validate-verification-session', 'validateVerificationSession'],
    ['POST', 'send-verification-email', 'sendVerificationEmail'],
    ['POST', 'verify-email', 'verifyEmail'],
    ['GET', 'validate-verification', 'validateVerificationCode'],
  ];
  const protectedRoutes = [
    ['POST', 'switch-organization', 'switchOrganization'],
    ['POST', 'join-organization', 'joinOrganization'],
    ['POST', 'create-organization', 'createOrganization'],
    ['GET', 'session', 'session'],
    ['GET', 'organizations', 'getUserOrganizations'],
    ['GET', 'services', 'services'],
  ];
  const routes = [];
  for (const [method, path, action] of publicRoutes) {
    routes.push(
      makeRoute({
        methods: method,
        path: joinPath(base, path),
        handler: `AuthController@${action}`,
        ctx: { ...ctx, middleware: [...ctx.middleware, 'throttle'] },
        tier: 'auth',
        source: 'fleetbaseAuthRoutes (public)',
        meta: { expanded: true },
      })
    );
  }
  for (const [method, path, action] of protectedRoutes) {
    routes.push(
      makeRoute({
        methods: method,
        path: joinPath(base, path),
        handler: `AuthController@${action}`,
        ctx: { ...ctx, middleware: [...ctx.middleware, 'fleetbase.protected'] },
        tier: 'auth',
        source: 'fleetbaseAuthRoutes (protected)',
        meta: { expanded: true },
      })
    );
  }
  return routes;
}

function parseCustomRoutesInClosure(body) {
  const customs = [];
  const re =
    /\$router->(get|post|put|patch|delete|match|any)\s*\(\s*(?:\[(.*?)\]\s*,\s*)?['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g;
  let m;
  while ((m = re.exec(body))) {
    let methods;
    if (m[1] === 'match' || m[1] === 'any') {
      methods =
        m[1] === 'any'
          ? ['ANY']
          : [...(m[2] || '').matchAll(/['"](\w+)['"]/g)].map((x) => x[1].toUpperCase());
    } else {
      methods = [m[1].toUpperCase()];
    }
    customs.push({
      methods,
      path: m[3],
      handler: m[4].trim(),
    });
  }
  return customs;
}

export function expandFleetbaseRestRoutes(resource, ctx, closureBody, options) {
  const base = joinPath(joinPrefixForRest(ctx, options), resource);
  const routes = [];
  for (const { method, suffix, action } of REST_ACTIONS) {
    routes.push(
      makeRoute({
        methods: method,
        path: joinPath(base, suffix).replace(/\/$/, '') || base,
        handler: `${resourceToControllerName(resource)}@${action}`,
        ctx,
        tier: ctx.tier,
        source: `fleetbaseRoutes('${resource}')`,
        meta: { expanded: true, resource, restAction: action },
      })
    );
  }
  if (closureBody) {
    for (const c of parseCustomRoutesInClosure(closureBody)) {
      routes.push(
        makeRoute({
          methods: c.methods,
          path: joinPath(base, c.path),
          handler: c.handler,
          ctx,
          tier: ctx.tier,
          source: `fleetbaseRoutes('${resource}') custom`,
          meta: { resource, custom: true },
        })
      );
    }
  }
  return routes;
}

function resourceToControllerName(resource) {
  const parts = resource.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  let name = parts.join('');
  if (name.endsWith('ies')) name = name.slice(0, -3) + 'y';
  else if (name.endsWith('s') && !name.endsWith('ss')) name = name.slice(0, -1);
  return name + 'Controller';
}

function extractClosureBody(lines, startLine) {
  let depth = 0;
  let started = false;
  let body = '';
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('function') && line.includes('$router')) started = true;
    if (!started) continue;
    body += line + '\n';
    for (const ch of line) {
      if (ch === '{') depth++;
      if (ch === '}') depth--;
    }
    if (started && depth <= 0 && line.includes('}')) break;
  }
  return body;
}

function parseTopLevelRoute(line, routes, options) {
  const routeM = line.match(
    /Route::(get|post|put|patch|delete|any)\s*\(\s*(.+?)\s*,\s*['"]([^'"]+)['"]\s*\)/
  );
  if (!routeM) return;

  const method = routeM[1].toUpperCase();
  const pathExpr = routeM[2];
  const handler = routeM[3];

  let routePath = '';
  const configConcat = pathExpr.match(
    /config\(\s*['"]([^'"]+)['"]\s*,\s*['"]?([^'"]*)['"]?\s*\)\s*\.\s*['"]([^'"]+)['"]/
  );
  if (configConcat) {
    const prefix = resolveConfigValue(configConcat[1], configConcat[2]);
    routePath = joinPath(prefix, configConcat[3]);
  } else {
    const lit = pathExpr.match(/['"]([^'"]+)['"]/);
    routePath = lit ? joinPath(options.basePrefix, lit[1]) : joinPath(options.basePrefix);
  }

  const h = parseHandler(handler);
  routes.push({
    methods: [method],
    path: routePath,
    handler: h,
    handlerString: handler.includes('@') ? handler : `${h.fqcn}@${h.method}`,
    middleware: [],
    namespace: '',
    tier: 'public',
    source: 'Route:: top-level',
    meta: { topLevel: true },
  });
}

function extractRoutesFromLine(line, ctx, tier, lineNo) {
  const routes = [];
  const handlers = [];

  const patterns = [
    /\$router->(get|post|put|patch|delete)\s*\(\s*['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g,
    /\$router->match\s*\(\s*\[([^\]]+)\]\s*,\s*['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g,
    /\$router->any\s*\(\s*['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g,
  ];

  let m;
  const re1 = /\$router->(get|post|put|patch|delete)\s*\(\s*['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g;
  while ((m = re1.exec(line))) {
    const path = m[2] === '/' ? '' : m[2];
    routes.push(
      makeRoute({
        methods: m[1].toUpperCase(),
        path: joinPath(ctx.prefix, path),
        handler: m[3],
        ctx,
        tier,
        source: `routes.php:${lineNo + 1}`,
      })
    );
  }

  const re2 = /\$router->match\s*\(\s*\[([^\]]+)\]\s*,\s*['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g;
  while ((m = re2.exec(line))) {
    const methods = [...m[1].matchAll(/['"](\w+)['"]/g)].map((x) => x[1].toUpperCase());
    routes.push(
      makeRoute({
        methods,
        path: joinPath(ctx.prefix, m[2]),
        handler: m[3],
        ctx,
        tier,
        source: `routes.php:${lineNo + 1}`,
      })
    );
  }

  const re3 = /\$router->any\s*\(\s*['"]([^'"]*)['"]\s*,\s*([^;]+)\)/g;
  while ((m = re3.exec(line))) {
    routes.push(
      makeRoute({
        methods: ['ANY'],
        path: joinPath(ctx.prefix, m[1]),
        handler: m[2],
        ctx,
        tier,
        source: `routes.php:${lineNo + 1}`,
      })
    );
  }

  return routes;
}

export function dedupeRoutes(routes) {
  const seen = new Set();
  const out = [];
  for (const r of routes) {
    const key = `${r.methods.join('|')}|${r.path}|${r.handlerString}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

/**
 * @param {string} content routes.php source
 * @param {object} options
 * @param {string} [options.basePrefix] package URL prefix (storefront, ledger, ~registry)
 * @param {string} [options.rootNamespace] PHP root controller namespace
 */
export function parseRoutesFile(content, options = {}) {
  const routes = [];
  const lines = content.split('\n');
  let tier = 'unknown';

  const stack = [
    {
      prefix: joinPath(options.basePrefix || ''),
      namespace: options.rootNamespace || '',
      middleware: [],
      tier: 'unknown',
    },
  ];
  /** @type {number[]} brace depth at which each stack frame becomes invalid */
  const stackBraceDepth = [0];

  let pendingChain = null;
  let pendingGroupLine = null;
  let groupBlockStartLine = null;
  let braceDepth = 0;

  let openedGroupThisLine = false;

  const openGroup = (line, lineIndex = 0) => {
    const attrs =
      groupBlockStartLine != null
        ? parseGroupAttrsBlock(lines, groupBlockStartLine)
        : parseGroupAttrs(pendingGroupLine || line);
    pushContext(stack, attrs, tier, pendingChain);
    pendingChain = null;
    pendingGroupLine = null;
    groupBlockStartLine = null;
    openedGroupThisLine = true;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    tier = detectTier(line, tier);

    parseTopLevelRoute(line, routes, options);

    const rootPrefix = extractPrefixFromLine(line);
    if (rootPrefix != null && line.includes('Route::prefix')) {
      const bp = (options.basePrefix || '').replace(/^\/+|\/+$/g, '');
      const rp = rootPrefix.replace(/^\/+|\/+$/g, '');
      stack[0].prefix =
        bp && (rp === bp || rp.startsWith(`${bp}/`))
          ? joinPath(rp)
          : joinPath(bp, rp);
    }

    if (line.includes('->prefix(') || line.match(/\$router->prefix\(/)) {
      const p = extractPrefixFromLine(line);
      if (p != null) {
        pendingChain = pendingChain || {};
        pendingChain.prefix = p;
      }
    }
    if (line.includes('->namespace(')) {
      const n = extractNamespaceFromLine(line);
      if (n) {
        pendingChain = pendingChain || {};
        pendingChain.namespace = n;
      }
    }
    if (line.includes('->middleware(')) {
      const mw = extractMiddlewareFromLine(line);
      pendingChain = pendingChain || {};
      pendingChain.middleware = mw;
    }

    const isGroupLine =
      line.includes('->group(') ||
      line.includes('$router->group(') ||
      line.includes('Route::group(');

    if (isGroupLine) {
      pendingGroupLine = pendingGroupLine || line;
      if (groupBlockStartLine == null) groupBlockStartLine = i;
      if (/function\s*\(/.test(line)) {
        openGroup(line, i);
      }
    }

    if (trimmed.match(/^function\s*\(/) && (pendingGroupLine || groupBlockStartLine != null)) {
      openGroup(pendingGroupLine || line, i);
    }

    const ctx = currentCtx(stack);

    if (line.includes('fleetbaseAuthRoutes')) {
      routes.push(...expandAuthRoutes(ctx, options));
    }

    let fleetbaseResource = null;
    const fbSameLine = line.match(/fleetbaseRoutes\s*\(\s*['"]([^'"]+)['"]/);
    if (fbSameLine) {
      fleetbaseResource = fbSameLine[1];
    } else if (/fleetbaseRoutes\s*\(/.test(line)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
        const nm = lines[j].match(/^\s*['"]([^'"]+)['"]/);
        if (nm) {
          fleetbaseResource = nm[1];
          break;
        }
        if (/function\s*\(/.test(lines[j])) break;
      }
    }
    if (fleetbaseResource) {
      const body = extractClosureBody(lines, i);
      routes.push(
        ...expandFleetbaseRestRoutes(fleetbaseResource, ctx, body, options)
      );
    }

    if (
      !line.includes('fleetbaseRoutes') &&
      !/\$controller\s*\(\s*['"]/.test(line)
    ) {
      routes.push(...extractRoutesFromLine(line, ctx, tier, i));
    }

    braceDepth += opens - closes;

    if (openedGroupThisLine) {
      stackBraceDepth.push(braceDepth);
      openedGroupThisLine = false;
    }

    while (stack.length > 1 && braceDepth < stackBraceDepth[stackBraceDepth.length - 1]) {
      stack.pop();
      stackBraceDepth.pop();
    }
  }

  return dedupeRoutes(routes);
}

export const ROUTE_TIER_ORDER = [
  'auth',
  'setup',
  'public',
  'webhook',
  'consumable',
  'internal',
  'unknown',
];
