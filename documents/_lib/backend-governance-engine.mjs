/**
 * Architectural governance rules engine.
 */

const RULES = [
  {
    id: 'PKG_BOUNDARY',
    name: 'Package boundary violation',
    severity: 'high',
    check: (ctx) =>
      (ctx.packageGraph?.edges || [])
        .filter((e) => e.from === 'fleetops' && e.to === 'storefront')
        .map((e) => ({
          rule: 'fleetops must not import storefront',
          severity: 'high',
          location: `fleetops→storefront (${e.weight} imports)`,
        })),
  },
  {
    id: 'CONTROLLER_SIZE',
    name: 'Controller method size limit',
    severity: 'medium',
    check: (ctx) => {
      const v = [];
      for (const flow of ctx.controllerFlows?.flows || []) {
        for (const m of flow.methods || []) {
          if (m.lineCount > 150) {
            v.push({
              rule: 'Controller method > 150 lines',
              severity: 'medium',
              location: `${flow.className}::${m.method}`,
            });
          }
        }
      }
      return v;
    },
  },
  {
    id: 'EVENT_FANOUT',
    name: 'Event fanout threshold',
    severity: 'medium',
    check: (ctx) => {
      const v = [];
      const counts = new Map();
      for (const f of ctx.eventRuntime?.flows || []) {
        counts.set(f.event, (f.steps || []).length);
      }
      for (const [ev, n] of counts) {
        if (n >= 4) {
          v.push({
            rule: `Event fanout ≥ 4 listeners`,
            severity: 'medium',
            location: `${ev} (${n} listeners)`,
          });
        }
      }
      return v;
    },
  },
  {
    id: 'JOB_RETRY',
    name: 'Queue retry standards',
    severity: 'low',
    check: (ctx) => {
      const v = [];
      for (const j of ctx.jobData?.jobs || []) {
        if (j.implementsQueue && j.failureBehavior === '—') {
          v.push({
            rule: 'ShouldQueue job missing failed() handler',
            severity: 'low',
            location: j.shortName,
          });
        }
      }
      return v;
    },
  },
  {
    id: 'POLICY_COVERAGE',
    name: 'Policy coverage for REST resources',
    severity: 'low',
    check: (ctx) => {
      const v = [];
      const fleetops = ctx.pkgData?.find((p) => p.id === 'fleetops');
      if (!fleetops) return v;
      const resources = fleetops.resources || [];
      const policies = Array.from(ctx.semantic?.symbols?.keys() || []).filter((k) =>
        k.includes('Policy')
      );
      if (resources.length > policies.length * 2) {
        v.push({
          rule: 'Auth policy classes may be incomplete vs resources',
          severity: 'low',
          location: `${resources.length} resources, ${policies.length} policy symbols`,
        });
      }
      return v;
    },
  },
];

export function buildGovernanceReport(ctx) {
  const violations = [];
  for (const rule of RULES) {
    const found = rule.check(ctx) || [];
    violations.push(...found);
  }
  const severityOrder = { high: 0, medium: 1, low: 2 };
  violations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    violations: violations.slice(0, 50),
    stats: {
      total: violations.length,
      high: violations.filter((v) => v.severity === 'high').length,
    },
  };
}
