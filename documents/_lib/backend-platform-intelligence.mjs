/**
 * P5 Platform Intelligence & Continuous Governance orchestrator.
 */

import { buildChangeIntelligence } from './backend-change-intelligence.mjs';
import { buildArchitectureDrift } from './backend-drift-engine.mjs';
import { buildDeploymentRisk } from './backend-risk-predictor.mjs';
import { buildArchitectureTimeline } from './backend-architecture-timeline.mjs';
import { buildGovernanceMonitor } from './backend-governance-monitor.mjs';
import { buildDevxMetrics } from './backend-devx-parser.mjs';
import { buildDocValidator } from './backend-doc-validator.mjs';
import { buildPlatformAnalytics } from './backend-platform-analytics.mjs';
import { buildRemediationPlan } from './backend-remediation-engine.mjs';
import {
  loadLatestSnapshot,
  persistSnapshot,
  diffSnapshots,
} from './backend-snapshot-store.mjs';
import fs from 'node:fs';
import path from 'node:path';

/**
 * @param {object} ctx
 */
export function buildPlatformIntelligence(ctx) {
  const {
    repoRoot,
    metaDir,
    eng,
    arch,
    schemaStats,
    runtimeStats,
    archStats,
    jobData,
    eventRuntime,
    pkgData,
  } = ctx;

  const snapshotsDir = path.join(metaDir, 'snapshots');
  const previousSnapshot = loadLatestSnapshot(snapshotsDir);

  const changeIntel = buildChangeIntelligence(repoRoot);
  const driftCtx = {
    semantic: eng.semantic,
    packageGraph: arch?.packageGraph,
    security: eng.security,
  };
  const drift = buildArchitectureDrift(driftCtx);

  const fullCtx = {
    eng: { ...eng, jobData, eventRuntime, arch },
    changeIntel,
    schemaStats,
    pkgData,
    jobData,
    eventRuntime,
    arch,
  };

  const deploymentRisk = buildDeploymentRisk(fullCtx);
  const governanceMonitor = buildGovernanceMonitor(
    { eng: fullCtx.eng, arch },
    previousSnapshot
  );
  const devx = buildDevxMetrics(fullCtx);
  const docValidator = buildDocValidator(fullCtx);

  const currentMetrics = {
    endpoints: schemaStats?.endpointCount || 0,
    callGraphEdges: eng.callGraph?.stats?.edges || 0,
    jobs: jobData?.jobs?.length || 0,
    events: eventRuntime?.flows?.length || 0,
    governanceViolations: eng.governance?.stats?.total || 0,
    driftCount: drift.stats.total,
    couplingScore:
      arch?.packageGraph?.edges?.find((e) => e.from === 'fleetops' && e.to === 'core-api')
        ?.weight || 0,
    governanceScore: governanceMonitor.governanceScore,
    releaseRisk: deploymentRisk.releaseRiskScore,
    docIntegrity: docValidator.integrityScore,
    engineeringReadiness: eng.health?.engineeringReadinessIndex,
  };

  const timeline = buildArchitectureTimeline(currentMetrics, previousSnapshot);
  const analyticsCtx = {
    eng: fullCtx.eng,
    governanceMonitor,
    deploymentRisk,
    docValidator,
    devx,
    changeIntel,
  };
  const analytics = buildPlatformAnalytics(analyticsCtx);
  const remediation = buildRemediationPlan({
    eng: fullCtx.eng,
    drift,
    docValidator,
  });

  const snapshotDiff = diffSnapshots(previousSnapshot, currentMetrics);
  const snapshotPayload = persistSnapshot(snapshotsDir, {
    ...currentMetrics,
    governance: governanceMonitor.currentMetrics,
    enterpriseMaturity: analytics.enterpriseMaturity,
  });

  exportPlatformArtifacts(metaDir, fs, {
    changeIntel,
    timeline,
    analytics,
    deploymentRisk,
    snapshot: snapshotPayload,
    snapshotDiff,
  });

  const dashboard = buildEnterpriseDashboard({
    schemaStats,
    runtimeStats,
    archStats,
    eng,
    governanceMonitor,
    deploymentRisk,
    analytics,
    docValidator,
    devx,
  });

  return {
    changeIntel,
    drift,
    deploymentRisk,
    timeline,
    governanceMonitor,
    devx,
    docValidator,
    analytics,
    remediation,
    snapshotDiff,
    dashboard,
    currentMetrics,
  };
}

function buildEnterpriseDashboard(scores) {
  const domains = {
    'API Maturity': Math.min(
      100,
      scores.schemaStats?.completeness?.avgConfidence ?? 50
    ),
    'Runtime Visibility': scores.runtimeStats?.coveragePct ?? 67,
    'Architecture Intelligence': scores.archStats?.coveragePct ?? 82,
    Governance: scores.governanceMonitor?.governanceScore ?? 70,
    Security: Math.max(
      20,
      100 - (scores.eng?.security?.stats?.high || 0) * 15
    ),
    Observability: 75,
    'AI Readiness': scores.eng?.health?.aiReadinessScore ?? 60,
    Maintainability: scores.analytics?.maintainabilityIndex ?? 65,
    'Operational Stability': scores.deploymentRisk?.productionSafetyScore ?? 55,
  };

  const platformMaturity = Math.round(
    Object.values(domains).reduce((a, b) => a + b, 0) / Object.keys(domains).length
  );

  return {
    domains,
    platformMaturityIndex: platformMaturity,
    engineeringSustainability: scores.analytics?.platformSustainabilityScore ?? 60,
    enterpriseReadiness: scores.analytics?.enterpriseMaturity ?? 65,
  };
}

function exportPlatformArtifacts(metaDir, fs, data) {
  fs.writeFileSync(
    path.join(metaDir, 'backend-change-intelligence.json'),
    JSON.stringify(data.changeIntel.export, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(metaDir, 'backend-architecture-timeline.json'),
    JSON.stringify(data.timeline.export, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(metaDir, 'backend-platform-analytics.json'),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        analytics: data.analytics,
        deploymentRisk: {
          releaseRiskScore: data.deploymentRisk.releaseRiskScore,
          productionSafetyScore: data.deploymentRisk.productionSafetyScore,
        },
        snapshotDiff: data.snapshotDiff,
      },
      null,
      2
    ),
    'utf8'
  );
}
