/**
 * Cross-package dependency graph from PHP use statements and Fleetbase namespaces.
 */

import { walkPhpFiles } from './backend-php-utils.mjs';

const PACKAGE_NS = {
  'Fleetbase\\': 'core-api',
  'Fleetbase\\FleetOps\\': 'fleetops',
  'Fleetbase\\Storefront\\': 'storefront',
  'Fleetbase\\Ledger\\': 'ledger',
  'Fleetbase\\Pallet\\': 'pallet',
  'Fleetbase\\RegistryBridge\\': 'registry-bridge',
};

function resolvePackageFromPath(relPath) {
  if (relPath.includes('fleetops')) return 'fleetops';
  if (relPath.includes('storefront')) return 'storefront';
  if (relPath.includes('ledger')) return 'ledger';
  if (relPath.includes('pallet')) return 'pallet';
  if (relPath.includes('registry-bridge')) return 'registry-bridge';
  if (relPath.includes('core-api')) return 'core-api';
  return 'api-shell';
}

function resolvePackageFromUse(useStmt) {
  for (const [ns, pkg] of Object.entries(PACKAGE_NS)) {
    if (useStmt.startsWith(ns)) return pkg;
  }
  return null;
}

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildPackageGraph(repoRoot, packages, readSafe) {
  const edgeCounts = new Map();
  const coupling = { event: [], queue: [], model: [] };

  for (const pkg of packages) {
    const from = pkg.id;
    for (const rel of walkPhpFiles(repoRoot, pkg.srcRoot)) {
      const content = readSafe(rel);
      if (!content) continue;

      for (const m of content.matchAll(/^use\s+([^;]+);/gm)) {
        const used = m[1].trim();
        const to = resolvePackageFromUse(used);
        if (!to || to === from) continue;
        const key = `${from}->${to}`;
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }

      if (rel.includes('Listeners/') && content.includes('Fleetbase\\')) {
        coupling.event.push({ from, file: rel });
      }
      if (rel.includes('Jobs/') && content.match(/Fleetbase\\(?!FleetOps)/)) {
        coupling.queue.push({ from, file: rel });
      }
    }
  }

  const edges = [...edgeCounts.entries()]
    .map(([key, weight]) => {
      const [from, to] = key.split('->');
      return {
        from,
        to,
        weight,
        couplingType: weight > 50 ? 'tight' : weight > 15 ? 'moderate' : 'loose',
      };
    })
    .sort((a, b) => b.weight - a.weight);

  const cycles = detectCycles(edges);
  const hotspots = edges.filter((e) => e.weight > 30).slice(0, 15);

  return {
    edges,
    cycles,
    hotspots,
    coupling,
    stats: {
      edges: edges.length,
      cycles: cycles.length,
    },
    mermaid: buildPackageMermaid(edges.slice(0, 25)),
  };
}

function detectCycles(edges) {
  const graph = new Map();
  for (const e of edges) {
    if (!graph.has(e.from)) graph.set(e.from, new Set());
    graph.get(e.from).add(e.to);
  }
  const cycles = [];
  const visited = new Set();
  const stack = new Set();

  function dfs(node, path) {
    if (stack.has(node)) {
      const idx = path.indexOf(node);
      if (idx >= 0) cycles.push([...path.slice(idx), node]);
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    for (const next of graph.get(node) || []) {
      dfs(next, [...path, node]);
    }
    stack.delete(node);
  }

  for (const n of graph.keys()) dfs(n, []);
  return cycles.slice(0, 10);
}

function buildPackageMermaid(edges) {
  const lines = ['flowchart LR'];
  const nodes = new Set();
  for (const e of edges) {
    nodes.add(e.from);
    nodes.add(e.to);
  }
  for (const n of nodes) {
    lines.push(`  ${n}[${n}]`);
  }
  for (const e of edges) {
    lines.push(`  ${e.from} -->|${e.weight}| ${e.to}`);
  }
  return lines.join('\n');
}
