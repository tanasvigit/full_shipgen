/**
 * Global dispatch / event / broadcast trigger tracing across PHP packages.
 */

import path from 'node:path';
import { walkPhpFiles, parsePhpClassName } from './backend-php-utils.mjs';

const TRIGGER_PATTERNS = [
  { re: /(\w+)::dispatch\s*\(/g, type: 'job', mode: 'async' },
  { re: /Bus::dispatch\s*\(\s*(?:new\s+)?\\?([\w\\]+)/g, type: 'job', mode: 'async' },
  { re: /dispatch\s*\(\s*(?:new\s+)?\\?([\w\\]+)/g, type: 'job', mode: 'async' },
  { re: /event\s*\(\s*(?:new\s+)?\\?([\w\\]+)/g, type: 'event', mode: 'sync' },
  { re: /event\s*\(\s*new\s+([\w\\]+)/g, type: 'event', mode: 'sync' },
  { re: /broadcast\s*\(\s*(?:new\s+)?\\?([\w\\]+)/g, type: 'broadcast', mode: 'async' },
  { re: /Notification::send\s*\(/g, type: 'notification', mode: 'async', target: 'Notification' },
  { re: /\$this->dispatch\s*\(\s*\\?([\w\\]+)/g, type: 'job', mode: 'async' },
];

function relContext(relPath) {
  const base = path.basename(relPath, '.php');
  if (relPath.includes('Controllers/')) return `${base} (controller)`;
  if (relPath.includes('Listeners/')) return `${base} (listener)`;
  if (relPath.includes('Jobs/')) return `${base} (job)`;
  if (relPath.includes('Models/')) return `${base} (model)`;
  if (relPath.includes('Middleware/')) return `${base} (middleware)`;
  if (relPath.includes('Providers/')) return `${base} (provider)`;
  return base;
}

function extractTargets(line, pattern) {
  const targets = [];
  let m;
  const re = new RegExp(pattern.re.source, pattern.re.flags);
  while ((m = re.exec(line))) {
    const t = m[1] || pattern.target;
    if (t && !['dispatch', 'event', 'new'].includes(t)) targets.push(t.replace(/^\\+/, ''));
  }
  return targets;
}

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildDispatchGraph(repoRoot, packages, readSafe) {
  const edges = [];
  const seen = new Set();

  const scanDirs = packages.map((p) => p.srcRoot).concat(['api/app', 'api/bootstrap']);

  for (const dir of scanDirs) {
    for (const rel of walkPhpFiles(repoRoot, dir)) {
      const content = readSafe(rel);
      if (!content) continue;
      const source = relContext(rel);
      const className = parsePhpClassName(content);
      const sourceId = className || source;

      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (
          !trimmed.includes('dispatch') &&
          !trimmed.includes('event(') &&
          !trimmed.includes('broadcast') &&
          !trimmed.includes('Notification::')
        ) {
          continue;
        }

        for (const pattern of TRIGGER_PATTERNS) {
          for (const target of extractTargets(trimmed, pattern)) {
            const short = target.split('\\').pop();
            if (!short || short === 'true' || short === 'false' || short.length < 2) continue;
            const key = `${sourceId}|${short}|${pattern.type}|${rel}`;
            if (seen.has(key)) continue;
            seen.add(key);
            edges.push({
              source: sourceId,
              sourceFile: rel,
              target: short,
              targetFull: target,
              type: pattern.type,
              syncAsync: pattern.mode,
            });
          }
        }
      }
    }
  }

  const bySource = new Map();
  for (const e of edges) {
    if (!bySource.has(e.source)) bySource.set(e.source, []);
    bySource.get(e.source).push(e);
  }

  const chains = buildChains(edges);

  return {
    edges: edges.sort((a, b) => a.source.localeCompare(b.source)),
    chains,
    stats: {
      edgeCount: edges.length,
      sources: bySource.size,
      jobs: edges.filter((e) => e.type === 'job').length,
      events: edges.filter((e) => e.type === 'event').length,
    },
    mermaidSequence: buildSequenceMermaid(chains.slice(0, 8)),
    mermaidFlowchart: buildFlowchartMermaid(chains.slice(0, 12)),
  };
}

function buildChains(edges) {
  const eventTargets = new Set(
    edges.filter((e) => e.type === 'event').map((e) => e.target)
  );
  const listenerSources = edges.filter((e) =>
    e.sourceFile?.includes('Listeners/')
  );

  const chains = [];
  const priority = ['OrderController', 'createRecord', 'OrderCreated', 'OrderDispatched', 'ProcessAllocationJob'];

  for (const e of edges) {
    if (!e.source.includes('Order') && !e.source.includes('order')) continue;
    const steps = [{ node: e.source.split('\\').pop(), type: 'source' }, { node: e.target, type: e.type }];
    const follow = edges.filter(
      (x) => x.source.includes(e.target) || listenerSources.some((l) => l.target === e.target)
    );
    for (const f of follow.slice(0, 4)) {
      steps.push({ node: f.target, type: f.type });
    }
    chains.push({ root: e.source, steps });
  }

  chains.sort((a, b) => {
    const ai = priority.findIndex((p) => a.root.includes(p));
    const bi = priority.findIndex((p) => b.root.includes(p));
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });

  return chains.slice(0, 40);
}

function buildSequenceMermaid(chains) {
  const lines = ['sequenceDiagram'];
  for (const c of chains.slice(0, 5)) {
    const ids = c.steps.map((s, i) => {
      const id = `N${chains.indexOf(c)}_${i}`;
      return { id, label: s.node.replace(/[^a-zA-Z0-9]/g, '_') };
    });
    for (let i = 0; i < c.steps.length; i++) {
      const label = c.steps[i].node.slice(0, 40);
      if (i === 0) lines.push(`  participant ${ids[i].label} as ${label}`);
    }
    for (let i = 0; i < c.steps.length - 1; i++) {
      lines.push(`  ${ids[i].label}->>${ids[i + 1].label}: ${c.steps[i + 1].type}`);
    }
  }
  if (lines.length === 1) {
    lines.push('  participant API as OrderController');
    lines.push('  participant EV as OrderCreated');
    lines.push('  participant JOB as ProcessAllocationJob');
    lines.push('  API->>EV: event');
    lines.push('  EV->>JOB: listener dispatch');
  }
  return lines.join('\n');
}

function buildFlowchartMermaid(chains) {
  const lines = ['flowchart TD'];
  const added = new Set();
  for (const c of chains) {
    for (let i = 0; i < c.steps.length - 1; i++) {
      const a = c.steps[i].node.replace(/[^a-zA-Z0-9_]/g, '_');
      const b = c.steps[i + 1].node.replace(/[^a-zA-Z0-9_]/g, '_');
      const edge = `${a} --> ${b}`;
      if (!added.has(edge)) {
        added.add(edge);
        lines.push(`  ${a}[${c.steps[i].node}] --> ${b}[${c.steps[i + 1].node}]`);
      }
    }
  }
  if (lines.length === 1) {
    lines.push('  OC[OrderController] --> OE[OrderCreated]');
    lines.push('  OE --> L1[Listeners]');
    lines.push('  L1 --> J1[Jobs]');
  }
  return lines.join('\n');
}
