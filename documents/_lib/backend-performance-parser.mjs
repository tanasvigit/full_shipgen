/**
 * Performance & scalability hotspot analysis.
 */

/**
 * @param {object} ctx
 */
export function buildPerformanceAnalysis(ctx) {
  const { semantic, queryIntel, controllerFlows, dispatchGraph } = ctx;
  const hotspots = [];

  for (const file of semantic?.files || []) {
    for (const cls of file.classes) {
      for (const method of cls.methods) {
        if (method.lineCount > 120) {
          hotspots.push({
            area: `${cls.name}::${method.name}`,
            severity: method.lineCount > 200 ? 'high' : 'medium',
            reason: `Large method (${method.lineCount} lines) — blocking request risk`,
          });
        }
        if (method.dispatches.length > 2 && method.events.length > 2) {
          hotspots.push({
            area: `${cls.name}::${method.name}`,
            severity: 'medium',
            reason: 'Synchronous fanout before async boundary',
          });
        }
      }
    }
  }

  for (const m of queryIntel?.models || []) {
    if (m.risks.some((r) => r.includes('N+1'))) {
      hotspots.push({
        area: m.className,
        severity: 'high',
        reason: 'N+1 risk — many relations without eager loads',
      });
    }
    if (m.transactions > 2) {
      hotspots.push({
        area: m.className,
        severity: 'medium',
        reason: 'Multiple transaction patterns in model',
      });
    }
    if (m.rawSql > 2) {
      hotspots.push({
        area: m.className,
        severity: 'medium',
        reason: 'Raw SQL usage — index/tenant review required',
      });
    }
  }

  const syncFanout = (dispatchGraph?.edges || []).filter(
    (e) => e.syncAsync === 'sync' && e.type === 'event'
  ).length;
  if (syncFanout > 15) {
    hotspots.push({
      area: 'Event bus',
      severity: 'medium',
      reason: `${syncFanout} synchronous event edges — consider queued listeners`,
    });
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  hotspots.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    hotspots: hotspots.slice(0, 50),
    stats: {
      total: hotspots.length,
      high: hotspots.filter((h) => h.severity === 'high').length,
    },
  };
}
