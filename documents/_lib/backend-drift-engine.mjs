/**
 * Architectural drift: intended vs actual patterns.
 */

const FORBIDDEN_IMPORTS = [
  { from: 'fleetops', to: 'storefront', expected: 'no direct storefront imports' },
  { from: 'storefront', to: 'fleetops', expected: 'use core contracts only' },
];

/**
 * @param {object} ctx
 */
export function buildArchitectureDrift(ctx) {
  const drifts = [];

  for (const rule of FORBIDDEN_IMPORTS) {
    const edge = ctx.packageGraph?.edges?.find(
      (e) => e.from === rule.from && e.to === rule.to
    );
    if (edge) {
      drifts.push({
        severity: 'high',
        expected: rule.expected,
        actual: `${edge.weight} cross-imports detected`,
        location: `${rule.from} → ${rule.to}`,
      });
    }
  }

  for (const file of ctx.semantic?.files || []) {
    if (!file.relPath.includes('Controllers/')) continue;
    for (const cls of file.classes) {
      for (const method of cls.methods) {
        const bodyIndicators = method.dispatches.length + method.events.length;
        const hasServiceCall = method.calls.some(
          (c) =>
            c.kind === 'static' &&
            (c.class.includes('Service') || c.method.includes('Service'))
        );
        if (bodyIndicators > 0 && !hasServiceCall && method.lineCount > 40) {
          drifts.push({
            severity: 'medium',
            expected: 'Controller delegates to service layer',
            actual: 'Direct dispatch/event from controller',
            location: `${cls.fqcn}::${method.name}`,
          });
        }
        if (
          method.calls.some((c) => c.class?.includes('Models\\') && c.method === 'create')
        ) {
          drifts.push({
            severity: 'low',
            expected: 'Persistence via service/repository',
            actual: 'Direct model create in controller',
            location: `${cls.fqcn}::${method.name}`,
          });
        }
      }
    }
  }

  for (const f of ctx.security?.findings || []) {
    if (f.area.includes('SQL') || f.area.includes('Webhook')) {
      drifts.push({
        severity: f.severity,
        expected: 'Security baseline',
        actual: f.finding,
        location: f.location,
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  drifts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    drifts: drifts.slice(0, 45),
    stats: {
      total: drifts.length,
      high: drifts.filter((d) => d.severity === 'high').length,
    },
  };
}
