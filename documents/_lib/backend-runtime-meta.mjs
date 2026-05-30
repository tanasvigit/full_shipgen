/**
 * Runtime coverage scoring and metadata export.
 */

export function buildRuntimeCoverage(slices) {
  const {
    jobs,
    events,
    webhooks,
    realtime,
    authDirectives,
    rbac,
    workflows,
    schedules,
  } = slices;

  const areas = {
    Jobs: scoreSlice(jobs?.jobs?.length, 10, jobs?.jobs?.filter((j) => j.implementsQueue).length),
    Events: scoreSlice(events?.stats?.flowMappings, 20, events?.stats?.queuedListeners),
    Webhooks: scoreSlice(webhooks?.stats?.inboundEndpoints, 3, webhooks?.stats?.outboundPatterns),
    Realtime: scoreSlice(realtime?.stats?.catalogChannels, 5, realtime?.producers?.length),
    RBAC: scoreSlice(rbac?.stats?.matrixRows, 50, rbac?.stats?.schemas),
    Workflows: scoreSlice(workflows?.stats?.standardCodes, 5, workflows?.sampleFlowCodes?.length),
    Scheduler: scoreSlice(schedules?.length, 5, schedules?.filter((s) => s.type === 'job').length),
  };

  const values = Object.values(areas);
  const avgPct = Math.round(
    values.reduce((s, a) => s + a.pct, 0) / values.length
  );

  const warnings = [];
  if ((jobs?.jobs?.length || 0) < 5) warnings.push('Few Job classes found in packages/*/Jobs');
  if ((events?.stats?.flowMappings || 0) === 0) warnings.push('No event→listener mappings');
  if ((webhooks?.inbound?.length || 0) === 0) warnings.push('No inbound webhook routes parsed');

  return {
    areas,
    avgCoveragePct: avgPct,
    warnings,
    targetNote: avgPct >= 85 ? 'Near target (~90% runtime visibility)' : 'Expand parsers for custom dispatch paths',
  };
}

function scoreSlice(primary, targetPrimary, secondary) {
  const p = Math.min(100, Math.round(((primary || 0) / targetPrimary) * 100));
  const s = secondary != null ? Math.min(100, Math.round((secondary / Math.max(primary, 1)) * 100)) : p;
  return { count: primary || 0, pct: Math.round((p + s) / 2), secondary: secondary || 0 };
}

export function exportRuntimeMeta(path, fs, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
}
