/**
 * AI-native semantic chunks for RAG / MCP / agents.
 */

/**
 * @param {object} ctx
 */
export function buildSemanticChunks(ctx) {
  const chunks = [];
  let id = 0;

  for (const pkg of ctx.pkgData || []) {
    for (const res of pkg.resources || []) {
      chunks.push({
        id: `chunk-${++id}`,
        type: 'endpoint-resource',
        domain: pkg.id,
        title: `${pkg.label} — ${res}`,
        text: `REST resource ${res} in package ${pkg.id}. Internal API via fleetbaseRoutes.`,
        tags: ['api', 'rest', pkg.id, res],
        confidence: 0.92,
        relations: [`package:${pkg.id}`, `resource:${res}`],
      });
    }
  }

  for (const flow of ctx.eventRuntime?.flows || []) {
    chunks.push({
      id: `chunk-${++id}`,
      type: 'event-flow',
      domain: flow.package,
      title: `Event ${flow.event}`,
      text: `Event ${flow.event} triggers: ${flow.steps.map((s) => `${s.listener} (${s.mode})`).join('; ')}`,
      tags: ['event', 'async', flow.event],
      confidence: 0.88,
      relations: flow.steps.map((s) => `listener:${s.listener}`),
    });
  }

  for (const j of ctx.jobData?.jobs || []) {
    chunks.push({
      id: `chunk-${++id}`,
      type: 'job',
      domain: j.pkgId,
      title: j.shortName,
      text: `Job ${j.className} on queue ${j.queue}. Trigger: ${j.triggerSource}. Retries: ${j.tries}.`,
      tags: ['job', 'queue', j.queue],
      confidence: 0.9,
      relations: [`queue:${j.queue}`],
    });
  }

  for (const imp of ctx.impact?.impacts || []) {
    chunks.push({
      id: `chunk-${++id}`,
      type: 'impact-entity',
      domain: 'platform',
      title: `Impact: ${imp.entity}`,
      text: `Changing ${imp.entity} affects: ${imp.summary}. Risk: ${imp.risk}.`,
      tags: ['impact', imp.entity, imp.risk],
      confidence: 0.85,
      relations: [`entity:${imp.entity}`],
    });
  }

  for (const sym of (ctx.callGraph?.symbolRows || []).slice(0, 100)) {
    chunks.push({
      id: `chunk-${++id}`,
      type: 'symbol',
      domain: 'code',
      title: sym.fqcn,
      text: `Method ${sym.fqcn} has ${sym.references} graph references. Called by: ${sym.calledBy.join(', ') || 'unknown'}.`,
      tags: ['symbol', 'callgraph'],
      confidence: 0.8,
      relations: sym.calledBy.map((c) => `caller:${c}`),
    });
  }

  return {
    chunks,
    stats: {
      chunks: chunks.length,
      types: [...new Set(chunks.map((c) => c.type))],
    },
    export: {
      version: 1,
      generated: new Date().toISOString(),
      embeddingModel: 'metadata-only (vectors external)',
      chunks,
    },
  };
}
