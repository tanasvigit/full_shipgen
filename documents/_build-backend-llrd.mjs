#!/usr/bin/env node
/**
 * Generates documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md from PHP packages.
 * Run: node documents/_build-backend-llrd.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFormRequest,
  parseController as parseControllerFull,
  routeActionToMethod,
  resourceToControllerName,
  modelBaseFromResource,
  inferRequestClassNames,
  resolveResourceForEndpoint,
  STANDARD_QUERY_PARAMS,
  STANDARD_REST_ACTIONS,
} from './_lib/backend-schema-parser.mjs';
import {
  parseRoutesFile,
  ROUTE_TIER_ORDER,
  joinPath,
  dedupeNamespace,
  getRouteMeta,
} from './_lib/backend-route-parser.mjs';
import {
  buildSchemaRegistry,
  buildModelRelationshipIndex,
  buildMermaidErDiagram,
  dedupeLogicalAgainstForeignKeys,
  formatRelationshipFk,
  DOMAIN_KEY_TABLES,
} from './_lib/backend-db-parser.mjs';
import { collectPackageEventData } from './_lib/backend-events-parser.mjs';
import {
  buildPermissionCatalogFromFiles,
  ACTION_MAPPER_CRUD,
  ACTION_MAPPER_HTTP,
  expandResourcePermissions,
} from './_lib/backend-permissions-parser.mjs';
import {
  buildFilterCatalog,
  buildSupportServicesCatalog,
} from './_lib/backend-services-filter-parser.mjs';
import {
  FLOW_JSON_SCHEMA,
  FLOW_EVENT_RESOLUTION,
  ORDER_TRANSITIONS,
  STANDARD_FLOW_CODES,
  parseOrderConfigFlowHelpers,
  tryLoadSampleFlowCodes,
} from './_lib/backend-flow-parser.mjs';
import {
  buildSampleRequestBody,
  formatJsonBlock,
  shouldEmitSampleExpanded,
} from './_lib/backend-sample-json.mjs';
import { buildTraceabilityMatrix } from './_lib/backend-traceability-parser.mjs';
import { buildResourceRegistry, flattenResourceSchema } from './_lib/backend-resource-parser.mjs';
import { buildConditionalRulesTable } from './_lib/backend-validation-parser.mjs';
import {
  buildEndpointContract,
  scoreContractCompleteness,
  formatErrorExamples,
} from './_lib/backend-contract-builder.mjs';
import { buildOpenApiDocument } from './_lib/backend-openapi-meta.mjs';
import { buildJobCatalog } from './_lib/backend-job-parser.mjs';
import {
  buildEventRuntimeData,
  formatEventFlowMermaid,
} from './_lib/backend-event-runtime-parser.mjs';
import { buildWebhookCatalog } from './_lib/backend-webhook-parser.mjs';
import { buildRealtimeCatalog } from './_lib/backend-realtime-parser.mjs';
import { buildAuthDirectiveCatalog } from './_lib/backend-auth-directive-parser.mjs';
import { buildRbacMatrix } from './_lib/backend-rbac-matrix.mjs';
import { buildWorkflowRuntime } from './_lib/backend-workflow-runtime-parser.mjs';
import {
  buildRuntimeCoverage,
  exportRuntimeMeta,
} from './_lib/backend-runtime-meta.mjs';
import {
  buildArchitectureIntelligence,
  exportGraphFiles,
} from './_lib/backend-architecture-intelligence.mjs';
import { buildInfraTopology } from './_lib/backend-topology-parser.mjs';
import {
  buildEngineeringOS,
  exportEngineeringArtifacts,
} from './_lib/backend-engineering-os.mjs';
import { buildPlatformIntelligence } from './_lib/backend-platform-intelligence.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'BACKEND-LOW-LEVEL-REQUIREMENTS.md');

const PACKAGES = [
  {
    id: 'core-api',
    label: 'Core API (platform)',
    routesFile: 'packages/core-api/src/routes.php',
    srcRoot: 'packages/core-api/src',
    migrations: 'packages/core-api/migrations',
    prefix: { public: '', internal: 'int' },
    routePrefix: '',
    namespace: 'Fleetbase',
  },
  {
    id: 'fleetops',
    label: 'FleetOps',
    routesFile: 'packages/fleetops/server/src/routes.php',
    srcRoot: 'packages/fleetops/server/src',
    migrations: 'packages/fleetops/server/migrations',
    prefix: { public: '', internal: 'int', config: 'fleetops.api.routing.prefix' },
    routePrefix: '',
    namespace: 'Fleetbase\\FleetOps',
  },
  {
    id: 'storefront',
    label: 'Storefront',
    routesFile: 'packages/storefront/server/src/routes.php',
    srcRoot: 'packages/storefront/server/src',
    migrations: 'packages/storefront/server/migrations',
    prefix: { public: 'storefront', internal: 'storefront/int' },
    routePrefix: 'storefront',
    namespace: 'Fleetbase\\Storefront',
  },
  {
    id: 'ledger',
    label: 'Ledger',
    routesFile: 'packages/ledger/server/src/routes.php',
    srcRoot: 'packages/ledger/server/src',
    migrations: 'packages/ledger/server/migrations',
    prefix: { public: 'ledger', internal: 'ledger/int' },
    routePrefix: 'ledger',
    namespace: 'Fleetbase\\Ledger',
  },
  {
    id: 'pallet',
    label: 'Pallet (WMS)',
    routesFile: 'packages/pallet/server/src/routes.php',
    srcRoot: 'packages/pallet/server/src',
    migrations: 'packages/pallet/server/migrations',
    prefix: { public: 'pallet', internal: 'pallet/int' },
    routePrefix: 'pallet',
    namespace: 'Fleetbase\\Pallet',
  },
  {
    id: 'registry-bridge',
    label: 'Registry Bridge',
    routesFile: 'packages/registry-bridge/server/src/routes.php',
    srcRoot: 'packages/registry-bridge/server/src',
    migrations: 'packages/registry-bridge/server/migrations',
    prefix: { public: '~registry', internal: '~registry' },
    routePrefix: '',
    namespace: 'Fleetbase\\RegistryBridge',
  },
];

function readSafe(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8');
}

function walkDir(dir, ext = '.php') {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(ext)) out.push(full);
    }
  }
  walk(abs);
  return out.map((f) => path.relative(ROOT, f).replace(/\\/g, '/'));
}

function extractFleetbaseRoutes(content) {
  const resources = [];
  const re = /fleetbaseRoutes\s*\(\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) resources.push(m[1]);
  return [...new Set(resources)];
}

function extractCustomRoutes(content) {
  const routes = [];
  const re =
    /\$router->(get|post|put|patch|delete|match)\s*\(\s*(?:\[[^\]]+\]|['"]([^'"]+)['"])\s*,\s*['"]?([^'")\]]+)['"]?/g;
  let m;
  while ((m = re.exec(content))) {
    const method = m[1].toUpperCase();
    const path = m[2] || '(match)';
    const action = (m[3] || '').replace(/\$controller\(['"]/, '').replace(/['"]\)/, '');
    routes.push({ method, path, action });
  }
  return routes;
}

/** Extract fleetbaseRoutes blocks with optional custom route lines inside closure */
function extractFleetbaseRouteBlocks(content) {
  const blocks = [];
  const re = /fleetbaseRoutes\s*\(\s*['"]([^'"]+)['"]\s*(?:,\s*function\s*\([^)]*\)\s*\{([\s\S]*?)\}\s*\))?/g;
  let m;
  while ((m = re.exec(content))) {
    const resource = m[1];
    const body = m[2] || '';
    const customs = [];
    const lineRe =
      /\$router->(get|post|put|patch|delete|match)\s*\(\s*(?:\[[^\]]+\]|['"]([^'"]+)['"])\s*,\s*(?:\$controller\(['"](\w+)['"]\)|['"]?([^'")\s]+))/g;
    let lm;
    while ((lm = lineRe.exec(body))) {
      customs.push({
        method: lm[1].toUpperCase(),
        path: lm[2] || '(match)',
        action: lm[3] || lm[4] || null,
      });
    }
    blocks.push({ resource, customs });
  }
  return blocks;
}

function extractMiddlewareGroups(content) {
  const groups = [];
  const re = /['"]middleware['"]\s*=>\s*\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(content))) {
    const items = m[1].match(/['"][^'"]+['"]/g) || [];
    groups.push(items.map((s) => s.replace(/['"]/g, '')));
  }
  return groups;
}

function parseMigrationTables(migrationDir) {
  const files = walkDir(migrationDir);
  const tables = [];
  for (const f of files) {
    const c = readSafe(f);
    if (!c) continue;
    const create = c.match(/Schema::create\s*\(\s*['"]([^'"]+)['"]/);
    if (create) {
      const columns = [];
      const colRe = /\$table->(\w+)\s*\(\s*['"]([^'"]+)['"]/g;
      let cm;
      while ((cm = colRe.exec(c))) columns.push(`${cm[2]} (${cm[1]})`);
      const colRe2 = /\$table->(\w+)\s*\(\s*['"]([^'"]+)['"]\s*,/g;
      tables.push({ table: create[1], file: f, columns });
    }
    const alter = c.match(/Schema::table\s*\(\s*['"]([^'"]+)['"]/);
    if (alter && !create) tables.push({ table: alter[1], file: f, alter: true, columns: [] });
  }
  return tables.sort((a, b) => a.table.localeCompare(b.table));
}

function parseControllers(srcRoot) {
  const ctrlDir = path.join(srcRoot, 'Http/Controllers');
  const files = walkDir(ctrlDir);
  const controllers = [];
  for (const f of files) {
    const c = readSafe(f);
    if (!c) continue;
    const full = parseControllerFull(c);
    const methods = full.methods.map((m) => m.name);
    controllers.push({
      file: f,
      class: full.shortName,
      methods: [...new Set(methods)],
      full,
    });
  }
  return controllers.sort((a, b) => a.class.localeCompare(b.class));
}

function parseAllFormRequests(srcRoot) {
  const dir = path.join(srcRoot, 'Http/Requests');
  const files = walkDir(dir);
  const map = new Map();
  const list = [];
  for (const f of files) {
    const c = readSafe(f);
    if (!c || f.endsWith('FleetbaseRequest.php')) continue;
    const parsed = parseFormRequest(c, f);
    list.push(parsed);
    map.set(parsed.shortName, parsed);
    map.set(parsed.className, parsed);
  }
  return { list, map };
}

function parseAllResources(srcRoot, globalRegistry) {
  const { registry } = buildResourceRegistry(srcRoot, ROOT);
  const map = new Map();
  for (const [key, parsed] of registry) {
    map.set(key, parsed);
    if (parsed.className) globalRegistry.set(parsed.className, parsed);
    globalRegistry.set(key, parsed);
  }
  return map;
}

function resolveRequestClass(requestMap, names) {
  for (const n of names) {
    if (!n) continue;
    const short = n.split('\\').pop();
    if (requestMap.has(short)) return requestMap.get(short);
    if (requestMap.has(n)) return requestMap.get(n);
  }
  return null;
}

function resolveRestFormRequest(route, actionName, requestMap, ctrl, pkg) {
  const { resource, restAction } = getRouteMeta(route);
  if (!resource) return null;
  const modelBase = modelBaseFromResource(resource);
  const inferred = inferRequestClassNames(modelBase, pkg.namespace);
  const isCreate = restAction === 'createRecord' || actionName === 'createRecord';
  const isUpdate = restAction === 'updateRecord' || actionName === 'updateRecord';
  if (!isCreate && !isUpdate) return null;
  return resolveRequestClass(
    requestMap,
    isCreate
      ? [
          ctrl?.full?.createRequest,
          inferred.create,
          inferred.createAlt,
          `Create${modelBase}Request`,
        ]
      : [
          ctrl?.full?.updateRequest,
          inferred.update,
          inferred.updateAlt,
          `Update${modelBase}Request`,
        ]
  );
}

function formatRulesTable(rules, messages = []) {
  if (!rules?.length) return [];
  const msgMap = Object.fromEntries(messages.map((m) => [m.key, m.text]));
  return rules.map((r) => [r.field, r.rules, msgMap[r.field] || '']);
}

const METHOD_ALIASES = {
  create: 'createRecord',
  update: 'updateRecord',
  query: 'queryRecord',
  find: 'findRecord',
  delete: 'deleteRecord',
};

function resolveControllerMethod(ctrl, methodName) {
  const methods = ctrl?.full?.methods;
  if (!methods) return null;
  const direct = methods.find((m) => m.name === methodName);
  if (direct) return direct;
  const alias = METHOD_ALIASES[methodName];
  if (alias) return methods.find((m) => m.name === alias);
  return null;
}

function findControllerForRoute(route, controllers) {
  const name = route.handler?.controller;
  if (!name) return null;
  return (
    controllers.find((c) => c.class === name) ||
    controllers.find((c) => c.class.toLowerCase() === name.toLowerCase())
  );
}

function buildEndpointRequest(route, method, requestMap, ctrl) {
  if (method?.requestType) {
    const resolved = resolveRequestClass(requestMap, [method.requestType]);
    if (resolved) return resolved;
    return { className: method.requestType, rules: [] };
  }
  if (ctrl?.full?.requestImports?.length && route.handler?.method) {
    const match = ctrl.full.requestImports.find((imp) => {
      const short = imp.split('\\').pop().replace(/Request$/, '');
      return route.handler.method.toLowerCase().includes(short.toLowerCase());
    });
    if (match) {
      const resolved = resolveRequestClass(requestMap, [match]);
      if (resolved) return resolved;
    }
  }
  const action = route.handler?.method;
  if (action === 'login') {
    return resolveRequestClass(requestMap, ['LoginRequest', 'Fleetbase\\Http\\Requests\\LoginRequest']);
  }
  if (action === 'signUp') {
    return resolveRequestClass(requestMap, ['SignUpRequest']);
  }
  if (method?.params?.length) {
    return { signature: method.params.map((p) => p.raw).join(', ') };
  }
  return null;
}

function emitEndpointSpec(lines, mdTable, opts) {
  const {
    title,
    method,
    path,
    controller,
    action,
    contract,
    notes,
    queryParams,
    sampleRequest,
    sampleResponse,
    showFullSchema = false,
  } = opts;

  const request = contract?.request;
  const response = contract?.response;

  lines.push(`#### ${title}\n\n`);
  lines.push(`| | |\n|---|---|\n`);
  lines.push(`| **HTTP** | \`${method}\` |\n`);
  lines.push(`| **Path** | \`${path}\` |\n`);
  lines.push(`| **Handler** | \`${controller}@${action}\` |\n`);
  if (contract?.confidence != null) {
    lines.push(`| **Contract confidence** | ${contract.confidence}% |\n`);
  }
  if (notes) lines.push(`| **Notes** | ${notes} |\n`);
  lines.push('\n');

  if (contract?.auth) {
    lines.push('**Authentication**\n\n');
    lines.push(`- **Type:** ${contract.auth.type}\n`);
    lines.push(`- **Detail:** ${contract.auth.value}\n\n`);
  }

  if (queryParams?.length) {
    lines.push('**Query parameters**\n\n');
    lines.push(
      mdTable(
        ['Parameter', 'Description'],
        queryParams.map((q) => [q.name, q.desc])
      )
    );
    lines.push('\n');
  }

  if (request) {
    lines.push('**Request schema**\n\n');
    if (request.payloadKey) {
      lines.push(`- JSON root key: \`${request.payloadKey}\`\n`);
    }
    if (request.authorize) {
      lines.push(`- **Authorize:** ${request.authorize}\n`);
    }
    if (request.className) {
      lines.push(`- **Form request:** \`${request.className}\`\n`);
    }
    if (request.rules?.length) {
      lines.push('\n**Static rules**\n\n');
      lines.push(
        mdTable(
          ['Field', 'Rules', 'Message'],
          formatRulesTable(request.rules, request.messages)
        )
      );
    }
    if (request.conditionalBranches?.length) {
      lines.push('\n**Conditional validation branches**\n\n');
      for (const branch of request.conditionalBranches) {
        lines.push(`When \`${branch.condition}\`:\n\n`);
        lines.push(
          mdTable(
            ['Field', 'Rules', 'Message'],
            formatRulesTable(branch.rules, request.messages)
          )
        );
        lines.push('\n');
      }
    }
    const condRows = contract?.conditionalTable || [];
    if (condRows.length) {
      lines.push('**Conditional rules (from rule strings)**\n\n');
      lines.push(
        mdTable(['Condition', 'Field', 'Rules'], condRows.slice(0, 40))
      );
      lines.push('\n');
    }
    if (!request.rules?.length && !request.conditionalBranches?.length && !condRows.length) {
      if (request.signature) {
        lines.push(`- Signature: \`${request.signature}\`\n`);
      } else {
        lines.push('- _No dedicated Form Request — uses `Request` or inline validation._\n');
      }
    }
    lines.push('\n');
  }

  if (response) {
    lines.push('**Response schema**\n\n');
    if (response.resourceClass) {
      lines.push(`- **Resource class:** \`${response.resourceClass}\`\n`);
    }
    if (response.resourceVariant) {
      lines.push(`- **Variant:** \`${response.resourceVariant}\`\n`);
    }
    if (response.wrap) lines.push(`- **Wrap:** \`${response.wrap}\`\n`);
    if (response.paginated) {
      lines.push('- **Pagination:** `data[]`, `meta` (total, page, limit), `links`\n');
    }
    const table = response.responseTable || [];
    const limit = showFullSchema ? 120 : 60;
    if (table.length) {
      lines.push('\n');
      lines.push(mdTable(['Field', 'Type', 'Nullable', 'Description'], table.slice(0, limit)));
      if (table.length > limit) {
        lines.push(`\n*… ${table.length - limit} more fields (see API resource catalog).*\n`);
      }
    } else {
      lines.push('- _Resource not resolved — see standard error envelope below._\n');
    }
    lines.push('\n');
  }

  if (sampleRequest) {
    lines.push('**Example request JSON**\n\n');
    lines.push(formatJsonBlock(sampleRequest));
    lines.push('\n');
  }
  if (sampleResponse) {
    lines.push('**Example response JSON**\n\n');
    lines.push(formatJsonBlock(sampleResponse));
    lines.push('\n');
  }

  if (showFullSchema || contract?.priority) {
    lines.push('**Example error responses**\n\n');
    for (const err of formatErrorExamples()) {
      lines.push(`_${err.name} (${err.status})_\n\n`);
      lines.push(formatJsonBlock(err.body));
      lines.push('\n');
    }
  }

  if (contract?.unresolved?.length) {
    lines.push(`_Parser notes: ${contract.unresolved.join('; ')}_\n\n`);
  }
}

function emitResourceCatalog(lines, mdTable, pkgLabel, resourceMap, globalRegistry) {
  const seen = new Set();
  const resources = [];
  for (const r of resourceMap.values()) {
    if (!r.className || seen.has(r.className)) continue;
    seen.add(r.className);
    resources.push(r);
  }
  resources.sort((a, b) => a.className.localeCompare(b.className));
  if (!resources.length) return 0;

  lines.push(section(`Part X — ${pkgLabel} API resources (toArray fields)`, 2));
  lines.push(
    `**${resources.length}** JsonResource classes. Nested fields are expanded where \`new Resource(...)\` references resolve in the registry.\n\n`
  );

  for (const res of resources) {
    const flat = flattenResourceSchema(res, globalRegistry);
    lines.push(`##### \`${res.className}\`\n\n`);
    if (flat.length) {
      lines.push(
        mdTable(
          ['Field', 'Type', 'Nullable', 'Description'],
          flat.slice(0, 100).map((f) => [
            f.path,
            f.format ? `${f.type} (${f.format})` : f.type,
            f.nullable ? 'yes' : 'no',
            [f.visibility, f.description].filter(Boolean).join(' — ') || '—',
          ])
        )
      );
      if (flat.length > 100) {
        lines.push(`\n*… ${flat.length - 100} more flattened fields.*\n`);
      }
    } else {
      lines.push('_No fields parsed._\n');
    }
    lines.push('\n');
  }
  return resources.length;
}

function generatePartXEndpointSchemas(pkgData, lines, mdTable, section) {
  let endpointCount = 0;
  let requestClassCount = 0;
  let endpointsWithResponseFields = 0;
  let endpointsWithSamples = 0;
  let resourceCatalogCount = 0;
  const globalRegistry = new Map();
  const allContracts = [];
  const parserWarnings = [];

  lines.push(section('Part X — API endpoint schemas (request / response)', 1));
  lines.push(`Per-endpoint **API contracts**: request validation (static + conditional branches + \`required_if\` / \`sometimes\` rule strings), **recursive response schemas** from JsonResource \`toArray()\`, example JSON, auth, pagination, and error envelopes.

**Contract confidence** (0–100%) scores how much was resolved from PHP (FormRequest + Resource class + field count).

**Priority endpoints** (orders, drivers, vehicles, auth, checkout, invoices) include full response tables (up to 120 fields) and error examples.

Intermediate metadata for future OpenAPI/SDK export: \`documents/_meta/backend-api-contracts.json\` (not OpenAPI YAML).

> Static analysis — dynamic closures and morph resources may be incomplete. Regenerate: \`node documents/_build-backend-llrd.mjs\`.

### Standard error envelopes

| Context | HTTP | Body shape |
|---------|------|------------|
| Validation (internal) | 422 | \`{ "errors": ["…"] }\` or array of messages |
| Validation (public API) | 422 | \`{ "error": "…", "errors"?: [...] }\` |
| Not found | 404 | \`{ "status": "failed", "message": "…" }\` |
| Success delete (public) | 200 | \`{ "status": "success", "message": "…", "data": Resource }\` |

### Standard REST query contract (all \`queryRecord\`)

${mdTable(
  ['Parameter', 'Description'],
  STANDARD_QUERY_PARAMS.map((q) => [q.name, q.desc])
)}

---

`);

  for (const pkg of pkgData) {
    const { list: requests, map: requestMap } = parseAllFormRequests(pkg.srcRoot);
    const resourceMap = parseAllResources(pkg.srcRoot, globalRegistry);
    requestClassCount += requests.length;
    resourceCatalogCount += emitResourceCatalog(
      lines,
      mdTable,
      pkg.label,
      resourceMap,
      globalRegistry
    );

    const controllerByClass = new Map(
      pkg.controllers.map((c) => [c.class, c.full])
    );

    lines.push(section(`Part X — ${pkg.label} form requests`, 2));
    lines.push(`**${requests.length}** request classes.\n\n`);

    for (const req of requests.sort((a, b) =>
      a.className.localeCompare(b.className)
    )) {
      lines.push(`##### \`${req.className}\`\n\n`);
      lines.push(`- **Class:** \`${req.className}\`\n`);
      lines.push(`- **File:** \`${req.relPath}\`\n`);
      if (req.authorize) lines.push(`- **Authorize:** ${req.authorize}\n`);
      if (req.hasConditional) {
        const n = req.conditionalBranches?.length || 0;
        lines.push(
          `- **Conditional branches:** ${n || 'present (see source)'}\n`
        );
      }
      if (req.rules.length) {
        lines.push('\n**Static rules**\n\n');
        lines.push(
          mdTable(
            ['Field', 'Rules', 'Message'],
            formatRulesTable(req.rules, req.messages)
          )
        );
      }
      if (req.conditionalBranches?.length) {
        lines.push('\n**Conditional branches**\n\n');
        for (const branch of req.conditionalBranches) {
          lines.push(`When \`${branch.condition}\`:\n\n`);
          lines.push(
            mdTable(
              ['Field', 'Rules', 'Message'],
              formatRulesTable(branch.rules, req.messages)
            )
          );
          lines.push('\n');
        }
      }
      lines.push('\n');
    }

    const routesContent = readSafe(pkg.routesFile);
    const allRoutes = routesContent
      ? parseRoutesFile(routesContent, {
          basePrefix: pkg.routePrefix ?? '',
          rootNamespace: `${pkg.namespace}\\Http\\Controllers`,
        })
      : [];

    lines.push(section(`Part X — ${pkg.label} complete route catalog`, 2));
    lines.push(
      `**${allRoutes.length}** routes parsed from \`${pkg.routesFile}\` (includes consumable \`/v1\`, auth, public, webhooks, and internal \`fleetbaseRoutes\` expansions).\n\n`
    );

    const byTier = new Map();
    for (const r of allRoutes) {
      const t = r.tier || 'unknown';
      if (!byTier.has(t)) byTier.set(t, []);
      byTier.get(t).push(r);
    }

    for (const tier of ROUTE_TIER_ORDER) {
      const tierRoutes = byTier.get(tier);
      if (!tierRoutes?.length) continue;

      lines.push(`### Tier: \`${tier}\` (${tierRoutes.length} routes)\n\n`);

      const sorted = [...tierRoutes].sort((a, b) =>
        a.path.localeCompare(b.path) || a.methods[0].localeCompare(b.methods[0])
      );

      for (const route of sorted) {
        const ctrlEntry = findControllerForRoute(route, pkg.controllers);
        const ctrl = ctrlEntry
          ? { class: ctrlEntry.class, full: ctrlEntry.full }
          : null;
        const actionName = route.handler?.method || 'handle';
        const controllerLabel =
          route.handler?.controller ||
          route.handler?.fqcn?.split('\\').pop() ||
          route.handlerString?.split('@')[0] ||
          '(closure)';

        const methodInfo = resolveControllerMethod(ctrl, actionName);
        const httpMethod = route.methods.join('|');
        const isQuery =
          actionName === 'queryRecord' ||
          actionName === 'query' ||
          (route.methods.includes('GET') && route.path.endsWith('/') === false && !route.path.includes('{id}') && actionName === 'queryRecord');

        const restForm = resolveRestFormRequest(
          route,
          actionName,
          requestMap,
          ctrl,
          pkg
        );
        let request =
          restForm ||
          buildEndpointRequest(route, methodInfo, requestMap, ctrl) ||
          {};
        const routeMeta = getRouteMeta(route);
        if (
          (routeMeta.restAction === 'createRecord' ||
            actionName === 'createRecord') &&
          !request.payloadKey &&
          routeMeta.resource
        ) {
          request.payloadKey = modelBaseFromResource(
            routeMeta.resource
          ).toLowerCase();
        }

        const middlewareNote = route.middleware?.length
          ? route.middleware.join(', ')
          : '—';

        const contract = buildEndpointContract({
          pkgId: pkg.id,
          route,
          request,
          ctrl,
          resourceRegistry: globalRegistry,
          resourceMap,
          actionName,
          httpMethod,
        });
        allContracts.push(contract);

        if (contract.unresolved?.length) {
          parserWarnings.push({
            path: route.path,
            method: httpMethod,
            issues: contract.unresolved,
          });
        }

        let sampleRequest;
        const emitSamples =
          contract.priority ||
          contract.confidence >= 50 ||
          shouldEmitSampleExpanded(pkg.id, route, actionName, request, {
            fields: contract.response?.flatFields,
          });
        if (emitSamples && request?.rules?.length) {
          sampleRequest = buildSampleRequestBody(
            request.rules,
            request.payloadKey
          );
        }
        const sampleResponse = emitSamples ? contract.sampleResponse : null;

        if (contract.response?.flatFields?.length) endpointsWithResponseFields++;
        if (sampleRequest || sampleResponse) endpointsWithSamples++;

        emitEndpointSpec(lines, mdTable, {
          title: `${httpMethod} ${route.path} — ${actionName}`,
          method: httpMethod,
          path: route.path,
          controller: controllerLabel,
          action: actionName,
          contract,
          notes: [
            `Middleware: ${middlewareNote}`,
            route.namespace
              ? `Namespace: ${dedupeNamespace(route.namespace)}`
              : null,
            route.source ? `Source: ${route.source}` : null,
            methodInfo?.usesManualValidation
              ? 'Manual Validator / createFrom'
              : null,
            contract.priority ? 'Priority endpoint (full contract)' : null,
          ]
            .filter(Boolean)
            .join('; '),
          queryParams:
            isQuery || routeMeta.restAction === 'queryRecord'
              ? STANDARD_QUERY_PARAMS
              : undefined,
          sampleRequest,
          sampleResponse,
          showFullSchema:
            contract.priority || contract.confidence >= 75,
        });
        endpointCount++;
      }
    }

    // tiers not in ROUTE_TIER_ORDER
    for (const [tier, tierRoutes] of byTier) {
      if (ROUTE_TIER_ORDER.includes(tier)) continue;
      lines.push(`### Tier: \`${tier}\` (${tierRoutes.length} routes)\n\n`);
      for (const route of tierRoutes) {
        endpointCount++;
        lines.push(`- **${route.methods.join('|')}** \`${route.path}\` → ${route.handlerString}\n`);
      }
      lines.push('\n');
    }
  }

  const completeness = scoreContractCompleteness(allContracts);
  const openApiMeta = buildOpenApiDocument(allContracts);

  const metaDir = path.join(__dirname, '_meta');
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  fs.writeFileSync(
    path.join(metaDir, 'backend-api-contracts.json'),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        completeness,
        openApi: openApiMeta,
        contracts: allContracts.map((c) => ({
          path: c.path,
          method: c.method,
          action: c.action,
          confidence: c.confidence,
          resourceClass: c.response?.resourceClass,
          fieldCount: c.response?.flatFields?.length || 0,
          priority: c.priority,
        })),
      },
      null,
      2
    ),
    'utf8'
  );

  lines.push(`### Part X coverage summary\n\n`);
  lines.push(
    mdTable(
      ['Metric', 'Count / %'],
      [
        ['Endpoints documented', String(endpointCount)],
        ['Endpoints with response field tables', String(endpointsWithResponseFields)],
        ['Endpoints with sample JSON', String(endpointsWithSamples)],
        ['Avg contract confidence', `${completeness.avgConfidence}%`],
        ['High confidence (≥70%)', `${completeness.highConfidence} (${completeness.pctComplete}%)`],
        ['With parsed response schema', `${completeness.withResponse} (${completeness.pctResponse}%)`],
        [
          'JsonResource classes (registry)',
          String(new Set([...globalRegistry.values()].map((r) => r.className)).size),
        ],
        ['Form request classes', String(requestClassCount)],
        ['API resource catalog sections', String(resourceCatalogCount)],
        ['Parser warnings', String(parserWarnings.length)],
      ]
    )
  );
  lines.push('\n');

  if (parserWarnings.length) {
    lines.push('### Part X — Parser warnings (unresolved references)\n\n');
    lines.push(
      mdTable(
        ['Path', 'Method', 'Issues'],
        parserWarnings.slice(0, 80).map((w) => [
          w.path,
          w.method,
          w.issues.join('; '),
        ])
      )
    );
    if (parserWarnings.length > 80) {
      lines.push(`\n*… ${parserWarnings.length - 80} more warnings.*\n`);
    }
    lines.push('\n');
  }

  return {
    endpointCount,
    requestClassCount,
    endpointsWithResponseFields,
    endpointsWithSamples,
    resourceCatalogCount,
    completeness,
  };
}

function parseModels(srcRoot) {
  const modelDir = path.join(srcRoot, 'Models');
  const files = walkDir(modelDir);
  return files.map((f) => {
    const c = readSafe(f) || '';
    const table = c.match(/protected\s+\$table\s*=\s*['"]([^'"]+)['"]/);
    const fillable = c.match(/protected\s+\$fillable\s*=\s*\[([\s\S]*?)\];/);
    const casts = c.match(/protected\s+\$casts\s*=\s*\[([\s\S]*?)\];/);
    return {
      file: f,
      class: path.basename(f, '.php'),
      table: table?.[1] || null,
      hasFillable: !!fillable,
      hasCasts: !!casts,
    };
  });
}

function parseJobsListenersObservers(srcRoot) {
  const result = { jobs: [], listeners: [], observers: [], events: [] };
  for (const [key, sub] of [
    ['jobs', 'Jobs'],
    ['listeners', 'Listeners'],
    ['observers', 'Observers'],
    ['events', 'Events'],
  ]) {
    const files = walkDir(path.join(srcRoot, sub));
    result[key] = files.map((f) => path.basename(f, '.php'));
  }
  return result;
}

function restPaths(resource, basePrefix, tier) {
  const prefix = basePrefix ? `/${basePrefix}` : '';
  const int = tier === 'internal' ? '/int' : '';
  const p = `${prefix}${int}/v1/${resource}`;
  return [
    { method: 'GET', path: p, action: 'queryRecord', desc: 'List/filter (query params)' },
    { method: 'GET', path: `${p}/{id}`, action: 'findRecord', desc: 'Single record by public_id' },
    { method: 'POST', path: p, action: 'createRecord', desc: 'Create' },
    { method: 'PUT', path: `${p}/{id}`, action: 'updateRecord', desc: 'Update' },
    { method: 'DELETE', path: `${p}/{id}`, action: 'deleteRecord', desc: 'Soft/hard delete per model' },
  ];
}

function mdTable(headers, rows) {
  const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const line = (r) => `| ${r.map(esc).join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map(line)].join('\n');
}

function section(title, level = 2) {
  return `\n${'#'.repeat(level)} ${title}\n\n`;
}

function anchor(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Build document ---
const lines = [];
const stats = { routes: 0, controllers: 0, models: 0, migrations: 0, tables: 0 };
const pkgData = [];

for (const pkg of PACKAGES) {
  const routesContent = readSafe(pkg.routesFile);
  const resources = routesContent ? extractFleetbaseRoutes(routesContent) : [];
  const customRoutes = routesContent ? extractCustomRoutes(routesContent) : [];
  const controllers = parseControllers(pkg.srcRoot);
  const models = parseModels(pkg.srcRoot);
  const tables = parseMigrationTables(pkg.migrations);
  const async = parseJobsListenersObservers(pkg.srcRoot);

  stats.routes += resources.length;
  stats.controllers += controllers.length;
  stats.models += models.length;
  stats.migrations += walkDir(pkg.migrations).length;
  stats.tables += tables.filter((t) => !t.alter).length;

  const routeBlocks = routesContent ? extractFleetbaseRouteBlocks(routesContent) : [];
  const parsedRoutes = routesContent
    ? parseRoutesFile(routesContent, {
        basePrefix: pkg.routePrefix ?? '',
        rootNamespace: `${pkg.namespace}\\Http\\Controllers`,
      })
    : [];

  pkgData.push({
    ...pkg,
    resources,
    customRoutes,
    routeBlocks,
    parsedRoutes,
    controllers,
    models,
    tables,
    async,
    routesContent,
  });
}

const generated = new Date().toISOString().slice(0, 10);

lines.push(`# Fleetbase Backend — Complete Low-Level Requirements

| Property | Value |
|----------|-------|
| **Scope** | Laravel API shell + all PHP extension packages (core-api, fleetops, storefront, ledger, pallet, registry-bridge) |
| **Audience** | Backend engineers, DevOps, security reviewers, integrators |
| **Regenerate** | \`node documents/_build-backend-llrd.mjs\` |
| **Generated** | ${generated} |
| **REST resources** | ${stats.routes} \`fleetbaseRoutes\` registrations |
| **Controllers** | ${stats.controllers} |
| **Models** | ${stats.models} |
| **Migrations** | ${stats.migrations} files, ~${stats.tables} create-table migrations |
| **Form request classes** | (see Part X) |
| **Endpoint specs** | (see Part X) |
| **Foreign keys (\`foreign()\`)** | (see Part VIII-B) |
| **Logical UUID indexes** | (see Part VIII-B) |
| **Eloquent relationships** | (see Part VIII-B) |
| **Event → listener mappings** | (see Part VII) |
| **Auth schema catalogs** | (see Part VII-B) |
| **UI ↔ API traceability rows** | (see Part XI) |
| **Runtime architecture coverage** | — |
| **Architecture intelligence coverage** | — |
| **Engineering OS readiness** | — |
| **Platform maturity index** | — |

### Quick navigation

**Parts**

- [Part 0 — Backend system architecture](#part-0--backend-system-architecture)
- [Part I — API contracts & authentication](#part-i--api-contracts--authentication)
- [Part II — Infrastructure & runtime](#part-ii--infrastructure--runtime)
- [Part III — Core API (platform)](#part-iii--core-api-platform)
- [Part IV — FleetOps extension](#part-iv--fleetops-extension)
- [Part IV-B — FleetOps order lifecycle](#part-iv-b--fleetops-order-lifecycle--workflows)
- [Part IV-C — FleetOps Flow / Activity state machine](#part-iv-c--fleetops-flow--activity-state-machine)
- [Part V — Storefront extension](#part-v--storefront-extension)
- [Part V-B — Storefront commerce workflows](#part-v-b--storefront-commerce-workflows)
- [Part VI — Ledger, Pallet & Registry](#part-vi--ledger-pallet--registry)
- [Part VI-B — Ledger billing workflows](#part-vi-b--ledger-billing--accounting-workflows)
- [Part VII — Events, jobs, queues & webhooks](#part-vii--events-jobs-queues--webhooks)
- [Part VII-B — Permissions, policies & authorization](#part-vii-b--permissions-policies--authorization)
- [Part VII-C — Services & Filter catalog](#part-vii-c--services--filter-catalog)
- [Part VII-D — Jobs & queue runtime](#part-vii-d--jobs--queue-runtime)
- [Part VII-E — Event runtime flows](#part-vii-e--event-runtime-flows)
- [Part VII-F — Webhook contracts](#part-vii-f--webhook-contracts)
- [Part VII-G — Realtime architecture](#part-vii-g--realtime-architecture)
- [Part VII-H — Authorization directives & tenancy](#part-vii-h--authorization-directives--tenancy)
- [Part VII-I — Workflow runtime graphs](#part-vii-i--workflow-runtime-graphs)
- [Part VII-J — Scheduler runtime](#part-vii-j--scheduler-runtime)
- [Part XII — Architecture intelligence & knowledge graph](#part-xii--architecture-intelligence--knowledge-graph)
- [Part XII-A — Dispatch source graph](#part-xii-a--dispatch-source-graph)
- [Part XII-B — Controller execution flows](#part-xii-b--controller-execution-flows)
- [Part XII-C — Service container map](#part-xii-c--service-container-map)
- [Part XII-D — Package dependency graph](#part-xii-d--package-dependency-graph)
- [Part XII-E — Data access intelligence](#part-xii-e--data-access-intelligence)
- [Part XII-F — Entity lifecycle & lineage](#part-xii-f--entity-lifecycle--lineage)
- [Part XII-G — Cache & runtime state](#part-xii-g--cache--runtime-state)
- [Part XII-H — Runtime topology (expanded)](#part-xii-h--runtime-topology-expanded)
- [Part XII-I — Observability coverage](#part-xii-i--observability-coverage)
- [Part XII-J — Architecture risk hotspots](#part-xii-j--architecture-risk-hotspots)
- [Part XIII — Engineering operating system](#part-xiii--engineering-operating-system)
- [Part XIV — Platform intelligence & continuous governance](#part-xiv--platform-intelligence--continuous-governance)
- [Part VIII — Database schema index](#part-viii--database-schema-index)
- [Part VIII-B — Foreign keys, indexes & relationships](#part-viii-b--foreign-keys-indexes--relationships)
- [Part IX — Security, caching & hidden rules](#part-ix--security-caching--hidden-rules)
- [Part X — API endpoint schemas (request / response)](#part-x--api-endpoint-schemas-request--response)
- [Part XI — REQ ↔ API ↔ frontend traceability](#part-xi--req--api--frontend-traceability)
- [Appendix — Operations checklist](#appendix--operations-checklist)

> **Document order** matches this navigation: Parts 0–VII-J, **Part XII**, Parts VIII–XI, **Part XIII–XIV**, Appendix.

---

`);

// Part 0
lines.push(section('Part 0 — Backend system architecture', 1));
lines.push(`Fleetbase is a **modular logistics operating system (LSOS)**. The deployable API is a thin **Laravel 10** application at \`api/\` that composes PHP packages via Composer. **Domain logic, routes, models, and migrations live in \`packages/*\`**, not in \`api/app\`.

### Layered architecture

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│  Clients: Console (Ember/React), SDK, Storefront apps, Webhooks │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│  api/ — Laravel shell (health, .env, Octane, storage mounts)     │
├─────────────────────────────────────────────────────────────────┤
│  packages/core-api — IAM, auth, files, webhooks, schedules, …    │
│  packages/fleetops/server — Orders, drivers, fleet, telematics     │
│  packages/storefront/server — Commerce, carts, checkouts           │
│  packages/ledger/server — Invoices, wallets, accounting            │
│  packages/pallet/server — WMS inventory                            │
│  packages/registry-bridge/server — Extension marketplace           │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
   MySQL 8.x            Redis (cache/queue)   SocketCluster
\`\`\`

### Package map

${mdTable(
  ['Package', 'Composer name', 'Route file', 'Migrations'],
  PACKAGES.map((p) => [
    p.label,
    p.id === 'core-api' ? 'fleetbase/core-api' : `fleetbase/${p.id}-api`,
    p.routesFile,
    p.migrations,
  ])
)}

### URL tiers (all packages)

| Tier | Middleware | Typical use |
|------|------------|-------------|
| **Public consumable** | \`fleetbase.api\` | API key (HTTP Basic once), SDK, integrations |
| **Internal console** | \`fleetbase.protected\` | Sanctum session cookie, Ember/React console |
| **Registry** | \`fleetbase.registry\` | Extension registry install/auth |
| **Unauthenticated internal** | Throttle only | Installer, onboard, branding lookup |

**Path prefixes** (env-driven):

- \`API_PREFIX\` → \`config('fleetbase.api.routing.prefix')\` (default root \`/\`)
- \`INTERNAL_API_PREFIX\` → default \`int\` — internal groups usually add \`v1\` (e.g. **\`/int/v1/users\`**, **\`/int/v1/orders\`**)
- Extension prefixes: \`storefront\`, \`ledger\`, \`pallet\`, \`~registry\` (e.g. \`/storefront/int/v1/...\`, \`/ledger/int/v1/...\`)
- **Authoritative paths:** Part X lists exact parsed paths per route; do not assume every package uses the same prefix depth.

### REST resource convention

Every \`fleetbaseRoutes('resource-name')\` registers five actions via \`Fleetbase\\Routing\\RESTRegistrar\`:

| HTTP | Path | Controller method | Semantics |
|------|------|-------------------|-----------|
| GET | \`/{prefix}/v1/{resource}\` | \`queryRecord\` | Paginated list; filter via query string |
| GET | \`/{prefix}/v1/{resource}/{id}\` | \`findRecord\` | Single record (\`public_id\`) |
| POST | \`/{prefix}/v1/{resource}\` | \`createRecord\` | Create |
| PUT | \`/{prefix}/v1/{resource}/{id}\` | \`updateRecord\` | Update |
| DELETE | \`/{prefix}/v1/{resource}/{id}\` | \`deleteRecord\` | Delete (soft delete when model uses SoftDeletes) |

Custom actions are registered in the route closure **before** the REST block (same prefix group).

### Laravel shell (\`api/\`)

- **Health:** \`GET /health\` — JSON status + timing (\`RouteServiceProvider\`)
- **App code:** Minimal — \`app/Models/User.php\` stub; real user model is \`Fleetbase\\Models\\User\`
- **Composer deps:** \`fleetbase/core-api\`, \`fleetops-api\`, \`storefront-api\`, \`ledger-api\`, \`registry-bridge\`, Octane, Predis, S3, Stripe, mail drivers

---

`);

// Part I
lines.push(section('Part I — API contracts & authentication', 1));
lines.push(`### Middleware stacks

#### \`fleetbase.protected\` (console / internal)

1. \`AddQueuedCookiesToResponse\`
2. \`StartSession\`
3. \`auth:sanctum\`
4. \`SetupFleetbaseSession\` — binds company, sandbox, permissions to request
5. \`AuthorizationGuard\` — policy/permission checks
6. \`TrackPresence\` — user presence for chat/collaboration
7. \`ValidateETag\` — conditional GET support

#### \`fleetbase.api\` (consumable / SDK)

1. \`ThrottleRequests\`
2. \`StartSession\`
3. \`AuthenticateOnceWithBasicAuth\` — API credential key/secret
4. \`SubstituteBindings\`
5. \`LogApiRequests\` — async log job

#### Global middleware (all requests)

- \`RequestTimer\`, \`ResetJsonResourceWrap\`, \`MergeConfigFromSettings\`, \`AttachCacheHeaders\`

### Auth routes (\`fleetbaseAuthRoutes\`)

**Public (throttled):** \`POST /int/v1/auth/login\`, \`sign-up\`, \`logout\`, password reset, email verification sessions.

**Protected:** \`switch-organization\`, \`join-organization\`, \`create-organization\`, \`GET session\`, \`GET services\`.

### Session & tokens

- **Sanctum** SPA authentication for console (\`config/sanctum.php\`, default token expiration 7 days)
- **API credentials** table — Basic auth for \`fleetbase.api\` routes
- **Spatie Laravel Permission** — roles, policies, permissions (\`config/permission.php\`)
- **Two-factor** — \`TwoFaController\`; company/system settings; SMS bypass code **must be null in production** (\`SMS_AUTH_BYPASS_CODE\`)

### Multi-tenancy

- **Company** (\`company_uuid\`) scopes nearly all domain data
- \`SetupFleetbaseSession\` resolves active company from session/header
- **Sandbox** connection (\`SANDBOX_DB_CONNECTION\`) for test API keys; hourly \`sandbox:sync\` command

### Response shape

- JSON API resources via Laravel API Resources under each package \`Http/Resources\`
- \`ResetJsonResourceWrap\` removes default \`data\` wrapper for Fleetbase clients
- Errors: standard Laravel validation + Fleetbase HTTP exceptions

---

`);

// Part II (topology enriched at generation; see also Part XII-H)
const infraTopologyEarly = buildInfraTopology(readSafe);

// Part II
lines.push(section('Part II — Infrastructure & runtime', 1));
lines.push(`### Docker Compose services (\`docker-compose.yml\`)

${mdTable(
  ['Service', 'Image / build', 'Role'],
  [
    ['cache', 'redis:4-alpine', 'Cache + queue backend'],
    ['database', 'mysql:8.0-oracle', 'Primary MySQL'],
    ['socket', 'socketcluster:v17.4.0', 'Realtime broadcast (BROADCAST_DRIVER=socketcluster)'],
    ['scheduler', 'fleetbase/fleetbase-api', 'Cron via go-crond + crontab'],
    ['queue', 'fleetbase/fleetbase-api', 'php artisan queue:work'],
    ['application', 'fleetbase/fleetbase-api', 'API (FrankenPHP/Octane capable)'],
    ['console', 'build ./console', 'Static Ember console on :4200'],
    ['httpd', 'docker/httpd', 'Reverse proxy'],
  ]
)}

### Scheduled tasks (core-api \`CoreServiceProvider\`)

| Schedule | Command / job |
|----------|----------------|
| Hourly | \`cache:prune-stale-tags\` |
| Twice daily | \`purge:api-logs\`, \`purge:webhook-logs\`, \`purge:activity-logs\` (2-day retention) |
| Twice daily | \`purge:scheduled-task-logs\` (1-day) |
| Twice daily | \`model:prune\` (schedule monitor logs) |
| Daily | \`telemetry:ping\` |
| Daily 01:00 | \`MaterializeSchedulesJob\` |
| Hourly | \`sandbox:sync\` |

### Queue & cache

- **Default queue:** Redis (\`QUEUE_CONNECTION=redis\`)
- **Cache:** Redis (\`CACHE_DRIVER=redis\`) + optional **response cache** (\`config/responsecache.php\`)
- **User cache:** \`USER_CACHE_ENABLED\`, server TTL 900s, browser TTL 300s (\`config/fleetbase.php\`)

### Kubernetes (\`infra/helm/\`)

Chart deploys: API deployment, services, ingress, Redis, SocketCluster, TLS certificate, HPA, install hooks. Values in \`values.yaml\`; secrets template \`secrets.env\`.

### Key environment variables

| Variable | Purpose |
|----------|---------|
| \`DATABASE_URL\` / \`DB_*\` | MySQL connection |
| \`REDIS_URL\` / \`CACHE_URL\` | Redis |
| \`API_PREFIX\`, \`INTERNAL_API_PREFIX\` | Route prefixes |
| \`BROADCAST_DRIVER\` | socketcluster |
| \`REGISTRY_HOST\` | Extension registry |
| \`OSRM_HOST\` | Routing (FleetOps) |
| \`SMS_AUTH_BYPASS_CODE\` | Dev only — must be empty in prod |
| \`SANDBOX_DB_CONNECTION\` | Sandbox database |

### Runtime topology (parsed)

${mdTable(
  ['Component', 'Depends on', 'Purpose'],
  infraTopologyEarly.components.map((c) => [c.component, c.dependsOn, c.purpose])
)}

> **Deep topology:** [Part XII-H](#part-xii-h--runtime-topology-expanded) (Mermaid deployment graph).

---

`);

// Parts III–VI per package
const partTitles = {
  'core-api': 'Part III — Core API (platform)',
  fleetops: 'Part IV — FleetOps extension',
  storefront: 'Part V — Storefront extension',
  ledger: 'Part VI — Ledger, Pallet & Registry',
  pallet: 'Part VI — Ledger, Pallet & Registry',
  'registry-bridge': 'Part VI — Ledger, Pallet & Registry',
};

let partVIStarted = false;

for (const pkg of pkgData) {
  const partTitle = partTitles[pkg.id];
  if (pkg.id === 'pallet' || pkg.id === 'registry-bridge') {
    if (!partVIStarted) {
      lines.push(section(partTitle, 1));
      partVIStarted = true;
    }
  } else {
    lines.push(section(partTitle, 1));
  }

  lines.push(`### Package: ${pkg.label}\n`);
  lines.push(`- **Namespace:** \`${pkg.namespace}\`\n`);
  lines.push(`- **Routes:** \`${pkg.routesFile}\`\n`);
  lines.push(
    `- **Migrations:** ${walkDir(pkg.migrations).length} files\n`
  );

  lines.push(`#### REST resources (\`fleetbaseRoutes\`)\n\n`);
  lines.push(`Total: **${pkg.resources.length}** resources.\n\n`);

  const internalBase = pkg.prefix.internal || 'int';
  const resourceRows = pkg.resources.map((r) => {
    const ctrl = r
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('')
      .replace(/s$/, '')
      .concat('', '')
      .replace(/ies$/, 'y')
      .replace(/ses$/, 's');
    const controllerGuess =
      r.endsWith('ies') ? r.slice(0, -3) + 'y' + 'Controller' : 
      r.endsWith('s') ? r.slice(0, -1).split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join('') + 'Controller' :
      r.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('') + 'Controller';
    return [
      r,
      `GET/POST /${internalBase}/v1/${r}`,
      controllerGuess.replace(/Controller$/, '') + 'Controller (convention)',
    ];
  });

  lines.push(mdTable(['Resource', 'Internal base path', 'Controller (inferred)'], resourceRows.slice(0, 200)));
  if (resourceRows.length > 200) {
    lines.push(`\n*… and ${resourceRows.length - 200} more resources.*\n`);
  }

  lines.push(`\n#### Standard REST matrix (per resource)\n\n`);
  lines.push(
    mdTable(
      ['Method', 'Path pattern', 'Action'],
      restPaths('{resource}', pkg.prefix.public || '', 'internal').map((x) => [
        x.method,
        x.path.replace('{resource}', '{name}'),
        x.action,
      ])
    )
  );

  if (pkg.customRoutes.length) {
    lines.push(`\n#### Custom route samples (first 40)\n\n`);
    lines.push(
      mdTable(
        ['Method', 'Path suffix', 'Action'],
        pkg.customRoutes.slice(0, 40).map((r) => [r.method, r.path, r.action])
      )
    );
  }

  lines.push(`\n#### Controllers (${pkg.controllers.length})\n\n`);
  for (const ctrl of pkg.controllers.slice(0, 60)) {
    const customMethods = ctrl.methods.filter(
      (m) =>
        !['queryRecord', 'findRecord', 'createRecord', 'updateRecord', 'deleteRecord'].includes(m)
    );
    lines.push(`##### ${ctrl.class}\n\n`);
    lines.push(`- **File:** \`${ctrl.file}\`\n`);
    lines.push(`- **Methods:** ${ctrl.methods.length} (${customMethods.length} custom)\n`);
    if (customMethods.length) {
      lines.push(`- **Custom actions:** ${customMethods.join(', ')}\n`);
    }
    lines.push('\n');
  }
  if (pkg.controllers.length > 60) {
    lines.push(`*… ${pkg.controllers.length - 60} additional controllers omitted for size; see \`${pkg.srcRoot}/Http/Controllers\`.*\n\n`);
  }

  lines.push(`#### Models (${pkg.models.length})\n\n`);
  if (pkg.models.length) {
    lines.push(
      mdTable(
        ['Model', 'Table override', 'File'],
        pkg.models.map((m) => [m.class, m.table || '(default)', m.file])
      )
    );
  }

  lines.push(`\n#### Async & domain hooks\n\n`);
  lines.push(
    mdTable(
      ['Type', 'Count', 'Classes'],
      [
        ['Jobs', pkg.async.jobs.length, pkg.async.jobs.slice(0, 15).join(', ') || '—'],
        ['Events', pkg.async.events.length, pkg.async.events.slice(0, 15).join(', ') || '—'],
        ['Listeners', pkg.async.listeners.length, pkg.async.listeners.slice(0, 15).join(', ') || '—'],
        ['Observers', pkg.async.observers.length, pkg.async.observers.slice(0, 15).join(', ') || '—'],
      ]
    )
  );

  // Custom actions per resource (fleetops-heavy)
  const blocksWithCustom = pkg.routeBlocks.filter((b) => b.customs.length > 0);
  if (blocksWithCustom.length) {
    lines.push(`\n#### Custom actions by resource (${blocksWithCustom.length} resources)\n\n`);
    for (const b of blocksWithCustom) {
      lines.push(`**${b.resource}**\n\n`);
      lines.push(
        mdTable(
          ['Method', 'Path suffix'],
          b.customs.map((c) => [c.method, c.path])
        )
      );
      lines.push('\n');
    }
  }

  lines.push('\n---\n');
}

// Part IV-B FleetOps order workflow (deep dive)
const fleetops = pkgData.find((p) => p.id === 'fleetops');
if (fleetops?.routesContent) {
  lines.push(section('Part IV-B — FleetOps order lifecycle & workflows', 1));
  lines.push(`Orders are the central domain aggregate. State changes flow through **consumable API** (driver/navigator/SDK) and **internal console API**.

### Consumable order endpoints (\`/v1/orders\`, middleware: \`fleetbase.api\`)

${mdTable(
  ['Method', 'Path', 'Controller action', 'Purpose'],
  [
    ['POST', '/', 'create', 'Create order'],
    ['GET', '/', 'query', 'List orders'],
    ['GET', '{id}', 'find', 'Order detail'],
    ['GET', '{id}/distance-and-time', 'getDistanceMatrix', 'Distance/time matrix'],
    ['POST/PATCH', '{id}/schedule', 'scheduleOrder', 'Schedule without dispatch'],
    ['POST/PATCH', '{id}/dispatch', 'dispatchOrder', 'Dispatch to driver'],
    ['POST', '{id}/start', 'startOrder', 'Start in progress'],
    ['DELETE', '{id}/cancel', 'cancelOrder', 'Cancel'],
    ['POST/PATCH', '{id}/update-activity', 'updateActivity', 'Advance workflow activity'],
    ['POST', '{id}/complete', 'completeOrder', 'Complete'],
    ['GET', '{id}/next-activity', 'getNextActivity', 'Next activity in config'],
    ['GET', '{id}/tracker', 'trackerData', 'Public tracker payload'],
    ['GET', '{id}/eta', 'etaData', 'ETA per waypoint'],
    ['POST/PATCH', '{id}/set-destination/{placeId}', 'setDestination', 'Change destination'],
    ['POST', '{id}/capture-signature/{subjectId?}', 'captureSignature', 'POD signature'],
    ['POST', '{id}/capture-qr/{subjectId?}', 'captureQrScan', 'QR proof'],
    ['POST', '{id}/capture-photo/{subjectId?}', 'capturePhoto', 'Photo proof'],
    ['GET', '{id}/proofs/{subjectId?}', 'proofs', 'List proofs'],
  ]
)}

### Internal console order endpoints (\`/int/v1/orders\`, middleware: \`fleetbase.protected\`)

Bulk and back-office operations:

${mdTable(
  ['Method', 'Path suffix', 'Action', 'Purpose'],
  [
    ['GET', 'default-config', 'getDefaultOrderConfig', 'Active order config'],
    ['GET', 'search', 'search', 'Search index'],
    ['GET', 'statuses', 'statuses', 'Status enum/metadata'],
    ['GET', 'types', 'types', 'Order types'],
    ['PATCH', 'route/{id}', 'editOrderRoute', 'Edit route geometry'],
    ['PATCH', 'update-activity/{id}', 'updateActivity', 'Activity transition'],
    ['PATCH', 'bulk-assign-driver', 'bulkAssignDriver', 'Mass assign'],
    ['PATCH', 'bulk-cancel', 'bulkCancel', 'Mass cancel'],
    ['POST', 'bulk-dispatch', 'bulkDispatch', 'Mass dispatch'],
    ['PATCH', 'cancel', 'cancel', 'Cancel (body ids)'],
    ['PATCH', 'dispatch', 'dispatchOrder', 'Dispatch'],
    ['PATCH', 'start', 'start', 'Start'],
    ['PATCH', 'schedule', 'scheduleOrder', 'Schedule only'],
    ['POST', 'process-imports', 'importFromFiles', 'CSV/spreadsheet import'],
    ['GET/POST', 'export', 'export', 'Export'],
  ]
)}

### Order configuration (\`order-configs\`)

\`order-configs\` define the **activity graph** (pickup → dropoff → custom activities). \`OrderController::updateActivity\` / \`nextActivity\` advance state according to config. Console edits configs via standard REST on \`/int/v1/order-configs\`.

### Related aggregates

| Resource | Role in order flow |
|----------|-------------------|
| \`payloads\` | Cargo/items on order |
| \`entities\` | Stops/waypoints linked to payload |
| \`routes\` | Computed route polyline |
| \`positions\` | GPS history; replay + metrics endpoints |
| \`proofs\` | Signatures, photos, QR captures |
| \`purchase-rates\` | Commercial rates |
| \`tracking-numbers\` / \`tracking-statuses\` | Customer tracking |
| \`integrated-vendors\` | External TMS/marketplace handoff |

### Driver / navigator (consumable \`/v1/drivers\`)

SMS login, device registration, \`{id}/track\` location ingest, \`toggle-online\`, organization switch — used by Navigator mobile app. Config: \`fleetops.navigator.*\`, \`OSRM_HOST\`, \`DISTANCE_MATRIX_PROVIDER\`.

### Orchestration & routing

- **OSRM** — \`config('fleetops.osrm.host')\` for route geometry
- **VROOM** — route optimization (optional extension overrides URI)
- **ORCHESTRATOR_ENGINE** — \`greedy\` (built-in) or external
- **Geofences** — \`/int/v1/geofences/events\`, dwell reports, driver history

### Telematics webhooks (public)

\`webhooks/telematics/{providerKey}\` and \`webhooks/telematics/ingest/{id}\` — ingest provider GPS/events without session auth (provider validation inside controller).

---

`);
  generatePartIVC(lines, mdTable, section, readSafe);
}

function generatePartIVC(lines, mdTable, section, readSafeFn) {
  lines.push(section('Part IV-C — FleetOps Flow / Activity state machine', 1));
  const orderConfigSrc = readSafeFn(
    'packages/fleetops/server/src/Models/OrderConfig.php'
  );
  const flowHelpers = orderConfigSrc
    ? parseOrderConfigFlowHelpers(orderConfigSrc)
    : [];

  lines.push(`Order workflow is **data-driven** from \`order_configs.flow\` (JSON). Runtime classes in \`Fleetbase\\\\FleetOps\\\\Flow\\\\\` interpret the graph.

### Core classes

| Class | Role |
| --- | --- |
| \`Flow\` | Container; \`getActivity(code)\`, iterates \`activities[]\` |
| \`Activity\` | Node: \`code\`, child \`activities[]\`, \`logic[]\`, \`events[]\` |
| \`Logic\` / conditions | Gate transitions (\`and\` / \`or\` / \`if\` / \`not\`) |
| \`Flow\\\\Event\` | Maps string → Laravel event class, then \`event()\` |

### Standard activity codes

${mdTable(
  ['Code', 'Typical meaning'],
  STANDARD_FLOW_CODES.map((c) => [c, 'Built-in lifecycle node (see OrderConfig helpers)'])
)}

### OrderConfig helpers

${flowHelpers.length ? flowHelpers.map((h) => `- \`${h}()\`\n`).join('') : '_See OrderConfig.php_'}

### Flow JSON shape (stored on \`order_configs.flow\`)

\`\`\`json
${FLOW_JSON_SCHEMA.trim()}
\`\`\`

### Activity → domain event resolution

${FLOW_EVENT_RESOLUTION.map((r) => `- ${r}`).join('\n')}

### Order model transitions

${mdTable(
  ['Action / endpoint', 'Effect'],
  ORDER_TRANSITIONS.map((t) => [t.action, t.effect])
)}

### State progression (typical default graph)

\`\`\`mermaid
stateDiagram-v2
  [*] --> created
  created --> dispatched: dispatch
  dispatched --> started: start
  started --> completed: complete / updateActivity
  created --> canceled: cancel
  dispatched --> canceled: cancel
\`\`\`

> Actual edges come from each \`order_config\` flow JSON — use \`GET next-activity/{id}\` for runtime next step.

`);

  const sampleFlow = tryLoadSampleFlowCodes(readSafeFn);
  if (sampleFlow) {
    lines.push(
      `### Sample flow codes from \`${sampleFlow.file}\`\n\n${sampleFlow.codes.map((c) => `- \`${c}\``).join('\n')}\n\n`
    );
  }

  lines.push('---\n\n');
}

// Storefront & Ledger workflow summaries
const storefront = pkgData.find((p) => p.id === 'storefront');
const ledger = pkgData.find((p) => p.id === 'ledger');
if (storefront) {
  lines.push(section('Part V-B — Storefront commerce workflows', 1));
  lines.push(`Storefront mounts under **\`/storefront/v1\`** (consumable) and **\`/storefront/int/v1\`** (console).

### Consumable flow (customer-facing API)

1. **Browse** — \`GET /storefront/v1/stores\`, products, categories, search  
2. **Cart** — cart CRUD, add line items  
3. **Checkout** — \`checkouts\` create session; payment gateways (Stripe, QPay callback \`checkouts/capture-qpay\`)  
4. **Customer auth** — SMS/OAuth login on \`customers\` routes  
5. **Order** — creates linked FleetOps order via observers/listeners on dispatch  

### Internal console resources

${storefront.resources.map((r) => `- \`${r}\``).join('\n')}

### Integration points

- **FleetOps orders** — \`OrderObserver\`, listeners \`HandleOrderCompleted\`, \`HandleOrderDispatched\`, etc.  
- **Push notifications** — \`Support\\PushNotification\`, notification channels CRUD  
- **Metrics** — internal metrics controller for dashboard aggregates  

---

`);
}
if (ledger) {
  lines.push(section('Part VI-B — Ledger billing & accounting workflows', 1));
  lines.push(`Ledger mounts under **\`/ledger\`** with public invoice payment pages and internal console CRUD.

### Public (unauthenticated) routes

- \`POST /ledger/webhooks/{driver}\` — payment provider webhooks  
- \`GET /ledger/public/invoices/{public_id}\` — customer invoice view/pay  

### Wallet API (\`fleetbase.api\`)

Wallet balance, transactions — for embedded payment flows.

### Internal resources

${ledger.resources.map((r) => `- \`${r}\``).join('\n')}

### Business rules

- **Accounts & journals** — double-entry style journals linked to transactions  
- **Gateways** — Stripe and extensible drivers; webhook signature validation per driver  
- **Invoices** — line items, public pay links, gateway session creation  

---

`);
}

function generatePartVII(eventData, pkgData, lines, mdTable, section) {
  let totalMappings = 0;
  let totalObservers = 0;

  lines.push(section('Part VII — Events, jobs, queues & webhooks', 1));
  lines.push(`Parsed from package \`EventServiceProvider::$listen\` and \`$observers\` on service providers. **Runtime depth:** see [Part VII-D](#part-vii-d--jobs--queue-runtime) through [Part VII-J](#part-vii-j--scheduler-runtime) for jobs, event chains, webhooks, SocketCluster, directives, workflows, and scheduler.

> **Regenerate:** \`node documents/_build-backend-llrd.mjs\`

### How to read this section

| Source | What it captures |
|--------|------------------|
| **EventServiceProvider** | Synchronous \`$listen\` map: event class → listener classes |
| **Service provider \`$observers\`** | Eloquent model lifecycle hooks (often dispatch events) |
| **Jobs / Events / Listeners folders** | Class inventory per package (Parts III–VI tables) |

---

`);

  lines.push(`### Global event → listener matrix\n\n`);
  const allListen = [];
  for (const pkg of eventData.byPackage) {
    for (const row of pkg.listen) {
      allListen.push({ ...row, package: pkg.label });
    }
  }
  if (eventData.shell.listen.length) {
    for (const row of eventData.shell.listen) {
      allListen.push({ ...row, package: 'Laravel shell (api/)' });
    }
  }

  if (allListen.length) {
    lines.push(
      mdTable(
        ['Package', 'Event', 'Listeners', 'Provider file'],
        allListen.map((r) => [
          r.package,
          r.event,
          r.listeners.join(', '),
          path.basename(r.file),
        ])
      )
    );
    totalMappings = allListen.length;
    lines.push('\n');
  } else {
    lines.push('_No `$listen` mappings found._\n\n');
  }

  lines.push(`### Model observers (Eloquent)\n\n`);
  const allObservers = [];
  for (const pkg of eventData.byPackage) {
    for (const row of pkg.observers) {
      allObservers.push({ ...row, package: pkg.label });
    }
  }
  for (const row of eventData.shell.observers) {
    allObservers.push({ ...row, package: 'Laravel shell (api/)' });
  }

  if (allObservers.length) {
    lines.push(
      mdTable(
        ['Package', 'Model', 'Observer', 'Provider file'],
        allObservers.map((r) => [
          r.package,
          r.model,
          r.observer,
          path.basename(r.file),
        ])
      )
    );
    totalObservers = allObservers.length;
    lines.push('\n');
  }

  lines.push(`### Cross-package order event flow\n\n`);
  lines.push(`\`\`\`mermaid
flowchart LR
  subgraph FleetOps
    OD[OrderDispatched]
    OC[OrderCompleted]
    ODA[OrderDriverAssigned]
    OS[OrderStarted]
  end
  subgraph Listeners
    HOD[HandleOrderDispatched]
    HOC[HandleOrderCompleted]
    HODA[HandleOrderDriverAssigned]
    HOS[HandleOrderStarted]
    WH[SendResourceLifecycleWebhook]
    NO[NotifyOrderEvent]
  end
  subgraph Storefront
    SF1[Storefront HandleOrderDispatched]
    SF2[Storefront HandleOrderCompleted]
  end
  OD --> HOD
  OD --> WH
  OD --> NO
  OD --> SF1
  OC --> HOC
  OC --> WH
  OC --> NO
  OC --> SF2
  ODA --> HODA
  OS --> HOS
\`\`\`

Storefront listens to FleetOps order events in \`packages/storefront/server/src/Providers/EventServiceProvider.php\`. Core-api sends webhooks on many lifecycle events via \`SendResourceLifecycleWebhook\`.

---

`);

  lines.push(`### Webhook delivery (core-api)\n\n`);
  lines.push(`- Outbound: \`SendResourceLifecycleWebhook\` on \`ResourceLifecycleEvent\` and many FleetOps order/geofence events
- Config: \`config/webhook-server.php\` — signing, retries, queues
- Logs: \`webhook_request_logs\`; purge: \`purge:webhook-logs\`

### API request logging

- Middleware \`LogApiRequests\` → job \`LogApiRequest\`
- Logs: \`api-request-logs\` internal routes; purge: \`purge:api-logs\`

### Jobs inventory (by package)\n\n`);
  lines.push(
    mdTable(
      ['Package', 'Jobs', 'Events (classes)', 'Listeners (classes)'],
      pkgData.map((p) => [
        p.label,
        String(p.async.jobs.length),
        String(p.async.events.length),
        String(p.async.listeners.length),
      ])
    )
  );
  lines.push('\n---\n\n');

  return { totalMappings, totalObservers };
}

function generatePartVIIB(packages, lines, mdTable, section, readSafeFn, walkDirFn) {
  let totalResources = 0;
  let totalPolicies = 0;
  let totalRoles = 0;
  let totalSchemas = 0;
  let totalDirectives = 0;

  lines.push(
    section('Part VII-B — Permissions, policies & authorization', 1)
  );
  lines.push(`Fleetbase uses **Spatie Laravel Permission** plus Fleetbase **Auth Schemas** (\`Auth/Schemas/*.php\`). Permissions are materialized by \`php artisan fleetbase:create-permissions\` (\`CreatePermissions\` command).

Internal routes (\`fleetbase.protected\`) run \`AuthorizationGuard\`, which resolves required permission names from the controller resource + action.

> **Regenerate:** \`node documents/_build-backend-llrd.mjs\`

### Permission name format

| Pattern | Example | When checked |
|---------|---------|--------------|
| \`{service} {action} {resource}\` | \`fleet-ops dispatch order\` | Exact action on resource |
| \`{service} * {resource}\` | \`fleet-ops * order\` | Wildcard on resource |
| \`{service} *\` | \`fleet-ops *\` | Full service access |
| \`{service} see extension\` | \`fleet-ops see extension\` | Extension visible in console |

**Service** = schema \`$name\` (e.g. \`fleet-ops\`, \`iam\`). **Resource** = kebab-case singular from controller. **Action** = \`ActionMapper\` (REST method or custom action from schema).

### ActionMapper (controller → permission action)

| Controller method | Permission action |
| --- | --- |
${Object.entries(ACTION_MAPPER_CRUD)
  .map(([k, v]) => `| \`${k}\` | \`${v}\` |`)
  .join('\n')}

| HTTP method | Fallback action |
| --- | --- |
${Object.entries(ACTION_MAPPER_HTTP)
  .map(([k, v]) => `| ${k} | \`${v}\` |`)
  .join('\n')}

Custom actions (e.g. \`dispatch\`, \`schedule\`) must appear in the resource's \`actions\` array in the Auth Schema.

### Middleware stack (\`fleetbase.protected\`)

1. \`auth:sanctum\`
2. \`SetupFleetbaseSession\` — company, sandbox, permissions on request
3. \`AuthorizationGuard\` — \`Auth::resolvePermissionsFromRequest()\`
4. \`TrackPresence\`, \`ValidateETag\`

**Directives** (\`Auth/Directives/*.php\`) further scope list/query results via \`applyDirectivesToQuery()\` on models using \`HasApiModelBehavior\`.

---

`);

  for (const pkg of packages) {
    const schemaFiles = walkDirFn(path.join(pkg.srcRoot, 'Auth/Schemas'));
    const directiveFiles = walkDirFn(path.join(pkg.srcRoot, 'Auth/Directives'));
    const catalog = buildPermissionCatalogFromFiles(
      schemaFiles,
      directiveFiles,
      readSafeFn
    );

    if (!catalog.schemas.length && !catalog.directives.length) continue;

    lines.push(section(`Part VII-B — ${pkg.label}`, 2));
    lines.push(
      `| Metric | Count |\n|--------|-------|\n| Auth schema classes | ${catalog.schemas.length} |\n| Guarded resources | ${catalog.schemas.reduce((n, s) => n + s.resources.length, 0)} |\n| Bundled policies (schema) | ${catalog.schemas.reduce((n, s) => n + s.policies.length, 0)} |\n| Bundled roles (schema) | ${catalog.schemas.reduce((n, s) => n + s.roles.length, 0)} |\n| Query directives | ${catalog.directives.length} |\n\n`
    );

    totalSchemas += catalog.schemas.length;
    totalDirectives += catalog.directives.length;

    for (const schema of catalog.schemas) {
      totalResources += schema.resources.length;
      totalPolicies += schema.policies.length;
      totalRoles += schema.roles.length;

      lines.push(`#### Schema: \`${schema.className}\` (service: \`${schema.service}\`)\n\n`);
      lines.push(`- **File:** \`${schema.file}\`\n`);
      if (schema.schemaPermissions.length) {
        lines.push(
          `- **Schema-level permissions:** ${schema.schemaPermissions.map((p) => `\`${schema.service} ${p}\``).join(', ')}\n`
        );
      }
      lines.push(
        `- **Auto-generated policy names:** \`${schema.policyName}FullAccess\`, \`${schema.policyName}ReadOnly\`, \`AdministratorAccess\` (per \`CreatePermissions\`)\n\n`
      );

      if (schema.resources.length) {
        lines.push(`##### Resources & actions\n\n`);
        const resourceRows = schema.resources.map((r) => {
          const crud = ['create', 'update', 'delete', 'view', 'list', 'see'].filter(
            (a) => !r.removeActions.includes(a)
          );
          return [
            r.name,
            crud.join(', ') || '—',
            r.actions.length ? r.actions.join(', ') : '—',
            r.removeActions.length ? r.removeActions.join(', ') : '—',
          ];
        });
        lines.push(
          mdTable(
            ['Resource', 'CRUD actions', 'Custom actions', 'Removed CRUD'],
            resourceRows
          )
        );
        lines.push('\n');

        const sampleResource = schema.resources.find((r) => r.actions.length) || schema.resources[0];
        if (sampleResource) {
          const samples = expandResourcePermissions(
            schema.service,
            sampleResource.name,
            sampleResource.actions,
            sampleResource.removeActions
          ).slice(0, 8);
          lines.push(
            `*Sample generated names for \`${sampleResource.name}\`:* ${samples.map((s) => `\`${s}\``).join(', ')}${samples.length >= 8 ? ', …' : ''}\n\n`
          );
        }
      }

      if (schema.policies.length) {
        lines.push(`##### Bundled policies (${schema.policies.length})\n\n`);
        lines.push(
          mdTable(
            ['Policy', 'Description', 'Permission grants (count)'],
            schema.policies.map((p) => [
              p.name,
              (p.description || '—').slice(0, 80),
              String(p.permissions.length),
            ])
          )
        );
        lines.push('\n');
        const detail = schema.policies.slice(0, 3);
        for (const p of detail) {
          if (!p.permissions.length) continue;
          lines.push(
            `**${p.name}** — ${p.permissions.slice(0, 12).map((x) => `\`${schema.service} ${x}\``).join(', ')}${p.permissions.length > 12 ? ', …' : ''}\n\n`
          );
        }
      }

      if (schema.roles.length) {
        lines.push(`##### Bundled roles (${schema.roles.length})\n\n`);
        lines.push(
          mdTable(
            ['Role', 'Description', 'Policies / permissions (count)'],
            schema.roles.map((r) => [
              r.name,
              (r.description || '—').slice(0, 60),
              r.policies?.length
                ? `${r.policies.length} policies`
                : `${r.permissions?.length || 0} permissions`,
            ])
          )
        );
        lines.push('\n');
      }
    }

    if (catalog.directives.length) {
      lines.push(`#### Query directives\n\n`);
      lines.push(
        mdTable(
          ['Directive class', 'File'],
          catalog.directives.map((d) => [d.className, d.file])
        )
      );
      lines.push('\n');
    }

    lines.push('---\n\n');
  }

  lines.push(`### Global totals\n\n`);
  lines.push(
    `| Metric | Count |\n|--------|-------|\n| Auth schemas | ${totalSchemas} |\n| Guarded resources | ${totalResources} |\n| Bundled policies | ${totalPolicies} |\n| Bundled roles | ${totalRoles} |\n| Query directives | ${totalDirectives} |\n\n`
  );
  lines.push('---\n\n');

  return {
    totalSchemas,
    totalResources,
    totalPolicies,
    totalRoles,
    totalDirectives,
  };
}

const eventData = collectPackageEventData(PACKAGES, readSafe, walkDir);
const eventStats = generatePartVII(eventData, pkgData, lines, mdTable, section);
const authStats = generatePartVIIB(
  PACKAGES,
  lines,
  mdTable,
  section,
  readSafe,
  walkDir
);

function generatePartVIIC(packages, lines, mdTable, section, readSafeFn, walkDirFn) {
  let totalFilters = 0;
  let totalServices = 0;

  lines.push(section('Part VII-C — Services & Filter catalog', 1));
  lines.push(`**Filters** (\`Http/Filter/*\`) apply query-string parameters to Eloquent builders. **Support** classes hold domain services (routing, tracking, geocoding, etc.).

> **Regenerate:** \`node documents/_build-backend-llrd.mjs\`

### Filter base class

All package filters extend \`Fleetbase\\\\Http\\\\Filter\\\\Filter\` — auto-invokes public methods matching request params; skips \`limit\`, \`sort\`, \`with\`, \`expand\`, etc. Internal routes call \`queryForInternal()\` for company scope + eager loads.

---

`);

  for (const pkg of packages) {
    const { filters, modelFilterParams } = buildFilterCatalog(
      pkg.srcRoot,
      readSafeFn,
      walkDirFn
    );
    const services = buildSupportServicesCatalog(
      pkg.srcRoot,
      readSafeFn,
      walkDirFn
    );
    if (!filters.length && !services.length && !modelFilterParams.length) continue;

    lines.push(section(`Part VII-C — ${pkg.label}`, 2));
    lines.push(
      `| Metric | Count |\n|--------|-------|\n| Filter classes | ${filters.length} |\n| Models with \\$filterParams | ${modelFilterParams.length} |\n| Support service classes | ${services.length} |\n\n`
    );
    totalFilters += filters.length;
    totalServices += services.length;

    if (filters.length) {
      lines.push(`#### HTTP Filters\n\n`);
      lines.push(
        mdTable(
          ['Filter', 'Model (guess)', 'Scopes', 'Filter methods', 'File'],
          filters.map((f) => [
            f.className,
            f.modelGuess,
            f.scopes.join(', ') || '—',
            f.filterMethods.slice(0, 12).join(', ') || '—',
            path.basename(f.file),
          ])
        )
      );
      if (filters.some((f) => f.filterMethods.length > 12)) {
        lines.push(
          '\n*Some filters define more than 12 param methods — see source.*\n'
        );
      }
      lines.push('\n');
    }

    if (modelFilterParams.length) {
      lines.push(`#### Model \\$filterParams (HasApiModelBehavior)\n\n`);
      lines.push(
        mdTable(
          ['Model', 'Filter params', 'File'],
          modelFilterParams
            .sort((a, b) => a.model.localeCompare(b.model))
            .map((m) => [
              m.model,
              m.filterParams.slice(0, 15).join(', '),
              path.basename(m.file),
            ])
        )
      );
      lines.push('\n');
    }

    if (services.length) {
      lines.push(`#### Support / domain services\n\n`);
      lines.push(
        mdTable(
          ['Class', 'Methods (sample)', 'Summary', 'File'],
          services.slice(0, 40).map((s) => [
            s.className,
            s.methods.slice(0, 6).join(', ') || '—',
            s.summary || '—',
            path.basename(s.file),
          ])
        )
      );
      if (services.length > 40) {
        lines.push(`\n*… ${services.length - 40} more Support classes.*\n`);
      }
      lines.push('\n');
    }
    lines.push('---\n\n');
  }

  lines.push(
    `### Global totals\n\n| Metric | Count |\n|--------|-------|\n| Filter classes | ${totalFilters} |\n| Support services | ${totalServices} |\n\n---\n\n`
  );

  return { totalFilters, totalServices };
}

const catalogStats = generatePartVIIC(
  PACKAGES,
  lines,
  mdTable,
  section,
  readSafe,
  walkDir
);

function generatePartVIIRuntime(
  packages,
  eventData,
  lines,
  mdTable,
  section,
  readSafe
) {
  const jobData = buildJobCatalog(packages, readSafe, ROOT);
  const eventRuntime = buildEventRuntimeData(
    packages,
    eventData,
    readSafe,
    ROOT
  );
  const webhooks = buildWebhookCatalog(packages, readSafe);
  const realtime = buildRealtimeCatalog(readSafe);
  const authDirectives = buildAuthDirectiveCatalog(readSafe, ROOT);

  const schemaFiles = [];
  const directiveFiles = [];
  for (const pkg of packages) {
    schemaFiles.push(...walkDir(path.join(pkg.srcRoot, 'Auth/Schemas')));
    directiveFiles.push(...walkDir(path.join(pkg.srcRoot, 'Auth/Directives')));
  }
  const permCatalog = buildPermissionCatalogFromFiles(
    schemaFiles,
    directiveFiles,
    readSafe
  );
  const rbac = buildRbacMatrix(permCatalog.schemas);
  const workflows = buildWorkflowRuntime(readSafe);

  const coverage = buildRuntimeCoverage({
    jobs: jobData,
    events: eventRuntime,
    webhooks,
    realtime,
    authDirectives,
    rbac,
    workflows,
    schedules: jobData.schedules,
  });

  const metaDir = path.join(__dirname, '_meta');
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  exportRuntimeMeta(
    path.join(metaDir, 'backend-runtime.json'),
    fs,
    {
      generated: new Date().toISOString(),
      coverage,
      jobs: jobData.jobs.map((j) => ({
        class: j.className,
        queue: j.queue,
        trigger: j.triggerSource,
      })),
      eventFlows: eventRuntime.flows.length,
      webhooks: webhooks.stats,
      realtime: realtime.stats,
    }
  );

  // VII-D Jobs
  lines.push(section('Part VII-D — Jobs & queue runtime', 1));
  lines.push(`Parsed from \`Jobs/*\`, \`ShouldQueue\`, \`$schedule->job()\`, and dispatch references.

### Queue topology

| Setting | Value |
|---------|-------|
| Default connection | ${jobData.queueTopology.defaultConnection} |
| Named queues | ${jobData.queueTopology.namedQueues.join(', ') || 'default'} |
| Horizon | ${jobData.queueTopology.horizonEnabled ? 'config present' : 'not in repo'} |
| Retries | ${jobData.queueTopology.retryOverview} |

### Job catalog

${mdTable(
  [
    'Job class',
    'Package',
    'Queue',
    'Trigger',
    'Retries',
    'Payload',
    'Side effects',
  ],
  jobData.jobs.map((j) => [
    j.shortName,
    j.package,
    j.queue,
    j.triggerSource,
    j.tries,
    j.payloadFields.join(', '),
    j.sideEffects.join('; ') || '—',
  ])
)}

### Dispatch triggers (known)

${mdTable(
  ['Source', 'Job', 'Mode'],
  jobData.dispatchRefs.map((d) => [d.source, d.job, d.mode])
)}

---

`);

  // VII-E Event runtime
  lines.push(section('Part VII-E — Event runtime flows', 1));
  lines.push(`**${eventRuntime.stats.eventClasses}** event classes, **${eventRuntime.stats.listenerClasses}** listeners (${eventRuntime.stats.queuedListeners} queued, ${eventRuntime.stats.syncListeners} sync).

### Event → listener execution

${mdTable(
  ['Event', 'Package', 'Listeners (mode / effects)'],
  eventRuntime.flows.slice(0, 40).map((f) => [
    f.event,
    f.package,
    f.steps
      .map((s) => `${s.listener} [${s.mode}: ${s.effects}]`)
      .join('; '),
  ])
)}

### Order event flow (Mermaid)

\`\`\`mermaid
${formatEventFlowMermaid(eventRuntime.flows)}
\`\`\`

### Model observers

${mdTable(
  ['Package', 'Model', 'Observer'],
  eventRuntime.observers.slice(0, 30).map((o) => [o.package, o.model, o.observer])
)}

---

`);

  // VII-F Webhooks
  lines.push(section('Part VII-F — Webhook contracts', 1));
  lines.push(`### Inbound webhooks

${mdTable(
  ['Provider', 'Endpoint', 'Auth', 'Signature', 'Idempotency', 'Sample payload'],
  webhooks.inbound.map((w) => [
    w.provider,
    w.endpoint,
    w.auth,
    w.signatureVerification,
    w.idempotency,
    'JSON (see below)',
  ])
)}

**Sample telematics ingest:**

\`\`\`json
${JSON.stringify(webhooks.inbound[0]?.samplePayload || {}, null, 2)}
\`\`\`

### Outbound webhooks

${mdTable(
  ['Provider', 'Events', 'Auth', 'Retries', 'Queue'],
  webhooks.outbound.map((w) => [
    w.provider,
    w.events,
    w.auth,
    w.retryBehavior || w.tries,
    w.queue || '—',
  ])
)}

---

`);

  // VII-G Realtime
  lines.push(section('Part VII-G — Realtime architecture', 1));
  lines.push(`Transport: **SocketCluster** via \`broadcasting.connections.socketcluster\`.

| Setting | Value |
|---------|-------|
| Host | ${realtime.transport.host} |
| Port | ${realtime.transport.port} |
| Path | ${realtime.transport.path} |

${realtime.bootstrapNote}

### Channels

${mdTable(
  ['Channel', 'Producer', 'Consumer', 'Auth', 'Payload'],
  realtime.channels.map((c) => [
    c.channel,
    c.producer,
    c.consumer,
    c.auth,
    c.payload,
  ])
)}

\`\`\`mermaid
${realtime.mermaid}
\`\`\`

---

`);

  // VII-H Auth directives
  lines.push(section('Part VII-H — Authorization directives & tenancy', 1));
  lines.push(`### Tenancy & row-level scope

${mdTable(
  ['Scope', 'Constraint', 'Applies to'],
  authDirectives.tenancyRules.map((t) => [t.scope, t.constraint, t.applies])
)}

### DirectiveParser mechanisms

${mdTable(
  ['Mechanism', 'Description', 'Example'],
  authDirectives.parserBehavior.map((p) => [p.mechanism, p.description, p.example])
)}

### Apply order

${authDirectives.applyOrder.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### Documented directive examples

${mdTable(
  ['Directive', 'Query constraints', 'Scope'],
  authDirectives.documentedExamples.map((e) => [
    e.directive,
    e.queryConstraints,
    e.scope,
  ])
)}

### RBAC matrix (sample)

${mdTable(
  ['Service', 'Role', 'Resource', 'Action', 'Permission names'],
  rbac.rows.slice(0, 60).map((r) => [
    r.service,
    r.role,
    r.resource,
    r.actions,
    r.permissions,
  ])
)}

*Full matrix: ${rbac.stats.matrixRows} rows — see Part VII-B Auth Schemas.*

---

`);

  // VII-I Workflows
  lines.push(section('Part VII-I — Workflow runtime graphs', 1));
  lines.push(`### Order state machine

\`\`\`mermaid
${workflows.stateDiagramMermaid}
\`\`\`

### Dispatch decision flow

\`\`\`mermaid
${workflows.flowchartMermaid}
\`\`\`

### Flow JSON shape (order_configs.flow)

\`\`\`json
${workflows.flowJsonSchema}
\`\`\`

### Runtime transitions

${mdTable(
  ['Action', 'Effect'],
  workflows.orderTransitions.map((t) => [t.action, t.effect])
)}

---

`);

  // VII-J Scheduler
  lines.push(section('Part VII-J — Scheduler runtime', 1));
  lines.push(`Parsed from \`scheduleCommands()\` in package ServiceProviders (core-api, fleetops, storefront).

${mdTable(
  ['Package', 'Type', 'Target', 'Frequency', 'Purpose'],
  jobData.schedules.map((s) => [
    s.package,
    s.type,
    s.target,
    s.frequency,
    s.purpose,
  ])
)}

---

`);

  // Runtime coverage summary
  lines.push(section('Runtime coverage summary', 2));
  lines.push(
    mdTable(
      ['Area', 'Coverage %', 'Primary count', 'Notes'],
      Object.entries(coverage.areas).map(([area, v]) => [
        area,
        String(v.pct),
        String(v.count),
        area === 'Scheduler' ? `${jobData.schedules.length} scheduled tasks` : '',
      ])
    )
  );
  lines.push(`\n**Average runtime visibility:** ${coverage.avgCoveragePct}% — ${coverage.targetNote}\n\n`);

  if (coverage.warnings.length) {
    lines.push('### Runtime parser warnings\n\n');
    for (const w of coverage.warnings) lines.push(`- ${w}\n`);
    lines.push('\n');
  }

  lines.push('Intermediate metadata: `documents/_meta/backend-runtime.json`\n\n---\n\n');

  return {
    jobCount: jobData.jobs.length,
    scheduleCount: jobData.schedules.length,
    coveragePct: coverage.avgCoveragePct,
  };
}

const runtimeStats = generatePartVIIRuntime(
  pkgData,
  eventData,
  lines,
  mdTable,
  section,
  readSafe
);

function generatePartXIIArchitecture(
  packages,
  pkgData,
  eventData,
  lines,
  mdTable,
  section,
  readSafe,
  walkDirFn
) {
  const jobData = buildJobCatalog(packages, readSafe, ROOT);
  const eventRuntime = buildEventRuntimeData(
    packages,
    eventData,
    readSafe,
    ROOT
  );
  const realtime = buildRealtimeCatalog(readSafe);

  const arch = buildArchitectureIntelligence({
    packages,
    pkgData,
    eventData,
    jobData,
    eventRuntime,
    realtime,
    readSafe,
    walkDir: walkDirFn,
    repoRoot: ROOT,
  });

  const metaDir = path.join(__dirname, '_meta');
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  exportGraphFiles(metaDir, fs, arch.graphs);

  lines.push(section('Part XII — Architecture intelligence & knowledge graph', 1));
  lines.push(`Enterprise-grade **impact tracing**, **dependency graphs**, and **operational observability** parsed from PHP sources, Docker/Helm, and runtime metadata.

**Machine-readable exports:**

| File | Contents |
|------|----------|
| \`documents/_meta/backend-architecture-graph.json\` | Nodes/edges: controllers, dispatches, bindings |
| \`documents/_meta/backend-runtime-graph.json\` | Jobs, events, schedules, channels |
| \`documents/_meta/backend-dependency-graph.json\` | Package imports, container, model risks |

### Architecture intelligence coverage

${mdTable(
  ['Area', 'Coverage %', 'Count'],
  Object.entries(arch.coverage.areas).map(([area, v]) => [
    area,
    String(v.pct),
    String(v.count),
  ])
)}

**Platform visibility score:** ${arch.coverage.avgPct}%

---

`);

  // XII-A Dispatch
  lines.push(section('Part XII-A — Dispatch source graph', 1));
  lines.push(`**${arch.dispatch.stats.edgeCount}** trigger edges from static scan (\`dispatch\`, \`event\`, \`broadcast\`, \`Bus::dispatch\`).

${mdTable(
  ['Trigger source', 'Target', 'Type', 'Sync/Async'],
  arch.dispatch.edges.slice(0, 80).map((e) => [
    e.source.split('\\').pop(),
    e.target,
    e.type,
    e.syncAsync,
  ])
)}

### Execution sequence (sample)

\`\`\`mermaid
${arch.dispatch.mermaidSequence}
\`\`\`

### Async fanout (sample)

\`\`\`mermaid
${arch.dispatch.mermaidFlowchart}
\`\`\`

---

`);

  // XII-B Controller flows
  lines.push(section('Part XII-B — Controller execution flows', 1));
  for (const flow of arch.controllerFlows.flows.slice(0, 12)) {
    lines.push(`#### \`${flow.className.split('\\').pop()}\` (\`${flow.relPath}\`)\n\n`);
    for (const m of flow.methods.slice(0, 6)) {
      lines.push(`**${m.method}** (${m.lineCount} lines)\n\n`);
      lines.push(
        mdTable(
          ['Step', 'Action'],
          m.steps.map((s) => [String(s.order), s.step])
        )
      );
      lines.push('\n');
    }
  }
  lines.push('---\n\n');

  // XII-C Container
  lines.push(section('Part XII-C — Service container map', 1));
  lines.push(`${mdTable(
    ['Interface / token', 'Implementation', 'Scope', 'Provider'],
    arch.container.bindings.slice(0, 50).map((b) => [
      b.interface.slice(0, 60),
      b.implementation.slice(0, 50),
      b.scope,
      b.provider,
    ])
  )}

\`\`\`mermaid
${arch.container.mermaid}
\`\`\`

---

`);

  // XII-D Package graph
  lines.push(section('Part XII-D — Package dependency graph', 1));
  lines.push(`${mdTable(
    ['Package', 'Depends on', 'Imports', 'Coupling'],
    arch.packageGraph.edges.slice(0, 30).map((e) => [
      e.from,
      e.to,
      String(e.weight),
      e.couplingType,
    ])
  )}

${arch.packageGraph.cycles.length ? `### Cyclic dependencies\n\n${arch.packageGraph.cycles.map((c) => `- ${c.join(' → ')}`).join('\n')}\n\n` : ''}

\`\`\`mermaid
${arch.packageGraph.mermaid}
\`\`\`

---

`);

  // XII-E Query intel
  lines.push(section('Part XII-E — Data access intelligence', 1));
  lines.push(`${mdTable(
    ['Model', 'Package', 'Relationships', 'Scopes', 'Risks'],
    arch.queryIntel.priority.map((m) => [
      m.model,
      m.package,
      String(m.relationships.length),
      m.scopes.slice(0, 5).join(', ') || '—',
      m.risks.join('; ') || '—',
    ])
  )}

---

`);

  // XII-F Lineage
  lines.push(section('Part XII-F — Entity lifecycle & lineage', 1));
  for (const map of arch.lineage.maps) {
    lines.push(`### ${map.entity}\n\n`);
    lines.push(
      mdTable(
        ['Stage', 'Layer', 'Reference'],
        map.stages.map((s) => [s.stage, s.layer, s.ref])
      )
    );
    lines.push(`\n\`\`\`mermaid\n${map.mermaid}\n\`\`\`\n\n`);
  }
  lines.push('---\n\n');

  // XII-G Cache
  lines.push(section('Part XII-G — Cache & runtime state', 1));
  lines.push(`Session: **${arch.cacheTopology.session.driver}** · User cache: **${arch.cacheTopology.session.userCache}** · Response cache: **${arch.cacheTopology.responseCache}**

${mdTable(
  ['Cache key', 'Operation', 'TTL', 'Invalidation', 'Owner'],
  arch.cacheTopology.entries.slice(0, 40).map((e) => [
    e.key,
    e.operation,
    e.ttl,
    e.invalidation,
    e.owner,
  ])
)}

${arch.cacheTopology.locks.length ? `### Distributed locks (${arch.cacheTopology.locks.length} files)\n\n${arch.cacheTopology.locks.map((l) => `- \`${l.file}\``).join('\n')}\n\n` : ''}

---

`);

  // XII-H Topology (expanded)
  lines.push(section('Part XII-H — Runtime topology (expanded)', 1));
  lines.push(`${mdTable(
    ['Component', 'Image / build', 'Depends on', 'Purpose'],
    arch.topology.components.map((c) => [c.component, c.image, c.dependsOn, c.purpose])
  )}

### Environment groups

${mdTable(
  ['Group', 'Variables'],
  arch.topology.envGroups.map((g) => [g.group, g.vars.join(', ')])
)}

\`\`\`mermaid
${arch.topology.mermaid}
\`\`\`

---

`);

  // XII-I Observability
  lines.push(section('Part XII-I — Observability coverage', 1));
  lines.push(`${mdTable(
    ['Area', 'Logging', 'Metrics', 'Alerts'],
    arch.observability.areas.map((a) => [a.area, a.logging, a.metrics, a.alerts])
  )}

${arch.observability.silentAsync.length ? `### Async paths with limited failure hooks\n\n${arch.observability.silentAsync.map((f) => `- \`${f}\``).join('\n')}\n\n` : ''}

---

`);

  // XII-J Risks
  lines.push(section('Part XII-J — Architecture risk hotspots', 1));
  lines.push(`${mdTable(
    ['Risk', 'Severity', 'Location', 'Recommendation'],
    arch.risks.risks.map((r) => [r.risk, r.severity, r.location, r.recommendation])
  )}

---

`);

  return {
    coveragePct: arch.coverage.avgPct,
    dispatchEdges: arch.dispatch.stats.edgeCount,
    graphNodes: arch.graphs.architectureGraph.stats.nodes,
    riskCount: arch.risks.stats.total,
  };
}

const archStats = generatePartXIIArchitecture(
  PACKAGES,
  pkgData,
  eventData,
  lines,
  mdTable,
  section,
  readSafe,
  walkDir
);

// Part VIII - all tables
lines.push(section('Part VIII — Database schema index', 1));
lines.push(`Schema is split across packages; Laravel loads all migration paths at boot. **No migrations in \`api/database\`** — only package migrations apply.

### Naming conventions

- Primary keys: typically \`id\` (bigint) + \`uuid\` / \`public_id\` (char 36) for external APIs
- Tenancy: \`company_uuid\` on most domain tables
- Timestamps: \`created_at\`, \`updated_at\`; soft deletes: \`deleted_at\` where enabled
- Meta: JSON \`meta\`, \`options\`, or \`custom_field_values\` via core custom-fields subsystem

`);

const KEY_TABLES = new Set([
  'users',
  'companies',
  'company_users',
  'orders',
  'drivers',
  'vehicles',
  'places',
  'payloads',
  'api_credentials',
  'webhook_endpoints',
  'extensions',
  'products',
  'stores',
  'invoices',
  'accounts',
]);

for (const pkg of pkgData) {
  const creates = pkg.tables.filter((t) => !t.alter);
  lines.push(`### ${pkg.label} — ${creates.length} tables (create migrations)\n\n`);
  lines.push(
    mdTable(
      ['Table', 'Migration file'],
      creates.map((t) => [t.table, t.file])
    )
  );
  lines.push('\n');

  const detailed = creates.filter((t) => KEY_TABLES.has(t.table) && t.columns?.length);
  if (detailed.length) {
    lines.push(`#### Key table columns (${pkg.id})\n\n`);
    for (const t of detailed) {
      lines.push(`**${t.table}** (\`${t.file}\`)\n\n`);
      lines.push(t.columns.slice(0, 40).map((c) => `- ${c}`).join('\n'));
      if (t.columns.length > 40) lines.push(`\n- *… ${t.columns.length - 40} more columns*`);
      lines.push('\n\n');
    }
  }
}

function generatePartVIIIB(pkgData, lines, mdTable, section, readSafeFn, walkDirFn) {
  let totalFk = 0;
  let totalLogical = 0;
  let totalIdx = 0;
  let totalRels = 0;
  const globalRegistry = new Map();

  lines.push(section('Part VIII-B — Foreign keys, indexes & relationships', 1));
  lines.push(`Database constraints from **migration files** and **Eloquent model** relationship methods. UUID-style logical keys (\`*_uuid\` columns) are common even when no DB-level \`foreign()\` is declared.

> **Regenerate:** \`node documents/_build-backend-llrd.mjs\`

### How to read this section

| Source | What it captures |
|--------|------------------|
| **Migrations** | Declared \`foreign()\`, \`unique()\`, \`index()\` in \`up()\` |
| **Models** | \`belongsTo\`, \`hasMany\`, \`morphTo\`, etc. (runtime ORM graph) |
| **Logical keys** | \`company_uuid\`, \`payload_uuid\` on models — may exist without DB FK |

---

`);

  for (const pkg of pkgData) {
    const migrationFiles = walkDirFn(pkg.migrations);
    const registry = buildSchemaRegistry(migrationFiles, readSafeFn);
    const modelFiles = walkDirFn(path.join(pkg.srcRoot, 'Models'));
    const { byTable: modelsByTable, all: modelEntries } =
      buildModelRelationshipIndex(modelFiles, readSafeFn);

    for (const [table, schema] of registry) {
      if (!globalRegistry.has(table)) globalRegistry.set(table, schema);
      else {
        const g = globalRegistry.get(table);
        g.foreignKeys.push(...schema.foreignKeys);
        if (!g.logicalUuidIndexes) g.logicalUuidIndexes = [];
        g.logicalUuidIndexes.push(...(schema.logicalUuidIndexes || []));
        g.indexes.push(...schema.indexes);
        g.migrations.push(...schema.migrations);
      }
    }

    const pkgFk = [...registry.values()].reduce(
      (n, t) => n + t.foreignKeys.length,
      0
    );
    const pkgLogical = [...registry.values()].reduce(
      (n, t) => n + dedupeLogicalAgainstForeignKeys(t).length,
      0
    );
    const pkgIdx = [...registry.values()].reduce(
      (n, t) => n + t.indexes.length,
      0
    );
    const pkgRels = modelEntries.reduce(
      (n, m) => n + m.relationships.length,
      0
    );
    totalFk += pkgFk;
    totalLogical += pkgLogical;
    totalIdx += pkgIdx;
    totalRels += pkgRels;

    lines.push(section(`Part VIII-B — ${pkg.label}`, 2));
    lines.push(
      `| Metric | Count |\n|--------|-------|\n| Migration files | ${migrationFiles.length} |\n| Tables in registry | ${registry.size} |\n| Foreign keys (\`foreign()\`) | ${pkgFk} |\n| Logical UUID indexes | ${pkgLogical} |\n| Indexes / uniques (declared) | ${pkgIdx} |\n| Eloquent relationships | ${pkgRels} |\n\n`
    );

    const fkRows = [];
    for (const [table, schema] of [...registry.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      for (const fk of schema.foreignKeys) {
        fkRows.push([
          table,
          fk.column,
          fk.on,
          fk.references,
          fk.onDelete,
          path.basename(fk.file),
        ]);
      }
    }

    const logicalRows = [];
    for (const [table, schema] of registry) {
      for (const li of dedupeLogicalAgainstForeignKeys(schema)) {
        logicalRows.push([table, li.column, li.indexName, path.basename(li.file)]);
      }
    }
    logicalRows.sort((a, b) => a[0].localeCompare(b[0]));

    if (fkRows.length) {
      lines.push(`#### Declared foreign keys (\`$table->foreign()\`)\n\n`);
      lines.push(
        mdTable(
          ['Table', 'Column', 'References table', 'References column', 'ON DELETE', 'Migration'],
          fkRows
        )
      );
      lines.push('\n');
    } else {
      lines.push(`#### Declared foreign keys (\`$table->foreign()\`)\n\n_None in this package._\n\n`);
    }

    if (logicalRows.length) {
      lines.push(`#### Logical UUID references (indexed, no DB \`foreign()\` constraint)\n\n`);
      lines.push(
        mdTable(
          ['Table', 'Column', 'Index name (implies FK intent)', 'Migration'],
          logicalRows
        )
      );
      lines.push('\n');
    }

    const compositeIdx = [];
    for (const [table, schema] of registry) {
      for (const idx of schema.indexes) {
        if (idx.type === 'unique' || idx.columns.length > 1) {
          compositeIdx.push([
            table,
            idx.type,
            idx.columns.join(', '),
            idx.name || '—',
            path.basename(idx.file),
          ]);
        }
      }
    }
    compositeIdx.sort((a, b) => a[0].localeCompare(b[0]));

    if (compositeIdx.length) {
      lines.push(`#### Composite & unique indexes\n\n`);
      lines.push(
        mdTable(
          ['Table', 'Type', 'Columns', 'Index name', 'Migration'],
          compositeIdx
        )
      );
      lines.push('\n');
    }

    const colIndexCounts = [];
    for (const [table, schema] of registry) {
      const singles = schema.indexes.filter(
        (i) => i.type === 'index' && i.columns.length === 1
      );
      if (singles.length) {
        colIndexCounts.push([table, String(singles.length)]);
      }
    }
    if (colIndexCounts.length) {
      lines.push(`#### Single-column indexes (count per table)\n\n`);
      lines.push(
        mdTable(
          ['Table', 'Indexed columns'],
          colIndexCounts.sort((a, b) => a[0].localeCompare(b[0])).slice(0, 80)
        )
      );
      if (colIndexCounts.length > 80) {
        lines.push(`\n*… ${colIndexCounts.length - 80} more tables with single-column indexes.*\n`);
      }
      lines.push('\n');
    }

    const relRows = [];
    for (const entry of modelEntries.sort((a, b) =>
      (a.table || '').localeCompare(b.table || '')
    )) {
      for (const rel of entry.relationships) {
        relRows.push([
          entry.shortName || '—',
          entry.table || '—',
          rel.method,
          rel.type,
          rel.related?.split('\\').pop() || '—',
          formatRelationshipFk(rel),
          rel.morphType || '—',
        ]);
      }
    }

    if (relRows.length) {
      lines.push(`#### Eloquent relationships (model → model)\n\n`);
      lines.push(
        mdTable(
          [
            'Model',
            'Table',
            'Method',
            'Type',
            'Related class',
            'Foreign / morph id',
            'Morph type column',
          ],
          relRows
        )
      );
      lines.push('\n');
    }

    const keyDetail = [...DOMAIN_KEY_TABLES].filter(
      (t) => registry.has(t) || modelsByTable.has(t)
    );
    if (keyDetail.length) {
      lines.push(`#### Key table relationship detail\n\n`);
      for (const tableName of keyDetail.sort()) {
        const schema = registry.get(tableName);
        const model = modelsByTable.get(tableName);
        if (!schema && !model) continue;
        lines.push(`**${tableName}**\n\n`);
        if (schema?.foreignKeys.length) {
          lines.push('- **DB foreign keys:**\n');
          for (const fk of schema.foreignKeys) {
            lines.push(
              `  - \`${fk.column}\` → \`${fk.on}.${fk.references}\` ON DELETE ${fk.onDelete}\n`
            );
          }
        }
        const logicalOnly = schema
          ? dedupeLogicalAgainstForeignKeys(schema)
          : [];
        if (logicalOnly.length) {
          lines.push('- **Logical UUID indexes (no DB FK on column):**\n');
          for (const li of logicalOnly) {
            lines.push(`  - \`${li.column}\` (\`${li.indexName}\`)\n`);
          }
        }
        if (model?.relationships.length) {
          lines.push('- **ORM relationships:**\n');
          for (const rel of model.relationships) {
            if (rel.type === 'morphTo') {
              lines.push(
                `  - \`${rel.method}()\` morphTo → \`${rel.morphType}\` / \`${rel.morphId}\`\n`
              );
            } else {
              const fkLabel = formatRelationshipFk(rel);
              const fkSuffix =
                fkLabel && fkLabel !== '—' ? ` (FK: \`${fkLabel}\`)` : '';
              lines.push(
                `  - \`${rel.method}()\` ${rel.type} → \`${rel.related?.split('\\').pop()}\`${fkSuffix}\n`
              );
            }
          }
        }
        lines.push('\n');
      }
    }

    if (pkg.id === 'fleetops' && registry.has('orders')) {
      const ordersSchema = registry.get('orders');
      const ordersModel = modelsByTable.get('orders');
      lines.push(`#### FleetOps \`orders\` table — consolidated index map\n\n`);
      lines.push(
        `Create migration names logical indexes; \`2023_04_27_053459_add_foreign_keys_to_orders_table.php\` adds real \`foreign()\` constraints on most UUID columns. Alter migrations add \`order_config_uuid\`, \`vehicle_assigned_uuid\`, etc.\n\n`
      );
      if (ordersSchema.foreignKeys.length) {
        lines.push(`**Declared foreign keys (${ordersSchema.foreignKeys.length})**\n\n`);
        lines.push(
          mdTable(
            ['Column', 'References', 'ON DELETE', 'Migration'],
            ordersSchema.foreignKeys.map((fk) => [
              fk.column,
              `${fk.on}.${fk.references}`,
              fk.onDelete,
              path.basename(fk.file),
            ])
          )
        );
        lines.push('\n');
      }
      const ordersLogical = dedupeLogicalAgainstForeignKeys(ordersSchema);
      if (ordersLogical.length) {
        lines.push(
          `**Logical-only UUID indexes (${ordersLogical.length})** — indexed in create migration, no matching \`foreign()\` in registry\n\n`
        );
        lines.push(
          mdTable(
            ['Column', 'Index name', 'Migration'],
            ordersLogical.map((li) => [
              li.column,
              li.indexName,
              path.basename(li.file),
            ])
          )
        );
        lines.push('\n');
      }
      const expectedLogical = ['session_uuid', 'route_uuid'];
      const foundLogical = new Set(ordersLogical.map((li) => li.column));
      for (const col of expectedLogical) {
        if (!foundLogical.has(col)) {
          const hasFk = ordersSchema.foreignKeys.some((fk) => fk.column === col);
          if (!hasFk) {
            lines.push(
              `> **Note:** expected logical index \`${col}\` not found in parser output.\n\n`
            );
          }
        }
      }
      if (ordersModel?.relationships.length) {
        lines.push(
          `**Order model relationships (${ordersModel.relationships.length})** — see key table detail above; \`driverAssigned\` / \`driver\` omit nested \`devices\` / \`vendor\` via \`->without()\`.\n\n`
        );
      }
    }

    lines.push('---\n\n');
  }

  lines.push(`### Cross-package ER diagram (key domain tables)\n\n`);
  lines.push(
    buildMermaidErDiagram(globalRegistry, DOMAIN_KEY_TABLES, null)
  );
  lines.push('\n\n');

  lines.push(`### Global totals\n\n`);
  lines.push(
    `| Metric | Count |\n|--------|-------|\n| **Foreign keys (\`foreign()\`)** | ${totalFk} |\n| **Logical UUID reference indexes** | ${totalLogical} |\n| **Indexes / uniques (all packages)** | ${totalIdx} |\n| **Eloquent relationships** | ${totalRels} |\n\n`
  );

  lines.push('---\n\n');

  return { totalFk, totalLogical, totalIdx, totalRels };
}

const dbStats = generatePartVIIIB(
  pkgData,
  lines,
  mdTable,
  section,
  readSafe,
  walkDir
);

function generatePartIX(lines, section) {
  lines.push(section('Part IX — Security, caching & hidden rules', 1));
  lines.push(`### Authorization

- **Permission catalog:** Part VII-B (Auth Schemas → \`fleetbase:create-permissions\`)
- **Route enforcement:** \`AuthorizationGuard\` on \`fleetbase.protected\` — checks \`{service} {action} {resource}\` (+ wildcards)
- **Query scoping:** Directives on roles/policies narrow list/query via \`applyDirectivesToQuery()\`
- **AdminGuard** for system admin routes
- **Impersonation:** \`POST /int/v1/auth/impersonate\` (admin only)

### Caching rules

- **MergeConfigFromSettings** — runtime mail/queue/filesystem config from DB settings
- **AttachCacheHeaders** — ETag + user cache TTLs
- **Response cache** — configurable per-route via Spatie response cache
- **Lookup caches** — e.g. Fleetbase blog, branding (refresh via protected lookup routes)

### Hidden / non-obvious behaviour

1. **Sandbox sync** — Production users/companies copied to sandbox hourly so test API keys never hit missing FK rows.
2. **RESTRegistrar** — Uses \`query\` not \`index\`; clients must use Fleetbase SDK/query param conventions.
3. **public_id** — External IDs are typically UUID-style \`public_id\`, not integer PKs.
4. **Soft deletes** — Many models use \`SoftDeletes\`; \`deleteRecord\` may set \`deleted_at\`.
5. **Company scope** — Missing company context on internal routes → 401/403.
6. **SMS bypass** — \`fleetbase.sms_auth_bypass_code\` only for non-production testing.
7. **Order custom actions** — FleetOps \`OrderController\` adds dispatch, cancel, bulk*, tracker, proofs, import — not part of standard REST.
8. **Registry auth** — Separate middleware stack; bundle upload routes are public with validation.
9. **Telematics webhooks** — Public \`webhooks/telematics/{providerKey}\` — provider-specific payload handling.
10. **MaterializeSchedulesJob** — Daily rebuild of schedule materializations for driver availability.

### Realtime

- **SocketCluster** — Channels for order updates, chat, notifications
- Console connects using config from \`GET /int/v1/auth/services\` bootstrap

---

`);
}

// Part IX (before X so document order matches navigation)
generatePartIX(lines, section);

// Part X — endpoint schemas
const schemaStats = generatePartXEndpointSchemas(pkgData, lines, mdTable, section);

function generatePartXI(packages, lines, mdTable, section) {
  const { rows, uiIndexCount } = buildTraceabilityMatrix(packages, ROOT);

  lines.push(section('Part XI — REQ ↔ API ↔ frontend traceability', 1));
  lines.push(`Cross-reference between **backend REST resources**, **internal API paths**, and **frontend UI specs** in \`a_uidocs/screens/\` / \`documents/LOW-LEVEL-REQUIREMENTS.md\`.

> **Regenerate:** \`node documents/_build-backend-llrd.mjs\` · **${uiIndexCount}** UI screen spec files indexed

### How to use

| Column | Meaning |
|--------|---------|
| **REQ ID** | Stable backend requirement key (\`BE-{package}-{resource}\`) |
| **Internal path** | Parsed list route from Part X (e.g. \`/int/v1/orders\`); package prefix may apply |
| **UI area** | Console navigation area (inferred) |
| **Master spec** | FleetOps detail tab master doc when applicable |
| **UI screens** | Matching \`a_uidocs/screens/**/*.md\` paths |
| **Frontend LLRD** | Screen slug for \`documents/LOW-LEVEL-REQUIREMENTS.md\` |

### Traceability matrix (REST resources)

${mdTable(
  [
    'REQ ID',
    'Package',
    'Resource',
    'Internal API',
    'UI area',
    'Master spec',
    'UI screen specs',
  ],
  rows.map((r) => [
    r.reqId,
    r.package,
    r.resource,
    r.internalPath,
    r.uiArea,
    r.masterSpec,
    r.uiScreens.length > 80 ? r.uiScreens.slice(0, 77) + '…' : r.uiScreens,
  ])
)}

### Frontend LLRD

Full Console UI requirements: [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md) (~469 screen specs). Behavior services: \`a_uidocs/behavior/services/*-actions.md\`.

---

`);

  return { traceRows: rows.length, uiIndexCount };
}

const traceStats = generatePartXI(pkgData, lines, mdTable, section);

function generatePartXIIIEngineeringOS(
  packages,
  pkgData,
  eventData,
  lines,
  mdTable,
  section,
  readSafe,
  archStats,
  runtimeStats,
  schemaStats
) {
  const { rows: traceRows } = buildTraceabilityMatrix(packages, ROOT);
  const jobData = buildJobCatalog(packages, readSafe, ROOT);
  const eventRuntime = buildEventRuntimeData(
    packages,
    eventData,
    readSafe,
    ROOT
  );
  const realtime = buildRealtimeCatalog(readSafe);

  const arch = buildArchitectureIntelligence({
    packages,
    pkgData,
    eventData,
    jobData,
    eventRuntime,
    realtime,
    readSafe,
    walkDir,
    repoRoot: ROOT,
  });

  const eng = buildEngineeringOS({
    packages,
    pkgData,
    eventData,
    jobData,
    eventRuntime,
    realtime,
    arch,
    traceRows,
    readSafe,
    repoRoot: ROOT,
    runtimeCoverage: runtimeStats.coveragePct,
    schemaStats,
  });

  const metaDir = path.join(__dirname, '_meta');
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
  exportEngineeringArtifacts(metaDir, fs, eng);

  lines.push(section('Part XIII — Engineering operating system', 1));
  lines.push(`**Semantic AST analysis**, call graphs, change-impact prediction, governance, security, performance, dead-code detection, and **AI-native indexing** — built on brace-aware PHP parsing (${eng.semantic.stats.files} files, ${eng.semantic.stats.symbols} symbols).

> AST dispatch edges: **${eng.astDispatchEdges}** (method-level) vs regex Part XII-A edges.

### Exports

| File | Purpose |
|------|---------|
| \`backend-callgraph.json\` | Symbol/call graph for impact tracing |
| \`backend-semantic-index.json\` | RAG/MCP chunks with tags & relations |
| \`backend-engineering-health.json\` | Platform health & readiness scores |

---

`);

  lines.push(section('Part XIII-A — Symbol & call graph (AST)', 1));
  lines.push(`${mdTable(
    ['Symbol', 'Type', 'References', 'Called by (sample)'],
    eng.callGraph.symbolRows.slice(0, 50).map((s) => [
      s.fqcn.split('\\').slice(-2).join('::'),
      s.type,
      String(s.references),
      s.calledBy.join(', ') || '—',
    ])
  )}

**Graph:** ${eng.callGraph.stats.nodes} nodes · ${eng.callGraph.stats.edges} edges

---

`);

  lines.push(section('Part XIII-B — Change impact analysis', 1));
  lines.push(`${mdTable(
    ['Entity', 'Downstream impact', 'Risk'],
    eng.impact.impacts.map((i) => [i.entity, i.summary, i.risk])
  )}

---

`);

  lines.push(section('Part XIII-C — Test coverage intelligence', 1));
  lines.push(`**${eng.tests.stats.testFiles}** test files indexed (api + packages).

${mdTable(
  ['Component', 'Test types', 'Coverage confidence'],
  eng.tests.rows.map((r) => [
    r.component,
    r.testType,
    `${r.coverageConfidence}%`,
  ])
)}

${eng.tests.untested.length ? `### Untested critical flows\n\n${eng.tests.untested.map((u) => `- **${u.component}** (${u.coverageConfidence}% confidence)`).join('\n')}\n\n` : ''}

---

`);

  lines.push(section('Part XIII-D — Performance hotspots', 1));
  lines.push(`${mdTable(
    ['Area', 'Severity', 'Reason'],
    eng.performance.hotspots.slice(0, 35).map((h) => [h.area, h.severity, h.reason])
  )}

---

`);

  lines.push(section('Part XIII-E — Security findings', 1));
  lines.push(`${mdTable(
    ['Severity', 'Area', 'Finding', 'Recommendation'],
    eng.security.findings.slice(0, 30).map((f) => [
      f.severity,
      f.area,
      f.finding,
      f.recommendation,
    ])
  )}

---

`);

  lines.push(section('Part XIII-F — Dead code & orphans', 1));
  lines.push(`${mdTable(
    ['Artifact', 'Status', 'Last reference'],
    eng.deadCode.artifacts.slice(0, 30).map((a) => [a.artifact, a.status, a.lastReference])
  )}

---

`);

  lines.push(section('Part XIII-G — Governance violations', 1));
  lines.push(`${mdTable(
    ['Rule', 'Severity', 'Location'],
    eng.governance.violations.slice(0, 30).map((v) => [v.rule, v.severity, v.location])
  )}

---

`);

  lines.push(section('Part XIII-H — AI semantic index', 1));
  lines.push(`**${eng.semanticIndex.stats.chunks}** chunks · types: ${eng.semanticIndex.stats.types.join(', ')}

Sample chunks:

${mdTable(
  ['ID', 'Type', 'Title', 'Tags'],
  eng.semanticIndex.chunks.slice(0, 25).map((c) => [
    c.id,
    c.type,
    c.title.slice(0, 50),
    c.tags.slice(0, 4).join(', '),
  ])
)}

---

`);

  lines.push(section('Part XIII-I — Refactor safety matrix', 1));
  lines.push(`${mdTable(
    ['Component', 'Coupling', 'Blast radius', 'Refactor risk'],
    eng.refactor.rows.slice(0, 25).map((r) => [
      r.component,
      r.coupling,
      String(r.blastRadius),
      r.refactorRisk,
    ])
  )}

---

`);

  lines.push(section('Platform health summary', 2));
  lines.push(`${mdTable(
    ['Area', 'Score %', 'Signals'],
    Object.entries(eng.health.areas).map(([area, v]) => [
      area,
      String(v.pct),
      String(v.count),
    ])
  )}

| Metric | Value |
|--------|-------|
| **Engineering readiness index** | ${eng.health.engineeringReadinessIndex}% |
| **AI readiness score** | ${eng.health.aiReadinessScore}% |
| **Maintainability score** | ${eng.health.maintainabilityScore}% |
| **Semantic files parsed** | ${eng.semantic.stats.files} |
| **Call graph edges** | ${eng.callGraph.stats.edges} |

---

`);

  return {
    readiness: eng.health.engineeringReadinessIndex,
    aiReadiness: eng.health.aiReadinessScore,
    callGraphEdges: eng.callGraph.stats.edges,
    semanticChunks: eng.semanticIndex.stats.chunks,
    eng,
    arch,
    jobData,
    eventRuntime,
  };
}

const engResult = generatePartXIIIEngineeringOS(
  PACKAGES,
  pkgData,
  eventData,
  lines,
  mdTable,
  section,
  readSafe,
  archStats,
  runtimeStats,
  schemaStats
);
const engStats = engResult;

function generatePartXIVPlatformIntelligence(
  packages,
  pkgData,
  lines,
  mdTable,
  section,
  engResult,
  schemaStats,
  runtimeStats,
  archStats
) {
  const metaDir = path.join(__dirname, '_meta');
  const plat = buildPlatformIntelligence({
    repoRoot: ROOT,
    metaDir,
    eng: engResult.eng,
    arch: engResult.arch,
    schemaStats,
    runtimeStats,
    archStats,
    jobData: engResult.jobData,
    eventRuntime: engResult.eventRuntime,
    pkgData,
  });

  lines.push(section('Part XIV — Platform intelligence & continuous governance', 1));
  lines.push(`Autonomous **change intelligence**, **drift detection**, **deployment risk**, **governance trends**, and **snapshot-based evolution** — regenerates \`documents/_meta/snapshots/\` on each build.

| Export | Purpose |
|--------|---------|
| \`backend-change-intelligence.json\` | Git churn & hot modules |
| \`backend-architecture-timeline.json\` | Temporal evolution |
| \`backend-platform-analytics.json\` | Maturity & risk scores |
| \`snapshots/latest.json\` | Diff vs previous run |

---

`);

  lines.push(section('Part XIV-A — Change intelligence', 1));
  lines.push(`${plat.changeIntel.stats.gitAvailable ? `Git churn (${plat.changeIntel.rows.length} components).` : 'Git unavailable — churn from snapshots only.'}

${mdTable(
  ['Component', 'Churn', 'Risk', 'Contributors'],
  plat.changeIntel.rows.slice(0, 30).map((r) => [
    r.component,
    String(r.churn),
    r.risk,
    r.contributors,
  ])
)}

\`\`\`mermaid
${plat.changeIntel.mermaid}
\`\`\`

---

`);

  lines.push(section('Part XIV-B — Architecture drift', 1));
  lines.push(`${mdTable(
    ['Severity', 'Expected', 'Actual', 'Location'],
    plat.drift.drifts.slice(0, 25).map((d) => [
      d.severity,
      d.expected,
      d.actual,
      d.location,
    ])
  )}

---

`);

  lines.push(section('Part XIV-C — Deployment risk prediction', 1));
  lines.push(`**Release risk:** ${plat.deploymentRisk.releaseRiskScore}% · **Production safety:** ${plat.deploymentRisk.productionSafetyScore}%

${mdTable(
  ['Component', 'Risk', 'Rollback', 'Criticality'],
  plat.deploymentRisk.rows.slice(0, 20).map((r) => [
    r.component,
    r.risk,
    r.rollbackDifficulty,
    r.criticality,
  ])
)}

---

`);

  lines.push(section('Part XIV-D — Temporal evolution', 1));
  lines.push(`${mdTable(
  ['Period', 'Major changes'],
  plat.timeline.entries.map((e) => [e.period, e.majorChanges])
)}

${plat.timeline.debtSignals.length ? `**Debt signals:** ${plat.timeline.debtSignals.join('; ')}\n\n` : ''}

\`\`\`mermaid
${plat.timeline.mermaid}
\`\`\`

---

`);

  lines.push(section('Part XIV-E — Governance trends', 1));
  lines.push(`**Governance score:** ${plat.governanceMonitor.governanceScore}%

${mdTable(
  ['Rule', 'Current', 'Trend', 'Status'],
  plat.governanceMonitor.rows.map((r) => [
    r.rule,
    String(r.current),
    r.trend,
    r.status,
  ])
)}

---

`);

  lines.push(section('Part XIV-F — Developer experience', 1));
  lines.push(`**Onboarding score:** ${plat.devx.onboardingScore}%

${mdTable(
  ['Area', 'Complexity', 'Discoverability', 'Maintainability'],
  plat.devx.areas.map((a) => [
    a.area,
    String(a.complexity),
    String(a.discoverability),
    String(a.maintainability),
  ])
)}

${plat.devx.overloadZones.length ? `**Cognitive overload zones:** ${plat.devx.overloadZones.join(', ')}\n\n` : ''}

---

`);

  lines.push(section('Part XIV-G — Documentation integrity', 1));
  lines.push(`**Integrity score:** ${plat.docValidator.integrityScore}%

${mdTable(
  ['Missing artifact', 'Severity', 'Suggested fix'],
  plat.docValidator.issues.slice(0, 20).map((i) => [
    i.missing,
    i.severity,
    i.suggestedFix,
  ])
)}

---

`);

  lines.push(section('Part XIV-H — Platform analytics', 1));
  lines.push(`${mdTable(
  ['Metric', 'Value'],
  Object.entries(plat.analytics.metrics).map(([k, v]) => [k, `${v}%`])
)}

| Index | Score |
|-------|-------|
| Engineering quality | ${plat.analytics.engineeringQualityIndex}% |
| Enterprise maturity | ${plat.analytics.enterpriseMaturity}% |
| Maintainability | ${plat.analytics.maintainabilityIndex}% |
| Platform sustainability | ${plat.analytics.platformSustainabilityScore}% |

---

`);

  lines.push(section('Part XIV-I — AI remediation recommendations', 1));
  lines.push(`${mdTable(
  ['Issue', 'Suggested refactor', 'Impact'],
  plat.remediation.items.slice(0, 20).map((i) => [
    i.issue.slice(0, 60),
    i.suggestedRefactor.slice(0, 70),
    i.estimatedImpact,
  ])
)}

---

`);

  lines.push(section('Part XIV-J — Continuous snapshot summary', 1));
  lines.push(`Snapshot saved to \`documents/_meta/snapshots/latest.json\`.

${plat.snapshotDiff.trend === 'baseline' ? '*First snapshot — run again to enable trend deltas.*' : `Compared to **${plat.snapshotDiff.previousAt?.slice(0, 10) || 'prior'}**: ${Object.entries(plat.snapshotDiff.deltas || {}).map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join(', ') || 'no numeric deltas'}`}

---

`);

  lines.push(section('Enterprise platform health dashboard', 2));
  lines.push(`${mdTable(
  ['Domain', 'Score'],
  Object.entries(plat.dashboard.domains).map(([k, v]) => [k, `${v}%`])
)}

| Metric | Value |
|--------|-------|
| **Platform maturity index** | ${plat.dashboard.platformMaturityIndex}% |
| **Engineering sustainability** | ${plat.dashboard.engineeringSustainability}% |
| **Enterprise readiness** | ${plat.dashboard.enterpriseReadiness}% |

---

`);

  return {
    platformMaturity: plat.dashboard.platformMaturityIndex,
    releaseRisk: plat.deploymentRisk.releaseRiskScore,
    governanceScore: plat.governanceMonitor.governanceScore,
  };
}

const platStats = generatePartXIVPlatformIntelligence(
  PACKAGES,
  pkgData,
  lines,
  mdTable,
  section,
  engResult,
  schemaStats,
  runtimeStats,
  archStats
);

// Appendix
lines.push(section('Appendix — Operations checklist', 1));
lines.push(`### Fresh install

1. \`composer install\` in \`api/\`
2. Configure \`.env\` (DB, Redis, APP_KEY)
3. \`GET /int/v1/installer/initialize\` → create DB → migrate → seed (installer API or artisan)
4. Run queue worker + scheduler + socket service

### Artisan commands (core-api)

\`Recovery\`, \`CreateDatabase\`, \`SeedDatabase\`, \`MigrateSandbox\`, \`SyncSandbox\`, \`CreatePermissions\`, \`AssignAdminRoles\`, \`Purge*Logs\`, \`MysqlS3Backup\`, \`TelemetryPing\`, \`QueueStatusCommand\`

### Cross-reference to frontend docs

- Console UI specs: \`documents/LOW-LEVEL-REQUIREMENTS.md\`
- Ember service actions: \`a_uidocs/behavior/services/*-actions.md\` map to controllers listed in Parts III–VI

---

*End of document. Regenerate with \`node documents/_build-backend-llrd.mjs\`.*
`);

const output = lines.join('');
// Patch header stats for Part X
const patched = output
  .replace(
    /\| \*\*Form request classes\*\* \| \(see Part X\) \|/,
    `| **Form request classes** | ${schemaStats.requestClassCount} |`
  )
  .replace(
    /\| \*\*Endpoint specs\*\* \| \(see Part X\) \|/,
    `| **Endpoint specs** | ${schemaStats.endpointCount} |`
  )
  .replace(
    /\| \*\*Foreign keys \(`foreign\(\)`\)\*\* \| \(see Part VIII-B\) \|/,
    `| **Foreign keys (\`foreign()\`)** | ${dbStats.totalFk} |`
  )
  .replace(
    /\| \*\*Logical UUID indexes\*\* \| \(see Part VIII-B\) \|/,
    `| **Logical UUID indexes** | ${dbStats.totalLogical} |`
  )
  .replace(
    /\| \*\*Eloquent relationships\*\* \| \(see Part VIII-B\) \|/,
    `| **Eloquent relationships** | ${dbStats.totalRels} |`
  )
  .replace(
    /\| \*\*Event → listener mappings\*\* \| \(see Part VII\) \|/,
    `| **Event → listener mappings** | ${eventStats.totalMappings} |`
  )
  .replace(
    /\| \*\*Auth schema catalogs\*\* \| \(see Part VII-B\) \|/,
    `| **Auth schema catalogs** | ${authStats.totalSchemas} schemas, ${authStats.totalResources} resources |`
  )
  .replace(
    /\| \*\*UI ↔ API traceability rows\*\* \| \(see Part XI\) \|/,
    `| **UI ↔ API traceability rows** | ${traceStats.traceRows} |`
  )
  .replace(
    /\| \*\*Runtime architecture coverage\*\* \| — \|/,
    `| **Runtime architecture coverage** | ${runtimeStats.coveragePct}% (see Runtime coverage summary) |`
  )
  .replace(
    /\| \*\*Architecture intelligence coverage\*\* \| — \|/,
    `| **Architecture intelligence coverage** | ${archStats.coveragePct}% (see Part XII; ${archStats.graphNodes} graph nodes) |`
  )
  .replace(
    /\| \*\*Engineering OS readiness\*\* \| — \|/,
    `| **Engineering OS readiness** | ${engStats.readiness}% (AI: ${engStats.aiReadiness}%; see Part XIII) |`
  )
  .replace(
    /\| \*\*Platform maturity index\*\* \| — \|/,
    `| **Platform maturity index** | ${platStats.platformMaturity}% (see Part XIV dashboard) |`
  );
fs.writeFileSync(OUT, patched, 'utf8');
const lineCount = patched.split('\n').length;
console.log(
  `Wrote ${OUT} (${lineCount} lines, ${schemaStats.endpointCount} endpoints, ${platStats.platformMaturity}% platform maturity, ${platStats.releaseRisk}% release risk, ${engStats.readiness}% eng OS, snapshots in _meta/snapshots/)`
);
