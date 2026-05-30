/**
 * Automated architecture risk findings.
 */

export function buildArchitectureRisks(slices) {
  const risks = [];
  const {
    dispatchGraph,
    controllerFlows,
    packageGraph,
    queryIntel,
    observability,
    cacheTopology,
  } = slices;

  for (const cycle of packageGraph?.cycles || []) {
    risks.push({
      risk: 'Cyclic package dependency',
      severity: 'high',
      location: cycle.join(' → '),
      recommendation: 'Introduce boundary interfaces or shared kernel package',
    });
  }

  for (const e of packageGraph?.hotspots || []) {
    if (e.weight > 80) {
      risks.push({
        risk: 'Tight cross-package coupling',
        severity: 'medium',
        location: `${e.from} → ${e.to} (${e.weight} imports)`,
        recommendation: 'Extract shared contracts or anti-corruption layer',
      });
    }
  }

  for (const flow of controllerFlows?.flows || []) {
    for (const method of flow.methods || []) {
      if (method.lineCount > 150) {
        risks.push({
          risk: 'Large controller method',
          severity: 'medium',
          location: `${flow.className}::${method.method} (${method.lineCount} lines)`,
          recommendation: 'Extract service/actions; keep controller thin',
        });
      }
      const hasTx = method.steps.some((s) => s.kind === 'transaction');
      const hasDispatch = method.steps.some((s) => s.kind === 'dispatch');
      if (hasTx && hasDispatch) {
        risks.push({
          risk: 'Transaction spans async dispatch',
          severity: 'high',
          location: `${flow.className}::${method.method}`,
          recommendation: 'Dispatch after commit; use DB::afterCommit',
        });
      }
    }
  }

  const fanout = new Map();
  for (const e of dispatchGraph?.edges || []) {
    if (e.type === 'event') {
      fanout.set(e.source, (fanout.get(e.source) || 0) + 1);
    }
  }
  for (const [src, count] of fanout) {
    if (count >= 5) {
      risks.push({
        risk: 'Excessive event fanout',
        severity: 'medium',
        location: src,
        recommendation: 'Consolidate listeners or use queued fanout with idempotency',
      });
    }
  }

  for (const m of queryIntel?.models || []) {
    if (m.risks.includes('N+1 risk (many relations, few with())')) {
      risks.push({
        risk: 'N+1 query risk',
        severity: 'medium',
        location: m.className,
        recommendation: 'Add eager loads on index/detail queries',
      });
    }
    if (m.risks.includes('verify tenant scope')) {
      risks.push({
        risk: 'Possible weak tenant isolation',
        severity: 'high',
        location: m.className,
        recommendation: 'Ensure company_uuid scope + directives on queries',
      });
    }
  }

  if (observability?.stats?.silentAsyncJobs > 3) {
    risks.push({
      risk: 'Jobs without failed() handler',
      severity: 'low',
      location: `${observability.stats.silentAsyncJobs} ShouldQueue jobs`,
      recommendation: 'Add failed() logging or dead-letter alerting',
    });
  }

  if (cacheTopology?.locks?.length === 0) {
    risks.push({
      risk: 'Limited distributed lock usage',
      severity: 'low',
      location: 'codebase scan',
      recommendation: 'Use locks for idempotent schedulers and allocation',
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  risks.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  return {
    risks: risks.slice(0, 60),
    stats: {
      total: risks.length,
      high: risks.filter((r) => r.severity === 'high').length,
      medium: risks.filter((r) => r.severity === 'medium').length,
    },
  };
}
