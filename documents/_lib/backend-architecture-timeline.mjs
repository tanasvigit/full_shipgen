/**
 * Temporal architecture evolution (snapshots + current metrics).
 */

export function buildArchitectureTimeline(currentMetrics, previousSnapshot) {
  const now = new Date().toISOString().slice(0, 10);
  const entries = [
    {
      period: now,
      majorChanges: summarizeCurrent(currentMetrics),
    },
  ];

  if (previousSnapshot?.generated) {
    entries.unshift({
      period: previousSnapshot.generated.slice(0, 10),
      majorChanges: summarizePrevious(previousSnapshot.metrics),
    });
  }

  const deltas = previousSnapshot?.metrics
    ? {
        endpoints: currentMetrics.endpoints - (previousSnapshot.metrics.endpoints || 0),
        callGraphEdges:
          currentMetrics.callGraphEdges -
          (previousSnapshot.metrics.callGraphEdges || 0),
        governanceViolations:
          currentMetrics.governanceViolations -
          (previousSnapshot.metrics.governanceViolations || 0),
        driftCount:
          currentMetrics.driftCount - (previousSnapshot.metrics.driftCount || 0),
      }
    : null;

  const debtSignals = [];
  if (deltas?.callGraphEdges > 500) debtSignals.push('Call graph complexity growing rapidly');
  if (deltas?.governanceViolations > 2) debtSignals.push('Governance violations increased');
  if (currentMetrics.couplingScore > 80) debtSignals.push('High package coupling sustained');

  return {
    entries,
    deltas,
    debtSignals,
    mermaid: buildTrendMermaid(currentMetrics, previousSnapshot?.metrics),
    export: {
      version: 1,
      generated: new Date().toISOString(),
      timeline: entries,
      deltas,
      debtSignals,
    },
  };
}

function summarizeCurrent(m) {
  return [
    `${m.endpoints} API endpoints`,
    `${m.callGraphEdges} call-graph edges`,
    `${m.jobs} jobs · ${m.events} event flows`,
    `${m.governanceViolations} governance violations`,
  ].join('; ');
}

function summarizePrevious(m) {
  if (!m) return 'Prior snapshot';
  return [
    `${m.endpoints} endpoints`,
    `${m.callGraphEdges} call-graph edges`,
    `${m.governanceViolations} violations`,
  ].join('; ');
}

function buildTrendMermaid(current, previous) {
  const lines = ['flowchart LR'];
  if (previous) {
    lines.push(`  prev[Previous: ${previous.endpoints} ep] --> now[Now: ${current.endpoints} ep]`);
  } else {
    lines.push(`  now[Baseline: ${current.endpoints} endpoints]`);
  }
  lines.push(`  now --> jobs[${current.jobs} jobs]`);
  lines.push(`  now --> async[${current.events} events]`);
  return lines.join('\n');
}
