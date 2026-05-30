/**
 * Enterprise platform analytics & maturity scoring.
 */

export function buildPlatformAnalytics(ctx) {
  const { eng, governanceMonitor, deploymentRisk, docValidator, devx, changeIntel } =
    ctx;

  const architectureComplexity = Math.min(
    100,
    Math.round((eng?.callGraph?.stats?.edges || 0) / 150)
  );
  const operationalRisk = 100 - (deploymentRisk?.productionSafetyScore || 50);
  const asyncDensity = Math.min(
    100,
    (eng?.eventRuntime?.flows?.length || 0) * 4 + (eng?.jobData?.jobs?.length || 0) * 2
  );
  const securityPosture = Math.max(
    20,
    100 - (eng?.security?.stats?.high || 0) * 12
  );
  const testReliability = Math.min(
    95,
    25 + (eng?.tests?.stats?.testFiles || 0) * 20
  );
  const governanceHealth = governanceMonitor?.governanceScore ?? 70;
  const refactorSafety = Math.min(
    100,
    100 -
      (eng?.refactor?.rows || []).filter((r) => r.refactorRisk === 'high').length * 8
  );
  const aiNavigability = eng?.health?.aiReadinessScore ?? 60;

  const metrics = {
    'Architecture Complexity': architectureComplexity,
    'Operational Risk': operationalRisk,
    'Async Density': asyncDensity,
    'Security Posture': securityPosture,
    'Test Reliability': testReliability,
    'Governance Health': governanceHealth,
    'Refactor Safety': refactorSafety,
    'AI Navigability': aiNavigability,
  };

  const engineeringQualityIndex = Math.round(
    Object.values(metrics).reduce((a, b) => a + b, 0) / Object.keys(metrics).length
  );

  const enterpriseMaturity = Math.round(
    engineeringQualityIndex * 0.35 +
      (eng?.health?.engineeringReadinessIndex || 60) * 0.25 +
      (docValidator?.integrityScore || 70) * 0.2 +
      (deploymentRisk?.productionSafetyScore || 50) * 0.2
  );

  const maintainabilityIndex = Math.round(
    (devx?.onboardingScore || 50) * 0.3 +
      refactorSafety * 0.3 +
      governanceHealth * 0.2 +
      (100 - architectureComplexity) * 0.2
  );

  const sustainability = Math.round(
    (enterpriseMaturity + maintainabilityIndex + (deploymentRisk?.productionSafetyScore || 50)) /
      3
  );

  return {
    metrics,
    engineeringQualityIndex,
    enterpriseMaturity,
    maintainabilityIndex,
    platformSustainabilityScore: sustainability,
    stats: { metricCount: Object.keys(metrics).length },
  };
}
