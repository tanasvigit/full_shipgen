/**
 * Parses PHP Form Requests, API Resources, and Controllers for LLRD generation.
 */

import {
  parseValidationRules,
  parseConditionalValidation,
} from './backend-validation-parser.mjs';
import { parseResourceFile } from './backend-resource-parser.mjs';
import { getRouteMeta } from './backend-route-parser.mjs';

export { parseValidationRules, parseConditionalValidation } from './backend-validation-parser.mjs';

/** @param {string} content */
export function parsePhpClassName(content) {
  const m = content.match(/namespace\s+([^;]+);\s*[\s\S]*?class\s+(\w+)/);
  if (!m) return null;
  return `${m[1].trim()}\\${m[2]}`;
}

/** @param {string} content */
export function parseAuthorize(content) {
  const m = content.match(/function\s+authorize\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/);
  if (!m) return null;
  const body = m[1].trim();
  if (body.includes('return true')) return 'always';
  if (body.includes('return false')) return 'never';
  if (body.includes('Auth::can')) {
    const can = body.match(/Auth::can\(['"]([^'"]+)['"]\)/);
    return can ? `permission: ${can[1]}` : 'permission check';
  }
  if (body.includes('session()->has')) return 'session required';
  return body.replace(/\s+/g, ' ').slice(0, 120);
}

/** @param {string} content */
function extractFunctionBody(content, name) {
  const re = new RegExp(
    `function\\s+${name}\\s*\\([^)]*\\)(?:\\s*:\\s*\\w+)?\\s*\\{`,
    'm'
  );
  const m = content.match(re);
  if (!m) return '';
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') depth--;
    i++;
  }
  return content.slice(start, i - 1);
}

/** Extract bracket contents respecting depth */
function sliceBalancedBrackets(str, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < str.length; i++) {
    if (str[i] === '[') depth++;
    if (str[i] === ']') depth--;
    if (depth === 0) return str.slice(openIdx + 1, i);
  }
  return '';
}

/** @param {string} content */
export function parseFormRequest(content, relPath) {
  const className = parsePhpClassName(content) || relPath;
  const rulesBody = extractFunctionBody(content, 'rules');
  const messagesBody = extractFunctionBody(content, 'messages');
  const firstIf = rulesBody.search(/\bif\s*\(/);
  const staticRulesBody = firstIf >= 0 ? rulesBody.slice(0, firstIf) : rulesBody;
  const rules = parseValidationRules(staticRulesBody);
  const messages = [];
  const msgRe = /['"]([\w.]+)['"]\s*=>\s*['"]([^'"]+)['"]/g;
  let mm;
  while ((mm = msgRe.exec(messagesBody))) {
    messages.push({ key: mm[1], text: mm[2] });
  }
  const conditionalBranches = parseConditionalValidation(rulesBody);
  const hasConditional =
    conditionalBranches.length > 0 ||
    rulesBody.includes('if (') ||
    rulesBody.includes('if(');
  return {
    className,
    shortName: className.split('\\').pop(),
    relPath,
    authorize: parseAuthorize(content),
    rules,
    conditionalBranches,
    messages,
    hasConditional,
  };
}

function inferFieldMeta(line, key) {
  let scope = 'always';
  if (
    line.includes('$isInternal') ||
    line.includes('isInternalRequest') ||
    line.includes('Http::isInternalRequest')
  ) {
    scope = 'internal';
  } else if (line.includes('$this->when(') || line.includes('$this->whenLoaded(')) {
    scope = line.includes('isInternal') ? 'internal+conditional' : 'conditional';
  } else if (line.includes('isPublicRequest')) {
    scope = 'public';
  }

  let type = 'scalar';
  if (line.includes('::collection') || line.includes('.collection(')) {
    type = 'collection';
  } else if (/new\s+[\w\\]+/.test(line)) type = 'nested object';
  else if (line.includes('transformMorphResource')) type = 'morph';
  else if (line.includes('data_get(') || line.includes('Utils::createObject')) {
    type = 'object/json';
  } else if (line.includes('(bool)') || line.includes('boolean')) type = 'boolean';
  else if (line.includes('(int)') || line.includes('integer')) type = 'integer';

  return { key, scope, type };
}

/** @param {string} content */
export function parseResourceSchema(content) {
  const parsed = parseResourceFile(content);
  return {
    className: parsed.className,
    fields: parsed.fields.map((f) => ({
      key: f.key,
      scope: f.visibility,
      type: f.type,
    })),
  };
}

/**
 * Resolve API Resource class for a controller + route action.
 * @param {object} route
 * @param {Map} resourceMap
 * @param {object|null} ctrl
 * @param {boolean} preferIndex
 */
export function resolveResourceForEndpoint(
  route,
  resourceMap,
  ctrl,
  preferIndex = false
) {
  const routeMeta = getRouteMeta(route);
  const action = route.handler?.method || routeMeta.restAction || '';
  const isList =
    preferIndex ||
    action === 'queryRecord' ||
    action === 'query' ||
    (route.methods?.includes('GET') &&
      !route.path.includes('{id}') &&
      !route.path.match(/\/\{[^}]+\}$/));
  const isDetail =
    action === 'findRecord' ||
    action === 'find' ||
    action === 'createRecord' ||
    action === 'create' ||
    action === 'updateRecord' ||
    action === 'update';

  const tryKeys = (names) => {
    for (const name of names) {
      if (!name) continue;
      const short = name.split('\\').pop().replace(/::class$/, '');
      const hit =
        resourceMap.get(short) ||
        resourceMap.get(name) ||
        [...resourceMap.values()].find((r) =>
          r.className?.endsWith(`\\${short}`)
        );
      if (hit?.fields?.length) return hit;
    }
    return null;
  };

  if (ctrl?.full?.indexResource) {
    const idx = ctrl.full.indexResource.replace(/::class$/, '');
    const idxShort = idx.split('\\').pop();
    if (isList) {
      const hit = tryKeys([idxShort, idx]);
      if (hit) return { schema: hit, variant: 'index' };
    }
    if (isDetail) {
      const fullShort = idxShort.replace(/Index$/, '');
      const hit = tryKeys([fullShort, fullShort.replace(/Resource$/, '')]);
      if (hit) return { schema: hit, variant: 'detail' };
    }
  }

  if (routeMeta.resource) {
    const modelBase = modelBaseFromResource(routeMeta.resource);
    const hit = findResourceSchema(resourceMap, modelBase, isList && !isDetail);
    if (hit?.fields?.length) {
      return { schema: hit, variant: isList ? 'index' : 'detail' };
    }
    if (!isList) {
      const detail = findResourceSchema(resourceMap, modelBase, false);
      if (detail?.fields?.length) {
        return { schema: detail, variant: 'detail' };
      }
    }
  }

  if (ctrl?.class) {
    const base = ctrl.class.replace(/Controller$/, '');
    const hit = tryKeys([base, `${base}Resource`]);
    if (hit) return { schema: hit, variant: 'detail' };
  }

  if (ctrl?.full?.resource && typeof ctrl.full.resource === 'string') {
    const slug = ctrl.full.resource;
    const modelBase = modelBaseFromResource(
      slug.includes('-') ? slug : `${slug}s`
    );
    const hit = findResourceSchema(resourceMap, modelBase, isList);
    if (hit?.fields?.length) {
      return { schema: hit, variant: isList ? 'index' : 'detail' };
    }
  }

  return { schema: null, variant: null };
}

export function findResourceSchema(resourceMap, modelBase, index = false) {
  if (index) {
    return (
      resourceMap.get(modelBase) ||
      resourceMap.get(`${modelBase}Index`) ||
      [...resourceMap.values()].find((r) =>
        r.className?.includes(`\\Index\\${modelBase}`)
      ) ||
      [...resourceMap.values()].find((r) =>
        r.className?.endsWith(`\\${modelBase}`) &&
        r.className.includes('\\Index\\')
      )
    );
  }
  return (
    resourceMap.get(modelBase) ||
    [...resourceMap.values()].find(
      (r) =>
        r.className?.endsWith(`\\${modelBase}`) &&
        !r.className.includes('\\Index\\')
    )
  );
}

/** @param {string} content */
export function parseController(content) {
  const className = parsePhpClassName(content) || 'Unknown';
  const resourceProp = content.match(/\$resource\s*=\s*['"]?(\w+)['"]?/);
  const indexResource = content.match(
    /\$indexResource\s*=\s*([\w\\]+)(::class)?/
  );
  const createRequest = content.match(/\$createRequest\s*=\s*([\w\\]+)::class/);
  const updateRequest = content.match(/\$updateRequest\s*=\s*([\w\\]+)::class/);

  const methods = [];
  const re = /public\s+function\s+(\w+)\s*\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(content))) {
    const name = m[1];
    if (name.startsWith('__')) continue;
    const params = m[2]
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const pm = p.match(/(?:[\w\\]+)\s+(\$\w+)/);
        const typem = p.match(/^([\w\\]+)\s+\$/);
        return {
          raw: p,
          name: pm?.[1] || p,
          type: typem?.[1]?.replace(/^\\/, '') || null,
        };
      });
    const requestType = params.find(
      (p) => p.type && (p.type.includes('Request') || p.type.endsWith('Request'))
    )?.type;

    const usesManualValidation =
      name === 'createRecord' &&
      (content.includes('::createFrom($request)') ||
        content.includes('Validator::make'));

    methods.push({ name, params, requestType, usesManualValidation });
  }

  const requestImports = [];
  const importRe = /use\s+([\w\\]+Request);/g;
  let im;
  while ((im = importRe.exec(content))) {
    requestImports.push(im[1]);
  }

  return {
    className,
    shortName: className.split('\\').pop(),
    resource: resourceProp?.[1],
    indexResource: indexResource
      ? `${indexResource[1]}${indexResource[2] ? '::class' : ''}`
      : null,
    createRequest: createRequest?.[1],
    updateRequest: updateRequest?.[1],
    methods,
    requestImports,
  };
}

export function routeActionToMethod(action) {
  if (!action) return null;
  let a = action
    .replace(/\$controller\(/g, '')
    .replace(/['")]/g, '')
    .trim();
  if (a.includes('@')) return a.split('@')[1];
  if (a.includes('Controller')) return a.split('@').pop();
  // camelCase from kebab path segment
  return a;
}

export function resourceToControllerName(resource) {
  const singular = resource.replace(/-/g, '_').replace(/_s$/, '');
  const parts = resource.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  let name = parts.join('');
  if (name.endsWith('ies')) name = name.slice(0, -3) + 'y';
  else if (name.endsWith('s') && !name.endsWith('ss')) name = name.slice(0, -1);
  return name + 'Controller';
}

export function inferRequestClassNames(modelBase, namespace) {
  const ns = namespace.replace(/\\\\/g, '\\');
  return {
    create: `${ns}\\Http\\Requests\\Internal\\Create${modelBase}Request`,
    update: `${ns}\\Http\\Requests\\Internal\\Update${modelBase}Request`,
    createAlt: `${ns}\\Http\\Requests\\Create${modelBase}Request`,
    updateAlt: `${ns}\\Http\\Requests\\Update${modelBase}Request`,
  };
}

export function modelBaseFromResource(resource) {
  const parts = resource.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  let name = parts.join('');
  if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
  if (name.endsWith('s')) return name.slice(0, -1);
  return name;
}

/** Standard query params from HasApiControllerBehavior */
export const STANDARD_QUERY_PARAMS = [
  { name: 'limit', desc: 'Max records returned' },
  { name: 'page', desc: 'Page number' },
  { name: 'sort', desc: 'Sort fields e.g. sort=-created_at or sort=latest' },
  { name: 'single', desc: 'If true, return first match as single object' },
  { name: 'count / with_count', desc: 'Include relation counts' },
  { name: 'contain / with / expand', desc: 'Eager-load relations' },
  { name: '{field}', desc: 'Filter by column' },
  { name: '{field}_like', desc: 'LIKE filter' },
  { name: '{field}_gt / _gte / _lt / _lte', desc: 'Comparison filters' },
  { name: '{field}_in / _notIn', desc: 'Array membership' },
  { name: '{field}_isNull / _isNotNull', desc: 'Null checks' },
];

export const STANDARD_REST_ACTIONS = [
  {
    action: 'queryRecord',
    http: 'GET',
    pathSuffix: '',
    requestKey: null,
    responseWrap: 'collection',
  },
  {
    action: 'findRecord',
    http: 'GET',
    pathSuffix: '/{id}',
    requestKey: null,
    responseWrap: 'singular wrapped',
  },
  {
    action: 'createRecord',
    http: 'POST',
    pathSuffix: '',
    requestKey: 'create',
    responseWrap: 'singular',
  },
  {
    action: 'updateRecord',
    http: 'PUT',
    pathSuffix: '/{id}',
    requestKey: 'update',
    responseWrap: 'singular',
  },
  {
    action: 'deleteRecord',
    http: 'DELETE',
    pathSuffix: '/{id}',
    requestKey: null,
    responseWrap: 'success JSON or resource',
  },
];
