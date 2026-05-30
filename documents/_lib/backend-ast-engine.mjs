/**
 * PHP semantic parser (brace-aware structure + call extraction).
 * AST-style analysis without external PHP runtime — upgrade path to nikic/php-parser JSON bridge.
 */

import { extractFunctionBody, parsePhpClassName } from './backend-php-utils.mjs';

const PRIORITY_DIRS = [
  'Http/Controllers',
  'Jobs',
  'Listeners',
  'Events',
  'Models',
  'Providers',
  'Policies',
  'Http/Middleware',
];

/**
 * @param {string} content
 * @param {string} relPath
 */
export function parsePhpSemantic(content, relPath) {
  const namespace = content.match(/namespace\s+([^;]+);/)?.[1]?.trim() || '';
  const uses = [...content.matchAll(/^use\s+([^;]+);/gm)].map((m) => m[1].trim());

  const traits = [...content.matchAll(/^\s*use\s+([\w\\]+)\s*;/gm)]
    .map((m) => m[1])
    .filter((u) => !u.includes('\\') || uses.some((full) => full.endsWith(u)));

  const classes = [];
  const classRe =
    /(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+([\w\\]+))?(?:\s+implements\s+([\w\s,\\]+))?/g;
  let cm;
  while ((cm = classRe.exec(content))) {
    const className = cm[1];
    const fqcn = namespace ? `${namespace}\\${className}` : className;
    const extends_ = cm[2]?.replace(/^\\+/, '') || null;
    const implements_ = cm[3]
      ? cm[3].split(',').map((s) => s.trim().replace(/^\\+/, ''))
      : [];

    const methods = extractMethods(content, className);
    classes.push({
      name: className,
      fqcn,
      extends: extends_,
      implements: implements_,
      traits,
      methods,
    });
  }

  return {
    relPath,
    namespace,
    uses,
    classes,
    fqcn: parsePhpClassName(content),
    priority: PRIORITY_DIRS.some((d) => relPath.includes(d)),
  };
}

function extractMethods(content, className) {
  const methods = [];
  const re =
    /(?:public|protected|private)\s+(?:static\s+)?function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[\w\\|?,\s]+)?\s*\{/g;
  let m;
  while ((m = re.exec(content))) {
    const name = m[1];
    if (name === '__construct' || name.startsWith('__')) continue;
    const body = extractFunctionBody(content, name);
    if (!body) continue;
    methods.push({
      name,
      calls: extractCalls(body),
      dispatches: extractDispatches(body),
      events: extractEvents(body),
      lineCount: body.split('\n').length,
    });
  }
  return methods;
}

function extractCalls(body) {
  const calls = [];
  const seen = new Set();

  for (const m of body.matchAll(/([\w\\]+)::(\w+)\s*\(/g)) {
    const key = `${m[1]}::${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    calls.push({ kind: 'static', class: m[1], method: m[2] });
  }

  for (const m of body.matchAll(/\$this->(\w+)\s*\(/g)) {
    const key = `$this->${m[1]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    calls.push({ kind: 'instance', method: m[1] });
  }

  for (const m of body.matchAll(/(?:app|resolve)\s*\(\s*([\w\\]+)::class\s*\)/g)) {
    calls.push({ kind: 'container', class: m[1], method: 'resolve' });
  }

  return calls;
}

function extractDispatches(body) {
  const out = [];
  for (const m of body.matchAll(
    /(?:dispatch|Bus::dispatch)\s*\(\s*(?:new\s+)?\\?([\w\\]+)/g
  )) {
    const t = m[1];
    if (t && t !== 'true' && t !== 'false') out.push(t.replace(/^\\+/, ''));
  }
  for (const m of body.matchAll(/(\w+Job)::dispatch\s*\(/g)) {
    out.push(m[1]);
  }
  return [...new Set(out)];
}

function extractEvents(body) {
  const out = [];
  for (const m of body.matchAll(/event\s*\(\s*(?:new\s+)?\\?([\w\\]+)/g)) {
    out.push(m[1].replace(/^\\+/, ''));
  }
  return [...new Set(out)];
}

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 * @param {import('./backend-php-utils.mjs').walkPhpFiles} walkPhpFiles
 */
export function buildSemanticIndex(repoRoot, packages, readSafe, walkPhpFiles) {
  const files = [];
  const symbols = new Map();

  for (const pkg of packages) {
    for (const rel of walkPhpFiles(repoRoot, pkg.srcRoot)) {
      if (!isAnalyzable(rel)) continue;
      const content = readSafe(rel);
      if (!content || !content.includes('class ')) continue;
      const parsed = parsePhpSemantic(content, rel);
      files.push({ ...parsed, package: pkg.id });

      for (const cls of parsed.classes) {
        symbols.set(cls.fqcn, {
          type: 'class',
          fqcn: cls.fqcn,
          file: rel,
          package: pkg.id,
          methods: cls.methods.map((m) => m.name),
        });
        for (const method of cls.methods) {
          const mid = `${cls.fqcn}::${method.name}`;
          symbols.set(mid, {
            type: 'method',
            fqcn: mid,
            file: rel,
            package: pkg.id,
            calls: method.calls,
            dispatches: method.dispatches,
            events: method.events,
          });
        }
      }
    }
  }

  return {
    files,
    symbols,
    stats: {
      files: files.length,
      symbols: symbols.size,
      priorityFiles: files.filter((f) => f.priority).length,
    },
  };
}

function isAnalyzable(rel) {
  return (
    rel.endsWith('.php') &&
    !rel.includes('/tests/') &&
    !rel.includes('/vendor/') &&
    !rel.includes('/migrations/')
  );
}
