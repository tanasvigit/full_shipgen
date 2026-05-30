/**
 * Continuous governance monitoring with trend vs snapshot.
 */

const RULES = [
  { id: 'coupling', label: 'Package coupling (fleetops→core)', threshold: 100, metric: (c) => c.couplingImports },
  { id: 'controller_size', label: 'Oversized controller methods', threshold: 3, metric: (c) => c.largeControllers },
  { id: 'event_fanout', label: 'High event fanout (≥4 listeners)', threshold: 2, metric: (c) => c.eventFanout },
  { id: 'job_failed', label: 'Jobs missing failed() handler', threshold: 5, metric: (c) => c.jobsNoFailed },
  { id: 'policy_gap', label: 'Policy coverage gap', threshold: 1, metric: (c) => c.policyGap },
];

/**
 * @param {object} ctx
 * @param {object|null} previousSnapshot
 */
export function buildGovernanceMonitor(ctx, previousSnapshot) {
  const eng = ctx.eng;
  const coupling = eng?.packageGraph?.edges?.find(
    (e) => e.from === 'fleetops' && e.to === 'core-api'
  )?.weight || 0;

  let largeControllers = 0;
  const controllerFlows =
    ctx.arch?.controllerFlows?.flows || ctx.eng?.arch?.controllerFlows?.flows || [];
  for (const flow of controllerFlows) {
    for (const m of flow.methods || []) {
      if (m.lineCount > 150) largeControllers++;
    }
  }

  let eventFanout = 0;
  for (const f of eng?.eventRuntime?.flows || []) {
    if ((f.steps || []).length >= 4) eventFanout++;
  }

  const jobsNoFailed = (eng?.jobData?.jobs || []).filter(
    (j) => j.implementsQueue && j.failureBehavior === '—'
  ).length;

  const current = {
    couplingImports: coupling,
    largeControllers,
    eventFanout,
    jobsNoFailed,
    policyGap: (eng?.governance?.violations || []).filter((v) =>
      v.rule.includes('Policy')
    ).length,
  };

  const rows = RULES.map((rule) => {
    const value = rule.metric(current);
    const prev = previousSnapshot?.metrics?.governance?.[rule.id];
    const delta = prev != null ? value - prev : 0;
    const status =
      value > rule.threshold ? 'fail' : value > rule.threshold * 0.7 ? 'warn' : 'pass';
    let trend = 'stable';
    if (delta > 0) trend = 'worsening';
    if (delta < 0) trend = 'improving';
    return {
      rule: rule.label,
      current: value,
      trend,
      status,
      threshold: rule.threshold,
    };
  });

  const pass = rows.filter((r) => r.status === 'pass').length;
  const governanceScore = Math.round((pass / rows.length) * 100);

  return {
    rows,
    governanceScore,
    currentMetrics: current,
    stats: { pass, fail: rows.filter((r) => r.status === 'fail').length },
  };
}
