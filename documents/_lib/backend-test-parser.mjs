/**
 * Test coverage intelligence (PHPUnit / Pest / package tests).
 */

import { walkPhpFiles, parsePhpClassName } from './backend-php-utils.mjs';

/**
 * @param {string} repoRoot
 * @param {(p: string) => string|null} readSafe
 */
export function buildTestIntelligence(repoRoot, readSafe) {
  const testRoots = [
    'api/tests',
    'packages/core-api/tests',
    'packages/fleetops/server/tests',
    'packages/storefront/server/tests',
    'packages/ledger/server/tests',
  ];

  const tests = [];
  for (const root of testRoots) {
    let files = [];
    try {
      files = walkPhpFiles(repoRoot, root);
    } catch {
      continue;
    }
    for (const rel of files) {
      const content = readSafe(rel);
      if (!content) continue;
      const type = rel.includes('Feature')
        ? 'feature'
        : rel.includes('Unit')
          ? 'unit'
          : 'integration';
      const targets = [];
      for (const m of content.matchAll(
        /(?:get|post|put|patch|delete|json)\s*\(\s*['"]([^'"]+)['"]/gi
      )) {
        targets.push(m[1]);
      }
      for (const m of content.matchAll(/([\w]+)::class/g)) {
        if (m[1] !== 'class') targets.push(m[1]);
      }
      tests.push({
        file: rel,
        type,
        className: parsePhpClassName(content),
        targets: [...new Set(targets)],
        hasQueue: /Queue::fake|Bus::fake/.test(content),
        hasEvent: /Event::fake/.test(content),
      });
    }
  }

  const componentMap = new Map();

  const critical = [
    { component: 'Order API', patterns: ['order', 'Order'] },
    { component: 'Auth', patterns: ['auth', 'login', 'sanctum'] },
    { component: 'Payment / Ledger', patterns: ['payment', 'ledger', 'stripe'] },
    { component: 'Webhooks', patterns: ['webhook'] },
    { component: 'Jobs (async)', patterns: ['Job', 'dispatch'] },
  ];

  for (const c of critical) {
    const matched = tests.filter((t) =>
      c.patterns.some(
        (p) =>
          t.file.toLowerCase().includes(p.toLowerCase()) ||
          t.targets.some((tg) => tg.toLowerCase().includes(p.toLowerCase()))
      )
    );
    componentMap.set(c.component, {
      component: c.component,
      testType: matched.map((t) => t.type).join(', ') || '—',
      coverageConfidence: matched.length ? Math.min(95, 40 + matched.length * 15) : 15,
      testFiles: matched.map((t) => t.file),
    });
  }

  const rows = [...componentMap.values()];
  const untested = rows.filter((r) => r.coverageConfidence < 30);

  return {
    tests,
    rows,
    untested,
    stats: {
      testFiles: tests.length,
      untestedCritical: untested.length,
    },
  };
}
