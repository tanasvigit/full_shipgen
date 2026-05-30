/**
 * Builds illustrative JSON samples from validation rules and API resource fields.
 */

import { getRouteMeta } from './backend-route-parser.mjs';

function sampleFromRule(ruleStr) {
  const r = String(ruleStr).toLowerCase();
  if (r.includes('uuid') || r.includes('exists:')) {
    return '00000000-0000-0000-0000-000000000001';
  }
  if (r.includes('email')) return 'user@example.com';
  if (r.includes('boolean')) return true;
  if (r.includes('integer') || r.includes('numeric')) return 1;
  if (r.includes('array')) return [];
  if (r.includes('json') || r.includes('object')) return {};
  if (r.includes('date')) return '2026-01-15T10:00:00Z';
  if (r.includes('in:')) {
    const opts = r.match(/in:([^|]+)/)?.[1]?.split(',') || [];
    return opts[0]?.replace(/['"]/g, '').trim() || 'value';
  }
  if (r.includes('required')) return 'string';
  return 'string';
}

function sampleFromField(field) {
  const k = field.key;
  if (k === 'uuid' || k.endsWith('_uuid')) {
    return '00000000-0000-0000-0000-000000000001';
  }
  if (k === 'public_id' || k === 'id') return 'abc123';
  if (k.includes('_at')) return '2026-01-15T10:00:00Z';
  if (field.type === 'boolean') return false;
  if (field.type === 'integer') return 0;
  if (field.type === 'collection') return [];
  if (field.type === 'nested object' || field.type === 'morph') return {};
  if (field.type === 'object/json') return {};
  return '…';
}

/**
 * @param {{ field: string, rules: string }[]} rules
 * @param {string} [rootKey]
 */
export function buildSampleRequestBody(rules, rootKey) {
  const body = {};
  for (const { field, rules: ruleStr } of rules.slice(0, 35)) {
    const parts = field.split('.');
    let cur = body;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      if (i === parts.length - 1) {
        cur[key] = sampleFromRule(ruleStr);
      } else {
        if (typeof cur[key] !== 'object' || cur[key] === null) {
          cur[key] = {};
        }
        cur = cur[key];
      }
    }
  }
  if (rootKey) return { [rootKey]: body };
  return body;
}

/**
 * @param {{ key: string, scope?: string, type?: string }[]} fields
 */
export function buildSampleResponseBody(fields, options = {}) {
  const { wrapSingular = false, wrapList = false, maxFields = 35 } = options;
  const obj = {};
  for (const f of (fields || []).slice(0, maxFields)) {
    obj[f.key] = sampleFromField(f);
  }
  if (wrapList) {
    return { data: [obj], meta: { total: 1, page: 1, limit: 50 } };
  }
  if (wrapSingular) {
    return { data: obj, status: 'success' };
  }
  return obj;
}

export function formatJsonBlock(obj) {
  return '```json\n' + JSON.stringify(obj, null, 2) + '\n```';
}

/** High-traffic endpoints always get samples when rules/fields exist. */
export const SAMPLE_ENDPOINT_PRIORITY = [
  { pkg: 'core-api', pathIncludes: '/auth/login', method: 'POST' },
  { pkg: 'core-api', pathIncludes: '/auth/session', method: 'GET' },
  { pkg: 'core-api', pathIncludes: '/int/v1/users', method: 'POST' },
  { pkg: 'fleetops', pathIncludes: '/orders', method: 'POST' },
  { pkg: 'fleetops', pathIncludes: '/orders', method: 'GET' },
  { pkg: 'fleetops', pathIncludes: 'dispatch', method: 'PATCH' },
  { pkg: 'fleetops', pathIncludes: 'update-activity', method: 'PATCH' },
  { pkg: 'storefront', pathIncludes: '/checkouts', method: 'POST' },
  { pkg: 'registry-bridge', pathIncludes: '/bundle-upload', method: 'POST' },
];

export function shouldEmitSample(pkgId, route, actionName) {
  if (
    SAMPLE_ENDPOINT_PRIORITY.some((p) => {
      if (p.pkg !== pkgId) return false;
      if (p.pathIncludes && !route.path.includes(p.pathIncludes)) return false;
      if (p.method && !route.methods.includes(p.method)) return false;
      if (p.action && p.action !== actionName) return false;
      return true;
    })
  ) {
    return true;
  }
  const action = actionName || '';
  const { restAction } = getRouteMeta(route);
  if (
    restAction === 'createRecord' ||
    restAction === 'updateRecord' ||
    action === 'create' ||
    action === 'update' ||
    action === 'login' ||
    action === 'signUp'
  ) {
    return true;
  }
  return false;
}

/** Emit samples when we have enough schema data (broader than priority-only). */
export function shouldEmitSampleExpanded(
  pkgId,
  route,
  actionName,
  request,
  response
) {
  if (shouldEmitSample(pkgId, route, actionName)) return true;
  if (request?.rules?.length >= 3) return true;
  if (response?.fields?.length >= 5) return true;
  return false;
}
