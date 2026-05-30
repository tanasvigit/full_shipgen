/**
 * Symbol & call graph from semantic index.
 */

/**
 * @param {ReturnType<import('./backend-ast-engine.mjs').buildSemanticIndex>} semantic
 */
export function buildCallGraph(semantic) {
  const nodes = [];
  const edges = [];
  const nodeSet = new Set();

  function addNode(id, type, meta = {}) {
    if (!nodeSet.has(id)) {
      nodeSet.add(id);
      nodes.push({ id, type, ...meta });
    }
  }

  for (const file of semantic.files) {
    for (const cls of file.classes) {
      addNode(cls.fqcn, 'class', { file: file.relPath, package: file.package });
      for (const method of cls.methods) {
        const mid = `${cls.fqcn}::${method.name}`;
        addNode(mid, 'method', { file: file.relPath, asyncBoundary: method.dispatches.length > 0 });

        for (const call of method.calls) {
          const target =
            call.kind === 'static'
              ? `${call.class}::${call.method}`
              : `${cls.fqcn}::$this->${call.method}`;
          addNode(target, 'call-target');
          edges.push({
            from: mid,
            to: target,
            kind: call.kind,
          });
        }

        for (const job of method.dispatches) {
          const jid = job.includes('\\') ? job : `*\\${job}`;
          addNode(jid, 'job');
          edges.push({ from: mid, to: jid, kind: 'dispatch', syncAsync: 'async' });
        }

        for (const ev of method.events) {
          addNode(ev, 'event');
          edges.push({ from: mid, to: ev, kind: 'event', syncAsync: 'sync' });
        }
      }
    }
  }

  const calledBy = new Map();
  for (const e of edges) {
    if (!calledBy.has(e.to)) calledBy.set(e.to, []);
    calledBy.get(e.to).push(e.from);
  }

  const symbolRows = [];
  for (const [id, sym] of semantic.symbols) {
    if (sym.type !== 'method') continue;
    const refs = edges.filter((e) => e.from === id || e.to === id).length;
    symbolRows.push({
      symbol: id.split('\\').pop(),
      fqcn: id,
      type: 'method',
      references: refs,
      calledBy: (calledBy.get(id) || []).slice(0, 5).map((c) => c.split('\\').pop()),
    });
  }

  return {
    nodes,
    edges,
    symbolRows: symbolRows.sort((a, b) => b.references - a.references).slice(0, 200),
    stats: {
      nodes: nodes.length,
      edges: edges.length,
      methods: symbolRows.length,
    },
    export: { version: 1, nodes, edges },
  };
}
