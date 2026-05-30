/**
 * Deployment & change risk prediction.
 */

/**
 * @param {object} ctx
 */
export function buildDeploymentRisk(ctx) {
  const { eng, changeIntel, schemaStats } = ctx;
  const rows = [];

  const churnByComponent = new Map(
    (changeIntel?.rows || []).map((r) => [r.component, r.churn])
  );

  for (const imp of eng?.impact?.impacts || []) {
    const churn = Math.max(
      ...imp.entity
        .split('')
        .map(() => 0)
        .concat(
          [...churnByComponent.entries()]
            .filter(([k]) => k.toLowerCase().includes(imp.entity.toLowerCase()))
            .map(([, v]) => v)
        )
    );
    const blast =
      (imp.downstream.endpoints?.length || 0) +
      (imp.downstream.jobs?.length || 0) * 2;
    const testGap = (eng.tests?.untested || []).some((u) =>
      u.component.toLowerCase().includes(imp.entity.toLowerCase())
    );
    const riskScore = blast + (churn > 50 ? 20 : 0) + (testGap ? 25 : 0);
    const risk =
      riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low';
    rows.push({
      component: imp.entity,
      risk,
      rollbackDifficulty: blast > 30 ? 'high' : blast > 10 ? 'medium' : 'low',
      criticality: imp.risk,
      releaseRisk: Math.min(100, riskScore),
    });
  }

  for (const j of eng?.jobData?.jobs || []) {
    if (j.queue !== 'default' && j.failureBehavior === '—') {
      rows.push({
        component: j.shortName,
        risk: 'medium',
        rollbackDifficulty: 'medium',
        criticality: 'async',
        releaseRisk: 45,
      });
    }
  }

  for (const r of eng?.refactor?.rows || []) {
    if (r.refactorRisk === 'high') {
      rows.push({
        component: r.component,
        risk: 'high',
        rollbackDifficulty: 'high',
        criticality: 'coupling',
        releaseRisk: 70,
      });
    }
  }

  const releaseRisk = Math.round(
    rows.reduce((s, r) => s + r.releaseRisk, 0) / Math.max(rows.length, 1)
  );
  const productionSafety = Math.max(
    10,
    100 -
      releaseRisk * 0.4 -
      (eng?.governance?.stats?.high || 0) * 10 -
      (eng?.security?.stats?.high || 0) * 8
  );

  return {
    rows: rows.sort((a, b) => b.releaseRisk - a.releaseRisk).slice(0, 35),
    releaseRiskScore: releaseRisk,
    productionSafetyScore: Math.round(productionSafety),
    stats: { components: rows.length },
  };
}
