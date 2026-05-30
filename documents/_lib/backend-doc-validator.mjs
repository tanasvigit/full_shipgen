/**
 * Self-healing documentation validation.
 */

/**
 * @param {object} ctx
 */
export function buildDocValidator(ctx) {
  const issues = [];
  const { eng, schemaStats, pkgData, jobData, eventRuntime } = ctx;

  const endpointsWithoutSchema =
    (schemaStats?.endpointCount || 0) - (schemaStats?.endpointsWithResponseFields || 0);
  if (endpointsWithoutSchema > 0) {
    issues.push({
      missing: 'Response schema (Part X)',
      severity: 'medium',
      suggestedFix: `Add API Resources for ${endpointsWithoutSchema} endpoints lacking response fields`,
      count: endpointsWithoutSchema,
    });
  }

  for (const j of jobData?.jobs || []) {
    if (j.triggerSource.includes('search codebase')) {
      issues.push({
        missing: 'Job trigger source',
        severity: 'low',
        suggestedFix: `Document dispatch path for ${j.shortName} in Part VII-D`,
        count: 1,
      });
    }
  }

  for (const flow of ctx.arch?.controllerFlows?.flows?.slice(0, 15) || []) {
    const hasFlowDoc = flow.methods.some((m) => m.steps.length > 2);
    if (!hasFlowDoc && flow.priority) {
      issues.push({
        missing: 'Controller runtime flow',
        severity: 'low',
        suggestedFix: `Expand Part XIII-B flow for ${flow.className}`,
        count: 1,
      });
    }
  }

  const eventsWithoutListeners = (eventRuntime?.flows || []).filter(
    (f) => !f.steps?.length
  );
  if (eventsWithoutListeners.length) {
    issues.push({
      missing: 'Event listener mapping',
      severity: 'high',
      suggestedFix: 'Register listeners in EventServiceProvider',
      count: eventsWithoutListeners.length,
    });
  }

  for (const pkg of pkgData || []) {
    const resources = pkg.resources?.length || 0;
    const routes = pkg.parsedRoutes?.length || 0;
    if (resources > 0 && routes === 0 && pkg.routesFile) {
      issues.push({
        missing: 'Parsed routes',
        severity: 'medium',
        suggestedFix: `Re-parse ${pkg.routesFile} for Part X`,
        count: 1,
      });
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const integrityScore = Math.max(
    20,
    100 - issues.filter((i) => i.severity === 'high').length * 15 - issues.length * 2
  );

  return {
    issues: issues.slice(0, 40),
    integrityScore,
    stats: { issues: issues.length },
  };
}
