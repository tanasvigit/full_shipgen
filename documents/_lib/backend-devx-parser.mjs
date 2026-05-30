/**
 * Developer experience / productivity intelligence.
 */

/**
 * @param {object} ctx
 */
export function buildDevxMetrics(ctx) {
  const { eng, schemaStats } = ctx;
  const areas = [];

  const controllerComplexity = Math.min(
    100,
    (eng?.performance?.hotspots || []).filter((h) => h.area.includes('::')).length * 5
  );
  areas.push({
    area: 'Controllers',
    complexity: controllerComplexity,
    discoverability: 70,
    maintainability: 100 - controllerComplexity * 0.6,
  });

  const docDensity = Math.min(
    100,
    Math.round((schemaStats?.completeness?.avgConfidence || 40) * 1.2)
  );
  areas.push({
    area: 'API documentation',
    complexity: 30,
    discoverability: docDensity,
    maintainability: docDensity,
  });

  const asyncComplexity = Math.min(
    100,
    (eng?.callGraph?.stats?.edges || 0) / 150
  );
  areas.push({
    area: 'Async / events',
    complexity: asyncComplexity,
    discoverability: 55,
    maintainability: 100 - asyncComplexity * 0.4,
  });

  const onboarding = Math.round(
    areas.reduce((s, a) => s + a.discoverability, 0) / areas.length
  );

  const overload = areas.filter((a) => a.complexity > 60);

  return {
    areas,
    onboardingScore: onboarding,
    overloadZones: overload.map((a) => a.area),
    stats: { areas: areas.length },
  };
}
