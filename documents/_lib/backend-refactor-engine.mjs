/**
 * Refactor safety / blast-radius matrix.
 */

/**
 * @param {object} ctx
 */
export function buildRefactorSafety(ctx) {
  const rows = [];

  for (const imp of ctx.impact?.impacts || []) {
    const coupling =
      imp.risk === 'high' ? 'high' : imp.risk === 'medium' ? 'medium' : 'low';
    const blast =
      (imp.downstream.endpoints?.length || 0) +
      (imp.downstream.jobs?.length || 0) * 2 +
      (imp.downstream.events?.length || 0) * 2;
    rows.push({
      component: imp.entity,
      coupling,
      blastRadius: blast,
      refactorRisk: blast > 30 ? 'high' : blast > 10 ? 'medium' : 'low',
      notes: imp.summary,
    });
  }

  for (const e of ctx.packageGraph?.hotspots || []) {
    rows.push({
      component: `${e.from} package`,
      coupling: 'high',
      blastRadius: e.weight,
      refactorRisk: e.weight > 100 ? 'high' : 'medium',
      notes: `Imports ${e.to} ${e.weight} times`,
    });
  }

  for (const m of ctx.queryIntel?.priority || []) {
    if (m.relationships.length > 10) {
      rows.push({
        component: m.model,
        coupling: 'high',
        blastRadius: m.relationships.length,
        refactorRisk: 'high',
        notes: 'Migration-sensitive model graph',
      });
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  rows.sort(
    (a, b) => order[a.refactorRisk] - order[b.refactorRisk]
  );

  return {
    rows: rows.slice(0, 40),
    stats: { components: rows.length },
  };
}
