/**
 * AI-assisted remediation suggestions (prioritized).
 */

/**
 * @param {object} ctx
 */
export function buildRemediationPlan(ctx) {
  const items = [];

  for (const v of ctx.eng?.governance?.violations || []) {
    items.push({
      issue: v.rule,
      suggestedRefactor: v.location.includes('fanout')
        ? 'Consolidate listeners or queue fanout with idempotency keys'
        : 'Extract service action; reduce controller method size',
      estimatedImpact: v.severity === 'high' ? 'high risk reduction' : 'maintainability',
      priority: v.severity === 'high' ? 90 : 60,
      effort: 'medium',
    });
  }

  for (const f of ctx.eng?.security?.findings || []) {
    items.push({
      issue: f.finding,
      suggestedRefactor: f.recommendation,
      estimatedImpact: 'security posture',
      priority: f.severity === 'high' ? 95 : 70,
      effort: f.severity === 'high' ? 'medium' : 'low',
    });
  }

  for (const h of ctx.eng?.performance?.hotspots?.slice(0, 10) || []) {
    items.push({
      issue: h.reason,
      suggestedRefactor: 'Add eager loads / split method / async after commit',
      estimatedImpact: 'latency & stability',
      priority: h.severity === 'high' ? 85 : 55,
      effort: 'medium',
    });
  }

  for (const d of ctx.drift?.drifts?.slice(0, 8) || []) {
    items.push({
      issue: `${d.expected} → ${d.actual}`,
      suggestedRefactor: 'Align with package boundaries and service layer',
      estimatedImpact: 'architecture drift reduction',
      priority: d.severity === 'high' ? 88 : 50,
      effort: 'high',
    });
  }

  for (const a of ctx.eng?.deadCode?.artifacts?.slice(0, 5) || []) {
    items.push({
      issue: `Orphan ${a.type}: ${a.artifact}`,
      suggestedRefactor: 'Remove or wire dispatch; update docs',
      estimatedImpact: 'code clarity',
      priority: 40,
      effort: 'low',
    });
  }

  for (const i of ctx.docValidator?.issues?.filter((x) => x.severity === 'high') || []) {
    items.push({
      issue: i.missing,
      suggestedRefactor: i.suggestedFix,
      estimatedImpact: 'documentation integrity',
      priority: 75,
      effort: 'low',
    });
  }

  items.sort((a, b) => b.priority - a.priority);

  return {
    items: items.slice(0, 35),
    stats: { total: items.length },
  };
}
