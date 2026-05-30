/**
 * Deep parser for Laravel JsonResource toArray() — recursive fields, nesting, visibility.
 */

import fs from 'node:fs';
import path from 'node:path';

const MAX_DEPTH = 6;
const MAX_FIELDS_PER_RESOURCE = 120;
const MAX_FLATTENED = 200;

/** @param {string} content */
function extractFunctionBody(content, name) {
  const re = new RegExp(
    `function\\s+${name}\\s*\\([^)]*\\)(?:\\s*:\\s*[\\w\\\\|]+)?\\s*\\{`,
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

/** @param {string} content */
export function parsePhpClassName(content) {
  const m = content.match(/namespace\s+([^;]+);\s*[\s\S]*?class\s+(\w+)/);
  if (!m) return null;
  return `${m[1].trim()}\\${m[2]}`;
}

function unwrapToArrayBody(body) {
  let b = body.trim();
  const wrap = b.match(/return\s+\$this->withCustomFields\s*\(\s*\[([\s\S]*)\]\s*\)/);
  if (wrap) return wrap[1];
  const ret = b.match(/return\s*\[([\s\S]*)\]\s*;/);
  if (ret) return ret[1];
  const parent = b.match(/return\s+parent::toArray/);
  if (parent) return null;
  return b;
}

function inferVisibility(expr) {
  const e = expr.replace(/\s+/g, ' ');
  if (e.includes('isInternalRequest') || e.includes('$isInternal')) return 'internal';
  if (e.includes('isPublicRequest')) return 'public';
  const wl = e.match(/whenLoaded\s*\(\s*['"](\w+)['"]/);
  if (wl) return `when_loaded:${wl[1]}`;
  if (e.includes('whenLoaded(')) return 'when_loaded';
  if (e.includes('$this->when(') || e.includes('->when(')) return 'conditional';
  return 'always';
}

function inferTypeFromExpr(expr) {
  const e = expr.replace(/\s+/g, ' ').trim();
  if (/::collection\s*\(/.test(e) || /\.collection\s*\(/.test(e))
    return { type: 'array', itemType: 'object', nullable: e.includes('null') };
  if (/transformMorphResource/.test(e)) return { type: 'object', nullable: true, morph: true };
  if (/new\s+([\w\\]+)\s*\(/.test(e)) {
    const cls = e.match(/new\s+([\w\\]+)\s*\(/)[1];
    return { type: 'object', resourceClass: cls.split('\\').pop(), nullable: true };
  }
  if (/\(bool\)/.test(e) || /boolean/.test(e)) return { type: 'boolean', nullable: true };
  if (/\(int\)/.test(e) || /integer/.test(e)) return { type: 'integer', nullable: true };
  if (/data_get|createObject|Utils::createObject/.test(e))
    return { type: 'object', nullable: true };
  if (/\?\?/.test(e) || /null/.test(e)) return { type: 'string', nullable: true };
  if (/_at/.test(e) && /\$this->/.test(e)) return { type: 'string', format: 'date-time', nullable: true };
  if (/_uuid/.test(e)) return { type: 'string', format: 'uuid', nullable: true };
  return { type: 'string', nullable: !e.includes('required') };
}

function exampleForField(key, typeInfo) {
  const k = key.split('.').pop();
  if (typeInfo.type === 'boolean') return false;
  if (typeInfo.type === 'integer') return 0;
  if (typeInfo.type === 'array') return [];
  if (typeInfo.format === 'uuid' || k.endsWith('_uuid')) {
    return '00000000-0000-0000-0000-000000000001';
  }
  if (k === 'public_id' || k === 'id') return 'ord_abc123';
  if (k.includes('_at')) return '2026-01-15T10:00:00Z';
  if (typeInfo.type === 'object') return {};
  if (k === 'status') return 'created';
  if (k === 'type') return 'default';
  return '…';
}

/** Extract top-level 'key' => expr entries from array body */
function extractArrayEntries(arrayBody) {
  const entries = [];
  const re = /['"]([\w]+)['"]\s*=>\s*/g;
  let m;
  while ((m = re.exec(arrayBody))) {
    const key = m[1];
    const valueStart = m.index + m[0].length;
    let depth = 0;
    let i = valueStart;
    let inStr = null;
    while (i < arrayBody.length) {
      const ch = arrayBody[i];
      if (inStr) {
        if (ch === '\\') {
          i += 2;
          continue;
        }
        if (ch === inStr) inStr = null;
        i++;
        continue;
      }
      if (ch === "'" || ch === '"') {
        inStr = ch;
        i++;
        continue;
      }
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      if (ch === ')' || ch === ']' || ch === '}') depth--;
      if (ch === ',' && depth === 0) break;
      i++;
    }
    const expr = arrayBody.slice(valueStart, i).trim();
    entries.push({ key, expr });
  }
  return entries;
}

/**
 * @param {string} content PHP file source
 * @param {string} filePath
 */
export function parseResourceFile(content, filePath = '') {
  const className = parsePhpClassName(content) || path.basename(filePath, '.php');
  const toArrayBody = extractFunctionBody(content, 'toArray');
  const inner = unwrapToArrayBody(toArrayBody);
  const entries = inner ? extractArrayEntries(inner) : [];
  const fields = [];

  for (const { key, expr } of entries) {
    const typeInfo = inferTypeFromExpr(expr);
    const visibility = inferVisibility(expr);
    let relationship = null;
    const wl = expr.match(/whenLoaded\s*\(\s*['"](\w+)['"]/);
    if (wl) relationship = wl[1];
    else if (typeInfo.resourceClass) relationship = key;

    fields.push({
      key,
      path: key,
      type: typeInfo.type,
      format: typeInfo.format || null,
      nullable: typeInfo.nullable !== false,
      visibility,
      relationship,
      resourceClass: typeInfo.resourceClass || null,
      morph: typeInfo.morph || false,
      description: relationship
        ? `Relation: ${relationship}`
        : typeInfo.morph
          ? 'Polymorphic relation'
          : visibility === 'internal'
            ? 'Internal request only'
            : '',
      example: exampleForField(key, typeInfo),
      itemType: typeInfo.itemType,
    });
  }

  fields.sort((a, b) => a.key.localeCompare(b.key));
  return {
    className,
    shortName: className.split('\\').pop(),
    filePath,
    fields,
    entryCount: entries.length,
  };
}

/**
 * Build registry from package src roots.
 * @param {string} srcRoot
 * @param {string} repoRoot
 */
export function buildResourceRegistry(srcRoot, repoRoot) {
  const absDir = path.join(repoRoot, srcRoot, 'Http/Resources');
  const registry = new Map();
  const warnings = [];

  if (!fs.existsSync(absDir)) return { registry, warnings, count: 0 };

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith('.php')) {
        const content = fs.readFileSync(full, 'utf8');
        if (!/extends\s+.*Resource/.test(content) && !/JsonResource/.test(content)) {
          continue;
        }
        const parsed = parseResourceFile(content, full);
        const base = ent.name.replace('.php', '');
        registry.set(parsed.className, parsed);
        registry.set(base, parsed);
        if (full.replace(/\\/g, '/').includes('/Index/')) {
          registry.set(`${base}Index`, parsed);
        }
      }
    }
  }
  walk(absDir);
  return { registry, warnings, count: registry.size };
}

/**
 * Resolve nested fields recursively.
 * @param {object} field
 * @param {Map} registry
 * @param {Set<string>} stack
 * @param {string} prefix
 */
function expandField(field, registry, stack, prefix, depth) {
  const path = prefix ? `${prefix}.${field.key}` : field.key;
  const out = [{ ...field, path }];

  if (depth >= MAX_DEPTH || !field.resourceClass) return out;

  const nested =
    registry.get(field.resourceClass) ||
    [...registry.values()].find(
      (r) => r.shortName === field.resourceClass && r.className
    );
  if (!nested?.className || stack.has(nested.className)) {
    if (stack.has(nested?.className)) {
      out[0].description = (out[0].description || '') + ' (circular ref truncated)';
    }
    return out;
  }

  stack.add(nested.className);
  for (const child of nested.fields.slice(0, 40)) {
    out.push(
      ...expandField(
        { ...child, key: child.key },
        registry,
        stack,
        path,
        depth + 1
      )
    );
  }
  stack.delete(nested.className);
  return out;
}

/**
 * Flatten resource schema for endpoint documentation.
 * @param {object} schema parsed resource
 * @param {Map} registry
 */
export function flattenResourceSchema(schema, registry) {
  if (!schema?.fields?.length) return [];
  const stack = new Set([schema.className]);
  const flat = [];
  const seen = new Set();

  for (const f of schema.fields) {
    for (const row of expandField(f, registry, stack, '', 0)) {
      if (seen.has(row.path)) continue;
      seen.add(row.path);
      flat.push(row);
      if (flat.length >= MAX_FLATTENED) break;
    }
    if (flat.length >= MAX_FLATTENED) break;
  }

  return flat.sort((a, b) => a.path.localeCompare(b.path));
}

export function schemaToResponseTable(flatFields) {
  return flatFields.map((f) => [
    f.path,
    f.format ? `${f.type} (${f.format})` : f.type,
    f.nullable ? 'yes' : 'no',
    [f.visibility, f.description].filter(Boolean).join(' — ') || '—',
  ]);
}

/**
 * Build nested example object from flat fields (top-level + one level nested).
 */
export function buildExampleFromSchema(flatFields, options = {}) {
  const { maxKeys = 40 } = options;
  const root = {};
  let count = 0;

  for (const f of flatFields) {
    if (count >= maxKeys) break;
    const parts = f.path.split('.');
    if (parts.length === 1) {
      root[f.key] = f.example;
      count++;
    } else if (parts.length === 2) {
      if (typeof root[parts[0]] !== 'object' || root[parts[0]] === null) {
        root[parts[0]] = {};
      }
      root[parts[0]][parts[1]] = f.example;
      count++;
    }
  }
  return root;
}

export function wrapPaginatedResponse(item, meta = {}) {
  return {
    data: [item],
    meta: {
      total: meta.total ?? 1,
      page: meta.page ?? 1,
      limit: meta.limit ?? 50,
      ...meta,
    },
    links: {
      first: null,
      last: null,
      prev: null,
      next: null,
    },
  };
}

export const ERROR_ENVELOPES = {
  validationInternal: {
    status: 422,
    body: { errors: ['The given data was invalid.'] },
  },
  validationPublic: {
    status: 422,
    body: { error: 'validation_error', errors: { field: ['Required.'] } },
  },
  notFound: {
    status: 404,
    body: { status: 'failed', message: 'Resource not found.' },
  },
  unauthorized: {
    status: 401,
    body: { status: 'failed', message: 'Unauthorized.' },
  },
};
