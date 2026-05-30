/**
 * P4 Engineering OS orchestrator — semantic AST, impact, governance, AI index.
 */

import { buildSemanticIndex } from './backend-ast-engine.mjs';
import { buildCallGraph } from './backend-callgraph-parser.mjs';
import { buildImpactAnalysis } from './backend-impact-analysis.mjs';
import { buildTestIntelligence } from './backend-test-parser.mjs';
import { buildPerformanceAnalysis } from './backend-performance-parser.mjs';
import { buildSecurityAnalysis } from './backend-security-parser.mjs';
import { buildDeadCodeAnalysis } from './backend-deadcode-parser.mjs';
import { buildGovernanceReport } from './backend-governance-engine.mjs';
import { buildSemanticChunks } from './backend-semantic-indexer.mjs';
import { buildRefactorSafety } from './backend-refactor-engine.mjs';
import { walkPhpFiles } from './backend-php-utils.mjs';

export function buildEngineeringOS(ctx) {
  const {
    packages,
    pkgData,
    eventData,
    jobData,
    eventRuntime,
    realtime,
    arch,
    traceRows,
    readSafe,
    repoRoot,
  } = ctx;

  const semantic = buildSemanticIndex(repoRoot, packages, readSafe, walkPhpFiles);
  const callGraph = buildCallGraph(semantic);

  const impactCtx = {
    semantic,
    callGraph,
    pkgData,
    eventRuntime,
    jobData,
    traceRows,
    realtime,
  };
  const impact = buildImpactAnalysis(impactCtx);

  const fullCtx = {
    ...impactCtx,
    impact,
    controllerFlows: arch?.controllerFlows,
    packageGraph: arch?.packageGraph,
    queryIntel: arch?.queryIntel,
    dispatchGraph: arch?.dispatch,
    eventRuntime,
    jobData,
    pkgData,
    semantic,
  };

  const tests = buildTestIntelligence(repoRoot, readSafe);
  const performance = buildPerformanceAnalysis(fullCtx);
  const security = buildSecurityAnalysis(repoRoot, packages, readSafe);
  const deadCode = buildDeadCodeAnalysis(fullCtx);
  const governance = buildGovernanceReport(fullCtx);
  const semanticIndex = buildSemanticChunks({ ...fullCtx, impact });
  const refactor = buildRefactorSafety(fullCtx);

  const health = scorePlatformHealth({
    semantic,
    callGraph,
    impact,
    tests,
    performance,
    security,
    governance,
    archCoverage: arch?.coverage?.avgPct,
    runtimeCoverage: ctx.runtimeCoverage,
    schemaStats: ctx.schemaStats,
  });

  return {
    semantic,
    callGraph,
    impact,
    tests,
    performance,
    security,
    deadCode,
    governance,
    semanticIndex,
    refactor,
    health,
    astDispatchEdges: countAstDispatches(semantic),
  };
}

function countAstDispatches(semantic) {
  let n = 0;
  for (const file of semantic.files) {
    for (const cls of file.classes) {
      for (const m of cls.methods) n += m.dispatches.length;
    }
  }
  return n;
}

function scorePlatformHealth(slices) {
  const areas = {
    'API Contracts': {
      pct: slices.schemaStats?.completeness?.avgConfidence ?? 54,
      count: slices.schemaStats?.endpointCount ?? 0,
    },
    'Runtime Coverage': {
      pct: slices.runtimeCoverage ?? 67,
      count: 0,
    },
    'Architecture Intelligence': {
      pct: slices.archCoverage ?? 82,
      count: 0,
    },
    Security: {
      pct: Math.max(20, 100 - (slices.security?.stats?.high || 0) * 15),
      count: slices.security?.stats?.total ?? 0,
    },
    'Test Coverage': {
      pct: Math.min(95, 20 + (slices.tests?.stats?.testFiles || 0) * 25),
      count: slices.tests?.stats?.testFiles ?? 0,
    },
    Performance: {
      pct: Math.max(30, 100 - (slices.performance?.stats?.high || 0) * 10),
      count: slices.performance?.stats?.total ?? 0,
    },
    Governance: {
      pct: Math.max(40, 100 - (slices.governance?.stats?.high || 0) * 20),
      count: slices.governance?.stats?.total ?? 0,
    },
    'AST / Call graph': pct(slices.callGraph?.stats?.edges, 200),
    'AI semantic index': pct(slices.semanticIndex?.stats?.chunks, 300),
  };

  const weights = {
    'API Contracts': 0.15,
    'Runtime Coverage': 0.12,
    'Architecture Intelligence': 0.12,
    Security: 0.15,
    'Test Coverage': 0.1,
    Performance: 0.1,
    Governance: 0.1,
    'AST / Call graph': 0.08,
    'AI semantic index': 0.08,
  };

  let weighted = 0;
  let wsum = 0;
  for (const [k, v] of Object.entries(areas)) {
    weighted += v.pct * (weights[k] || 0.1);
    wsum += weights[k] || 0.1;
  }

  const engineeringReadiness = Math.round(weighted / wsum);
  const aiReadiness = Math.round(
    (areas['AI semantic index'].pct +
      areas['AST / Call graph'].pct +
      areas['Architecture Intelligence'].pct) /
      3
  );

  return {
    areas,
    engineeringReadinessIndex: engineeringReadiness,
    aiReadinessScore: aiReadiness,
    maintainabilityScore: Math.round(
      (engineeringReadiness + (100 - (slices.governance?.stats?.total || 0) * 2)) / 2
    ),
  };
}

function pct(count, target) {
  return { pct: Math.min(100, Math.round(((count || 0) / target) * 100)), count: count || 0 };
}

export function exportEngineeringArtifacts(metaDir, fs, eng) {
  fs.writeFileSync(
    `${metaDir}/backend-callgraph.json`,
    JSON.stringify(eng.callGraph.export, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    `${metaDir}/backend-semantic-index.json`,
    JSON.stringify(eng.semanticIndex.export, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    `${metaDir}/backend-engineering-health.json`,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        health: eng.health,
        impact: eng.impact.impacts.map((i) => ({
          entity: i.entity,
          risk: i.risk,
          summary: i.summary,
        })),
        stats: {
          semanticFiles: eng.semantic.stats.files,
          callGraphEdges: eng.callGraph.stats.edges,
          semanticChunks: eng.semanticIndex.stats.chunks,
        },
      },
      null,
      2
    ),
    'utf8'
  );
}
