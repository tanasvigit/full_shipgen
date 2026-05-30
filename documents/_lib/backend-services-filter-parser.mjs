/**
 * Parses Http/Filter classes and model $filterParams for LLRD catalog.
 */

import path from 'node:path';

const SKIP_METHODS = new Set([
  '__construct',
  'queryForInternal',
  'queryForPublic',
  'apply',
  'getMethodCache',
]);

/**
 * @param {string} content
 */
export function parseFilterClass(content, file) {
  const className = content.match(/class\s+(\w+)/)?.[1] || path.basename(file, '.php');
  const modelGuess = className.replace(/Filter$/, '');

  const methods = [];
  for (const m of content.matchAll(
    /public\s+function\s+(\w+)\s*\([^)]*\)/g
  )) {
    const name = m[1];
    if (SKIP_METHODS.has(name)) continue;
    if (name.startsWith('__')) continue;
    methods.push(name);
  }

  const usesInternal = content.includes('queryForInternal');
  const usesPublic = content.includes('queryForPublic');

  return {
    className,
    file,
    modelGuess,
    filterMethods: methods.sort(),
    scopes: [
      usesInternal ? 'internal' : null,
      usesPublic ? 'public/consumable' : null,
    ].filter(Boolean),
  };
}

/**
 * @param {string} content
 */
export function parseModelFilterParams(content) {
  const m = content.match(/protected\s+\$filterParams\s*=\s*\[([\s\S]*?)\];/);
  if (!m) return [];
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
}

/**
 * @param {string} srcRoot
 * @param {(p: string) => string|null} readSafe
 * @param {(dir: string) => string[]} walkDirFn
 */
export function buildFilterCatalog(srcRoot, readSafe, walkDirFn) {
  const filterDir = path.join(srcRoot, 'Http/Filter').replace(/\\/g, '/');
  const files = walkDirFn(filterDir).filter((f) => f.endsWith('Filter.php'));
  const filters = files
    .map((file) => {
      const content = readSafe(file);
      if (!content) return null;
      return parseFilterClass(content, file);
    })
    .filter(Boolean);

  const modelFilterParams = [];
  const modelFiles = walkDirFn(path.join(srcRoot, 'Models'));
  for (const file of modelFiles) {
    const content = readSafe(file);
    if (!content) continue;
    const params = parseModelFilterParams(content);
    if (!params.length) continue;
    modelFilterParams.push({
      model: path.basename(file, '.php'),
      file,
      filterParams: params,
    });
  }

  return { filters, modelFilterParams };
}

/**
 * Lists notable Support/* service-style classes (not full Laravel utils).
 * @param {string} srcRoot
 * @param {(p: string) => string|null} readSafe
 * @param {(dir: string) => string[]} walkDirFn
 */
export function buildSupportServicesCatalog(srcRoot, readSafe, walkDirFn) {
  const supportDir = path.join(srcRoot, 'Support').replace(/\\/g, '/');
  const files = walkDirFn(supportDir).filter((f) => f.endsWith('.php'));
  const services = [];

  for (const file of files) {
    const content = readSafe(file);
    if (!content) continue;
    const className = content.match(/class\s+(\w+)/)?.[1];
    if (!className) continue;
    const namespace = content.match(/namespace\s+([^;]+)/)?.[1]?.trim();
    const methods = [];
    for (const m of content.matchAll(/public\s+(?:static\s+)?function\s+(\w+)/g)) {
      if (!m[1].startsWith('__')) methods.push(m[1]);
    }
    const doc = content.match(/\/\*\*([\s\S]*?)\*\//)?.[1];
    const summary = doc
      ?.split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, '').trim())
      .find((l) => l && !l.startsWith('@') && !l.startsWith('/'));
    services.push({
      className,
      fqcn: namespace ? `${namespace}\\${className}` : className,
      file,
      methodCount: methods.length,
      methods: methods.slice(0, 20),
      summary: summary?.slice(0, 120) || null,
    });
  }

  return services.sort((a, b) => a.className.localeCompare(b.className));
}
