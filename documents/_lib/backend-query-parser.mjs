/**
 * ORM / query intelligence from Eloquent models.
 */

import { walkPhpFiles, parsePhpClassName, extractFunctionBody } from './backend-php-utils.mjs';

const REL_RE =
  /function\s+(\w+)\s*\([^)]*\)\s*(?::\s*[\w\\|]+\s*)?\{[^}]*return\s+\$this->(belongsTo|hasMany|hasOne|belongsToMany|morphTo|morphMany|morphOne)\s*\(/g;

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildQueryIntelligence(repoRoot, packages, readSafe) {
  const models = [];

  for (const pkg of packages) {
    for (const rel of walkPhpFiles(repoRoot, `${pkg.srcRoot}/Models`)) {
      const content = readSafe(rel);
      if (!content) continue;
      const className = parsePhpClassName(content) || rel;
      const relationships = [];
      let m;
      const relRe = new RegExp(REL_RE.source, 'g');
      while ((m = relRe.exec(content))) {
        relationships.push({ name: m[1], type: m[2] });
      }

      const scopes = [...content.matchAll(/function\s+scope(\w+)\s*\(/g)].map((x) => x[1]);
      const withLoads = [...content.matchAll(/->with\s*\(\s*\[([^\]]+)\]/g)].map((x) => x[1]);
      const joins = (content.match(/->join\s*\(/g) || []).length;
      const rawSql = (content.match(/DB::raw|whereRaw|selectRaw/g) || []).length;
      const transactions =
        (content.match(/DB::transaction|beginTransaction/g) || []).length;
      const globalScopes = content.includes('addGlobalScope');
      const companyScoped =
        content.includes('company_uuid') || scopes.some((s) => /company/i.test(s));

      const risks = [];
      if (relationships.length > 12) risks.push('many relationships');
      if (withLoads.length > 5) risks.push('heavy eager-load patterns');
      if (relationships.length > 8 && withLoads.length === 0)
        risks.push('N+1 risk (many relations, few with())');
      if (!companyScoped && className.includes('FleetOps'))
        risks.push('verify tenant scope');
      if (transactions > 3) risks.push('nested transaction usage');

      models.push({
        model: className.split('\\').pop(),
        className,
        package: pkg.label,
        file: rel,
        relationships,
        scopes,
        eagerLoadHints: withLoads.length,
        joins,
        rawSql,
        transactions,
        globalScopes,
        companyScoped,
        risks,
      });
    }
  }

  const priority = models.filter((m) =>
    ['Order', 'Driver', 'Payment', 'Product', 'Customer', 'Vehicle', 'User'].some(
      (p) => m.model === p || m.model.includes(p)
    )
  );

  return {
    models: models.sort((a, b) => b.relationships.length - a.relationships.length),
    priority,
    stats: {
      models: models.length,
      withRisk: models.filter((m) => m.risks.length).length,
    },
  };
}
