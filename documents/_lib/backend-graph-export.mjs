/**
 * Knowledge graph JSON export for AI / impact analysis.
 */

export function buildKnowledgeGraphs(intel) {
  const nodes = [];
  const edges = [];
  const nodeIndex = new Map();

  function addNode(id, type, meta = {}) {
    if (!nodeIndex.has(id)) {
      nodeIndex.set(id, nodes.length);
      nodes.push({ id, type, ...meta, confidence: meta.confidence ?? 0.85 });
    }
    return nodeIndex.get(id);
  }

  function addEdge(from, to, rel, meta = {}) {
    edges.push({
      from,
      to,
      relationship: rel,
      confidence: meta.confidence ?? 0.8,
      ...meta,
    });
  }

  for (const e of intel.dispatch?.edges || []) {
    addNode(e.source, 'source', { file: e.sourceFile });
    addNode(e.target, e.type);
    addEdge(e.source, e.target, 'triggers', { syncAsync: e.syncAsync });
  }

  for (const flow of intel.controllerFlows?.flows || []) {
    const cid = flow.className;
    addNode(cid, 'controller', { file: flow.relPath });
    for (const m of flow.methods) {
      const mid = `${cid}::${m.method}`;
      addNode(mid, 'controller_method');
      addEdge(cid, mid, 'has_method');
      for (const s of m.steps) {
        addNode(s.step, s.kind);
        addEdge(mid, s.step, 'executes');
      }
    }
  }

  for (const b of intel.container?.bindings || []) {
    addNode(b.interface, 'interface');
    addNode(b.implementation.slice(0, 80), 'implementation');
    addEdge(b.interface, b.implementation, 'bound_as', { scope: b.scope });
  }

  for (const e of intel.packageGraph?.edges || []) {
    addNode(e.from, 'package');
    addNode(e.to, 'package');
    addEdge(e.from, e.to, 'depends_on', { weight: e.weight });
  }

  for (const m of intel.lineage?.maps || []) {
    addNode(m.entity, 'entity');
    for (const s of m.stages) {
      addNode(s.ref, s.layer);
      addEdge(m.entity, s.ref, s.stage);
    }
  }

  const architectureGraph = {
    version: 1,
    generated: new Date().toISOString(),
    nodes,
    edges,
    stats: { nodes: nodes.length, edges: edges.length },
  };

  const runtimeGraph = {
    version: 1,
    generated: new Date().toISOString(),
    jobs: intel.jobs?.jobs?.map((j) => ({
      id: j.className,
      queue: j.queue,
      trigger: j.triggerSource,
    })),
    events: intel.eventRuntime?.flows?.map((f) => ({
      event: f.event,
      listeners: f.steps?.map((s) => s.listener),
    })),
    schedules: intel.jobs?.schedules,
    channels: intel.realtime?.channels,
  };

  const dependencyGraph = {
    version: 1,
    generated: new Date().toISOString(),
    packages: intel.packageGraph?.edges,
    cycles: intel.packageGraph?.cycles,
    container: intel.container?.bindings?.slice(0, 100),
    models: intel.queryIntel?.priority?.map((m) => ({
      model: m.model,
      relationships: m.relationships.length,
      risks: m.risks,
    })),
  };

  return { architectureGraph, runtimeGraph, dependencyGraph };
}

export function exportGraphFiles(metaDir, fs, graphs) {
  fs.writeFileSync(
    `${metaDir}/backend-architecture-graph.json`,
    JSON.stringify(graphs.architectureGraph, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    `${metaDir}/backend-runtime-graph.json`,
    JSON.stringify(graphs.runtimeGraph, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    `${metaDir}/backend-dependency-graph.json`,
    JSON.stringify(graphs.dependencyGraph, null, 2),
    'utf8'
  );
}
