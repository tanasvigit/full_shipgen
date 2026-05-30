/**
 * Orchestrates P3 architecture intelligence parsers.
 */

import { buildDispatchGraph } from './backend-dispatch-tracer.mjs';
import { buildControllerFlows } from './backend-controller-flow-parser.mjs';
import { buildContainerMap } from './backend-container-parser.mjs';
import { buildPackageGraph } from './backend-package-graph-parser.mjs';
import { buildQueryIntelligence } from './backend-query-parser.mjs';
import { buildEntityLineage } from './backend-lineage-parser.mjs';
import { buildCacheTopology } from './backend-cache-parser.mjs';
import { buildInfraTopology } from './backend-topology-parser.mjs';
import { buildObservabilityCatalog } from './backend-observability-parser.mjs';
import { buildArchitectureRisks } from './backend-architecture-risk.mjs';
import { buildKnowledgeGraphs, exportGraphFiles } from './backend-graph-export.mjs';

/**
 * @param {object} ctx
 */
export function buildArchitectureIntelligence(ctx) {
  const { packages, pkgData, eventData, jobData, eventRuntime, realtime, readSafe, walkDir, repoRoot } =
    ctx;

  const allControllers = [];
  for (const pkg of pkgData) {
    allControllers.push(...walkDir(`${pkg.srcRoot}/Http/Controllers`));
  }

  const dispatch = buildDispatchGraph(repoRoot, packages, readSafe);
  const controllerFlows = buildControllerFlows(readSafe, repoRoot, allControllers);
  const container = buildContainerMap(repoRoot, packages, readSafe);
  const packageGraph = buildPackageGraph(repoRoot, packages, readSafe);
  const queryIntel = buildQueryIntelligence(repoRoot, packages, readSafe);
  const lineage = buildEntityLineage(dispatch, controllerFlows, eventRuntime);
  const cacheTopology = buildCacheTopology(repoRoot, packages, readSafe);
  const topology = buildInfraTopology(readSafe);
  const observability = buildObservabilityCatalog(repoRoot, packages, readSafe);

  const risks = buildArchitectureRisks({
    dispatchGraph: dispatch,
    controllerFlows,
    packageGraph,
    queryIntel,
    observability,
    cacheTopology,
  });

  const intelForGraph = {
    dispatch,
    controllerFlows,
    container,
    packageGraph,
    queryIntel,
    lineage,
    jobs: jobData,
    eventRuntime,
    realtime,
  };

  const graphs = buildKnowledgeGraphs(intelForGraph);

  const coverage = scoreArchitectureCoverage({
    dispatch,
    controllerFlows,
    container,
    packageGraph,
    queryIntel,
    lineage,
    cacheTopology,
    topology,
    observability,
    risks,
  });

  return {
    dispatch,
    controllerFlows,
    container,
    packageGraph,
    queryIntel,
    lineage,
    cacheTopology,
    topology,
    observability,
    risks,
    graphs,
    coverage,
  };
}

function scoreArchitectureCoverage(slices) {
  const areas = {
    'Dispatch tracing': pct(slices.dispatch?.stats?.edgeCount, 80),
    'Controller flows': pct(slices.controllerFlows?.stats?.methods, 40),
    'Service container': pct(slices.container?.stats?.bindings, 15),
    'Package graph': pct(slices.packageGraph?.stats?.edges, 20),
    'ORM intelligence': pct(slices.queryIntel?.stats?.models, 50),
    'Entity lineage': pct(slices.lineage?.stats?.entities, 5),
    'Cache topology': pct(slices.cacheTopology?.stats?.cacheOps, 20),
    'Infra topology': pct(slices.topology?.stats?.components, 6),
    Observability: pct(slices.observability?.stats?.areas, 5),
    'Risk analysis': pct(slices.risks?.stats?.total, 10),
  };
  const values = Object.values(areas);
  const avgPct = Math.round(values.reduce((s, v) => s + v.pct, 0) / values.length);
  return { areas, avgPct };
}

function pct(count, target) {
  const c = count || 0;
  return { count: c, pct: Math.min(100, Math.round((c / target) * 100)) };
}

export { exportGraphFiles };
