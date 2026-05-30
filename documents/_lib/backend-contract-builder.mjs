/**
 * Builds complete endpoint API contracts with confidence scoring.
 */

import {
  flattenResourceSchema,
  buildExampleFromSchema,
  wrapPaginatedResponse,
  ERROR_ENVELOPES,
  schemaToResponseTable,
} from './backend-resource-parser.mjs';
import {
  buildConditionalRulesTable,
} from './backend-validation-parser.mjs';
import { resolveResourceForEndpoint } from './backend-schema-parser.mjs';
import { getRouteMeta } from './backend-route-parser.mjs';

export const PRIORITY_ENDPOINT_PATTERNS = [
  { pkg: 'fleetops', path: '/int/v1/orders', methods: ['GET', 'POST', 'PUT', 'PATCH'] },
  { pkg: 'fleetops', path: '/int/v1/drivers', methods: ['GET', 'POST', 'PUT'] },
  { pkg: 'fleetops', path: '/int/v1/vehicles', methods: ['GET', 'POST', 'PUT'] },
  { pkg: 'core-api', path: '/int/v1/auth/login', methods: ['POST'] },
  { pkg: 'core-api', path: '/int/v1/auth/session', methods: ['GET'] },
  { pkg: 'storefront', path: 'checkout', methods: ['POST', 'GET'] },
  { pkg: 'ledger', path: 'invoice', methods: ['GET', 'POST'] },
  { pkg: 'ledger', path: 'payment', methods: ['GET', 'POST'] },
];

export function isPriorityEndpoint(pkgId, route) {
  return PRIORITY_ENDPOINT_PATTERNS.some((p) => {
    if (p.pkg !== pkgId) return false;
    if (!route.path.includes(p.path)) return false;
    if (p.methods && !route.methods.some((m) => p.methods.includes(m))) return false;
    return true;
  });
}

function inferAuth(route, request) {
  const mw = route.middleware || [];
  if (request?.authorize?.startsWith('permission:')) {
    return { type: 'permission', value: request.authorize.replace('permission: ', '') };
  }
  if (mw.some((m) => m.includes('protected'))) {
    return { type: 'session', value: 'fleetbase.protected (Sanctum + company scope)' };
  }
  if (mw.some((m) => m.includes('fleetbase.api'))) {
    return { type: 'api_key', value: 'HTTP Basic API credentials' };
  }
  if (mw.some((m) => m.includes('throttle')) && !mw.some((m) => m.includes('protected'))) {
    return { type: 'public', value: 'Throttled, no session' };
  }
  return { type: 'unknown', value: mw.join(', ') || '—' };
}

/**
 * @param {object} params
 */
export function buildEndpointContract(params) {
  const {
    pkgId,
    route,
    request,
    ctrl,
    resourceRegistry,
    resourceMap,
    actionName,
    httpMethod,
  } = params;

  const { schema, variant } = resolveResourceForEndpoint(route, resourceMap, ctrl);
  const flatFields = schema
    ? flattenResourceSchema(schema, resourceRegistry)
    : [];

  const action = actionName || route.handler?.method || '';
  const isList =
    action === 'queryRecord' ||
    action === 'query' ||
    (route.methods?.includes('GET') &&
      !route.path.includes('{id}') &&
      !/\/\{[^}]+\}$/.test(route.path));

  const paginated = isList && flatFields.length > 0;
  const auth = inferAuth(route, request);
  const conditionalTable = buildConditionalRulesTable(
    request?.rules,
    request?.conditionalBranches
  );

  let confidence = 0;
  if (schema?.className) confidence += 20;
  if (flatFields.length) {
    confidence += Math.min(45, Math.floor(flatFields.length * 0.8));
  }
  if (request?.className) confidence += 10;
  if (request?.rules?.length) confidence += Math.min(20, request.rules.length * 2);
  if (request?.conditionalBranches?.length) confidence += 5;
  if (conditionalTable.length) confidence += 5;
  if (auth.type !== 'unknown') confidence += 5;
  confidence = Math.min(100, confidence);

  const priority = isPriorityEndpoint(pkgId, route);

  const sampleItem = flatFields.length
    ? buildExampleFromSchema(flatFields, { maxKeys: priority ? 50 : 35 })
    : null;

  let sampleResponse = null;
  if (sampleItem) {
    sampleResponse = paginated
      ? wrapPaginatedResponse(sampleItem)
      : sampleItem;
  }

  const unresolved = [];
  const routeMeta = getRouteMeta(route);
  if (!schema?.className && routeMeta.resource) {
    unresolved.push(`Resource class for '${routeMeta.resource}'`);
  }
  if (request?.className && !request?.rules?.length && !request?.conditionalBranches?.length) {
    unresolved.push(`FormRequest ${request.className} has no parsed rules`);
  }

  return {
    pkgId,
    path: route.path,
    method: httpMethod,
    action: actionName,
    tier: route.tier,
    middleware: route.middleware,
    title: `${httpMethod} ${route.path} — ${actionName}`,
    handler: route.handlerString,
    request,
    response: {
      resourceClass: schema?.className || null,
      resourceVariant: variant,
      flatFields,
      responseTable: schemaToResponseTable(flatFields),
      paginated,
      wrap: paginated
        ? 'paginated collection'
        : isList
          ? 'collection'
          : 'resource object',
    },
    auth,
    conditionalTable,
    sampleResponse,
    confidence,
    priority,
    unresolved,
  };
}

export function scoreContractCompleteness(contracts) {
  const withResponse = contracts.filter((c) => c.response?.flatFields?.length > 0);
  const withRequest = contracts.filter((c) => c.request?.rules?.length > 0);
  const withSamples = contracts.filter((c) => c.sampleResponse);
  const highConfidence = contracts.filter((c) => c.confidence >= 70);
  const avg =
    contracts.length > 0
      ? contracts.reduce((s, c) => s + c.confidence, 0) / contracts.length
      : 0;

  return {
    total: contracts.length,
    withResponse: withResponse.length,
    withRequest: withRequest.length,
    withSamples: withSamples.length,
    highConfidence: highConfidence.length,
    avgConfidence: Math.round(avg),
    pctResponse: Math.round((withResponse.length / contracts.length) * 100) || 0,
    pctComplete: Math.round((highConfidence.length / contracts.length) * 100) || 0,
  };
}

export function formatErrorExamples() {
  return [
    { name: 'Validation (422)', ...ERROR_ENVELOPES.validationInternal },
    { name: 'Not found (404)', ...ERROR_ENVELOPES.notFound },
    { name: 'Unauthorized (401)', ...ERROR_ENVELOPES.unauthorized },
  ];
}
