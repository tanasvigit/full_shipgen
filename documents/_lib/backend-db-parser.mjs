/**
 * Parses Laravel migrations (FK, indexes) and Eloquent model relationships.
 */

function extractFunctionBody(content, name) {
  const re = new RegExp(
    `function\\s+${name}\\s*\\([^)]*\\)(?:\\s*:\\s*\\w+)?\\s*\\{`,
    'm'
  );
  const m = content.match(re);
  if (!m) return content;
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

/** @typedef {{ table: string, columns: Map<string, object>, indexes: object[], foreignKeys: object[], migrations: string[], isAlter: boolean }} TableSchema */

/**
 * @param {string} content
 * @param {string} file
 * @returns {{ creates: object[], alters: object[] }}
 */
export function parseMigrationFile(content, file) {
  const upBody = extractFunctionBody(content, 'up') || content;
  const creates = [];
  const alters = [];

  for (const m of upBody.matchAll(/Schema::create\s*\(\s*['"]([^'"]+)['"]/g)) {
    creates.push(m[1]);
  }
  for (const m of upBody.matchAll(/Schema::table\s*\(\s*['"]([^'"]+)['"]/g)) {
    alters.push(m[1]);
  }

  const foreignKeys = [];
  const fkRe =
    /\$table->foreign\s*\(\s*['"]([^'"]+)['"]\s*\)\s*->references\s*\(\s*['"]([^'"]+)['"]\s*\)\s*->on\s*\(\s*['"]([^'"]+)['"]\s*\)(?:\s*->onUpdate\s*\(\s*['"]([^'"]+)['"]\s*\))?(?:\s*->onDelete\s*\(\s*['"]([^'"]+)['"]\s*\))?/gi;
  let fm;
  while ((fm = fkRe.exec(upBody))) {
    foreignKeys.push({
      column: fm[1],
      references: fm[2],
      on: fm[3],
      onDelete: fm[5] || fm[4] || 'restrict',
      file,
    });
  }

  const fkArrayRe =
    /\$table->foreign\s*\(\s*\[\s*['"]([^'"]+)['"]\s*\]\s*\)\s*->references\s*\(\s*\[\s*['"]([^'"]+)['"]\s*\]\s*\)\s*->on\s*\(\s*['"]([^'"]+)['"]\s*\)(?:\s*->onUpdate\s*\(\s*['"]([^'"]+)['"]\s*\))?(?:\s*->onDelete\s*\(\s*['"]([^'"]+)['"]\s*\))?/gi;
  while ((fm = fkArrayRe.exec(upBody))) {
    foreignKeys.push({
      column: fm[1],
      references: fm[2],
      on: fm[3],
      onDelete: fm[5] || fm[4] || 'restrict',
      file,
    });
  }

  const constrainedRe =
    /\$table->foreignUuid\s*\(\s*['"]([^'"]+)['"]\s*\)[^;]*->constrained\s*\(\s*['"]([^'"]+)['"]\s*\)(?:\s*->onDelete\s*\(\s*['"]([^'"]+)['"]\s*\))?/g;
  while ((fm = constrainedRe.exec(upBody))) {
    foreignKeys.push({
      column: fm[1],
      references: 'uuid',
      on: fm[2],
      onDelete: fm[3] || 'restrict',
      file,
    });
  }

  const indexes = [];
  const uniqueRe =
    /\$table->unique\s*\(\s*\[([^\]]+)\](?:\s*,\s*['"]([^'"]+)['"]\s*)?\)/g;
  while ((fm = uniqueRe.exec(upBody))) {
    const cols = [...fm[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    indexes.push({
      type: 'unique',
      columns: cols,
      name: fm[2] || null,
      file,
    });
  }

  const indexArrayRe =
    /\$table->index\s*\(\s*\[([^\]]+)\](?:\s*,\s*['"]([^'"]+)['"]\s*)?\)/g;
  while ((fm = indexArrayRe.exec(upBody))) {
    const cols = [...fm[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
    indexes.push({
      type: 'index',
      columns: cols,
      name: fm[2] || null,
      file,
    });
  }

  const foreignUuidRefRe =
    /\$table->foreignUuid\s*\(\s*['"]([^'"]+)['"]\s*\)[^;]*?->references\s*\(\s*['"]([^'"]+)['"]\s*\)\s*->on\s*\(\s*['"]([^'"]+)['"]\s*\)(?:\s*->onDelete\s*\(\s*['"]([^'"]+)['"]\s*\))?/gi;
  while ((fm = foreignUuidRefRe.exec(upBody))) {
    foreignKeys.push({
      column: fm[1],
      references: fm[2],
      on: fm[3],
      onDelete: fm[4] || 'restrict',
      file,
    });
  }

  const logicalUuidIndexes = [];
  const logicalRe =
    /\$table->\w+\s*\(\s*['"](\w*_uuid)['"][^)]*\)([^;]*)->index\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((fm = logicalRe.exec(upBody))) {
    if (fm[3].includes('foreign') || fm[3].endsWith('_foreign')) {
      logicalUuidIndexes.push({
        column: fm[1],
        indexName: fm[3],
        file,
      });
    }
  }

  const colLineRe = /\$table->(\w+)\s*\(([^;]*)\)([^;]*);/g;
  while ((fm = colLineRe.exec(upBody))) {
    const colType = fm[1];
    const args = fm[2];
    const chain = fm[3];
    const colMatch = args.match(/['"]([^'"]+)['"]/);
    if (!colMatch) continue;
    const column = colMatch[1];

    if (chain.includes('->index(')) {
      const nameM = chain.match(/->index\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      indexes.push({
        type: 'index',
        columns: [column],
        name: nameM?.[1] || null,
        file,
      });
    }
    if (chain.includes('->unique()')) {
      indexes.push({
        type: 'unique',
        columns: [column],
        name: null,
        file,
      });
    }
    if (chain.includes('->primary()')) {
      indexes.push({
        type: 'primary',
        columns: [column],
        name: null,
        file,
      });
    }
  }

  const tables = [...creates, ...alters];
  return {
    creates,
    alters,
    foreignKeys: foreignKeys.map((fk) => ({
      ...fk,
      tables: tables.length === 1 ? tables[0] : null,
    })),
    logicalUuidIndexes: logicalUuidIndexes.map((li) => ({
      ...li,
      tables: tables.length === 1 ? tables[0] : null,
    })),
    indexes: indexes.map((idx) => ({
      ...idx,
      tables: tables.length === 1 ? tables[0] : null,
    })),
  };
}

/**
 * Merge migration parse results into package table registry.
 * @param {Map<string, TableSchema>} registry
 */
export function mergeMigrationIntoRegistry(registry, parsed, file, targetTables) {
  const assignFkIdx = (tableName) => {
    if (!registry.has(tableName)) {
      registry.set(tableName, {
        table: tableName,
        foreignKeys: [],
        logicalUuidIndexes: [],
        indexes: [],
        migrations: [],
      });
    }
    const entry = registry.get(tableName);
    if (!entry.migrations.includes(file)) entry.migrations.push(file);

    if (!entry.logicalUuidIndexes) entry.logicalUuidIndexes = [];

    for (const fk of parsed.foreignKeys) {
      entry.foreignKeys.push({ ...fk, table: tableName });
    }
    for (const li of parsed.logicalUuidIndexes || []) {
      entry.logicalUuidIndexes.push({ ...li, table: tableName });
    }
    for (const idx of parsed.indexes) {
      entry.indexes.push({ ...idx, table: tableName });
    }
  };

  for (const t of parsed.creates) assignFkIdx(t);
  for (const t of parsed.alters) assignFkIdx(t);

  if (parsed.creates.length === 0 && parsed.alters.length === 0) {
    for (const fk of parsed.foreignKeys) {
      const t = fk.tables || targetTables?.[0];
      if (t) assignFkIdx(t);
    }
    for (const idx of parsed.indexes) {
      const t = idx.tables || targetTables?.[0];
      if (t) assignFkIdx(t);
    }
  }
}

/**
 * @param {string} migrationsDir relative or absolute - caller passes walkDir results
 * @param {(path: string) => string|null} readSafe
 */
export function buildSchemaRegistry(migrationFiles, readSafe) {
  /** @type {Map<string, TableSchema>} */
  const registry = new Map();

  for (const file of migrationFiles) {
    const content = readSafe(file);
    if (!content) continue;
    const parsed = parseMigrationFile(content, file);
    const targets = [...parsed.creates, ...parsed.alters];
    mergeMigrationIntoRegistry(registry, parsed, file, targets);
  }

  return registry;
}

function parseClassFromArg(arg) {
  const trimmed = arg.trim();
  const cls = trimmed.match(/([\w\\]+)::class/);
  if (cls) return cls[1].replace(/^\\/, '');
  return trimmed;
}

/** Strip ->without(), ->withTrashed(), etc. after the relationship call closes. */
function stripTrailingRelationModifiers(line) {
  let s = line.trim();
  const chainStart =
    /\)\s*->(without|withoutGlobalScopes|withTrashed|where|whereNull|latest|orderBy)\s*\(/;
  while (true) {
    const m = s.match(chainStart);
    if (!m || m.index === undefined) break;
    const openParen = m.index + m[0].length - 1;
    let depth = 1;
    let i = openParen + 1;
    while (i < s.length && depth > 0) {
      if (s[i] === '(') depth++;
      if (s[i] === ')') depth--;
      i++;
    }
    s = s.slice(0, m.index + 1) + s.slice(i);
  }
  return s;
}

function sanitizeColumnRef(arg) {
  if (!arg) return null;
  return arg
    .replace(/^['"]|['"]$/g, '')
    .replace(/\)+$/, '')
    .replace(/->.*$/, '')
    .trim();
}

/**
 * @param {string} content
 */
export function parseModelRelationships(content) {
  const tableMatch = content.match(/protected\s+\$table\s*=\s*['"]([^'"]+)['"]/);
  const classMatch = content.match(/namespace\s+([^;]+);[\s\S]*?class\s+(\w+)/);
  const modelClass = classMatch
    ? `${classMatch[1].trim()}\\${classMatch[2]}`
    : null;
  const table = tableMatch?.[1] || null;

  const relationships = [];
  let currentMethod = null;
  for (const line of content.split('\n')) {
    const methodStart = line.match(/public\s+function\s+(\w+)\s*\(/);
    if (methodStart && !line.includes('$this->') && !line.match(/^\s*\/\//)) {
      currentMethod = methodStart[1];
    }
    const normalized = stripTrailingRelationModifiers(line);
    const rel = parseRelationFromLine(normalized);
    if (rel && currentMethod) {
      relationships.push(
        parseRelationshipCall(currentMethod, rel.type, rel.argsStr)
      );
    }
  }

  return {
    modelClass,
    shortName: classMatch?.[2] || null,
    table,
    relationships,
  };
}

function parseRelationFromLine(line) {
  const m = line.match(
    /return\s+\$this->(belongsTo|hasMany|hasOne|hasManyThrough|belongsToMany|morphTo|morphMany|morphOne)\s*\(/
  );
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < line.length && depth > 0) {
    if (line[i] === '(') depth++;
    if (line[i] === ')') depth--;
    i++;
  }
  return { type: m[1], argsStr: line.slice(start, i - 1) };
}

function parseRelationshipCall(methodName, type, argsStr) {
  const args = splitPhpArgs(argsStr.trim());
  const rel = {
    method: methodName,
    type,
    related: null,
    foreignKey: null,
    localKey: null,
    pivot: null,
    morphType: null,
    morphId: null,
  };

  if (type === 'morphTo') {
    rel.morphType = sanitizeColumnRef(args[1]);
    rel.morphId = sanitizeColumnRef(args[2]);
    return rel;
  }

  if (args[0]) rel.related = parseClassFromArg(args[0]);
  if (args[1]) {
    const fk = sanitizeColumnRef(args[1]);
    if (fk?.includes('::class')) {
      rel.pivot = parseClassFromArg(args[1]);
    } else {
      rel.foreignKey = fk;
    }
  }
  if (args[2]) {
    const lk = sanitizeColumnRef(args[2]);
    if (lk?.includes('::class')) {
      rel.pivot = rel.pivot || parseClassFromArg(args[2]);
    } else {
      rel.localKey = lk;
    }
  }

  return rel;
}

/** Drop logical UUID rows when a real FK exists on the same table/column. */
export function dedupeLogicalAgainstForeignKeys(schema) {
  const fkCols = new Set(
    (schema.foreignKeys || []).map((fk) => fk.column)
  );
  return (schema.logicalUuidIndexes || []).filter(
    (li) => !fkCols.has(li.column)
  );
}

export function formatRelationshipFk(rel) {
  if (rel.type === 'morphTo') {
    return rel.morphId || '—';
  }
  if (rel.pivot && !rel.foreignKey) {
    return `via ${rel.pivot.split('\\').pop()}`;
  }
  if (rel.foreignKey) return rel.foreignKey;
  if (rel.localKey) return rel.localKey;
  return '—';
}

function splitPhpArgs(s) {
  const args = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

export function inferRelatedTable(relatedClass, registry) {
  if (!relatedClass) return null;
  const short = relatedClass.split('\\').pop();
  if (!short) return null;
  const snake = short
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/_y$/, 'ie'); // rough
  const guesses = [
    snake + 's',
    snake.replace(/y$/, 'ies'),
    snake,
  ];
  for (const g of guesses) {
    if (registry.has(g)) return g;
  }
  return guesses[0];
}

/** Build mermaid erDiagram lines for key tables */
export function buildMermaidErDiagram(registry, keyTables, modelRels) {
  const lines = ['```mermaid', 'erDiagram'];
  const edges = new Set();

  for (const tableName of keyTables) {
    const schema = registry.get(tableName);
    if (schema) {
      for (const fk of schema.foreignKeys) {
        if (keyTables.has(fk.on) || keyTables.has(tableName)) {
          const label = `${fk.column} -> ${fk.references}`;
          edges.add(
            `    ${fk.on} ||--o{ ${tableName} : "${label}"`
          );
        }
      }
    }
  }

  for (const tableName of keyTables) {
    lines.push(`    ${tableName} {`);
    lines.push(`        string uuid`);
    lines.push(`        string company_uuid`);
    lines.push(`    }`);
  }

  for (const e of [...edges].sort()) lines.push(e);
  lines.push('```');
  return lines.join('\n');
}

export function buildModelRelationshipIndex(modelFiles, readSafe) {
  const byTable = new Map();
  const all = [];
  for (const file of modelFiles) {
    const content = readSafe(file);
    if (!content) continue;
    const parsed = parseModelRelationships(content);
    if (!parsed.table && !parsed.relationships.length) continue;
    const entry = { ...parsed, file };
    all.push(entry);
    if (parsed.table) byTable.set(parsed.table, entry);
  }
  return { byTable, all };
}

export const DOMAIN_KEY_TABLES = new Set([
  'users',
  'companies',
  'company_users',
  'company_user',
  'orders',
  'drivers',
  'vehicles',
  'places',
  'payloads',
  'entities',
  'routes',
  'order_configs',
  'contacts',
  'vendors',
  'fleets',
  'api_credentials',
  'webhook_endpoints',
  'extensions',
  'products',
  'stores',
  'customers',
  'carts',
  'checkouts',
  'invoices',
  'accounts',
  'wallets',
  'transactions',
]);
