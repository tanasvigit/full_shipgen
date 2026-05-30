/**
 * Event/listener runtime: payloads, queued listeners, chains, observers.
 */

import path from 'node:path';
import { parsePhpClassName, extractFunctionBody, walkPhpFiles } from './backend-php-utils.mjs';
import { parseEventServiceProvider, parseObserversProperty } from './backend-events-parser.mjs';

function parseEventClass(content, relPath) {
  const className = parsePhpClassName(content) || relPath;
  const props = [];
  for (const m of content.matchAll(/public\s+\$(\w+)/g)) {
    props.push(m[1]);
  }
  const broadcastAs = content.match(/function\s+broadcastAs\s*\([^)]*\)[^{]*\{[^}]*return\s+['"]([^'"]+)['"]/s)?.[1];
  const implementsShouldBroadcast = /implements\s+ShouldBroadcast/.test(content);
  return {
    className,
    shortName: className.split('\\').pop(),
    relPath,
    properties: props,
    broadcastAs,
    implementsShouldBroadcast,
  };
}

function parseListenerClass(content, relPath) {
  const className = parsePhpClassName(content) || relPath;
  const queued = /implements\s+ShouldQueue/.test(content);
  const handleBody = extractFunctionBody(content, 'handle');
  const sideEffects = [];
  if (/Notification::|->notify\(/.test(handleBody)) sideEffects.push('notification');
  if (/event\(new/.test(handleBody)) sideEffects.push('chain event');
  if (/::dispatch/.test(handleBody)) sideEffects.push('dispatch job');
  if (/Webhook|webhook/.test(handleBody)) sideEffects.push('webhook');
  if (/TrackingStatus|->update|->save/.test(handleBody)) sideEffects.push('model update');

  const eventParam = content.match(/function\s+handle\s*\(\s*([\w\\]+)/)?.[1] || 'object';

  return {
    className,
    shortName: className.split('\\').pop(),
    relPath,
    queued,
    sync: !queued,
    eventParam,
    sideEffects,
    handleSummary: handleBody.slice(0, 200).replace(/\s+/g, ' ').trim(),
  };
}

/**
 * Build runtime flows from listen matrix + listener metadata.
 */
export function buildEventRuntimeData(packages, eventData, readSafe, repoRoot) {
  const events = [];
  const listeners = [];
  const flows = [];

  for (const pkg of packages) {
    for (const rel of walkPhpFiles(repoRoot, path.join(pkg.srcRoot, 'Events'))) {
      const content = readSafe(rel);
      if (!content) continue;
      events.push({ ...parseEventClass(content, rel), package: pkg.label });
    }
    for (const rel of walkPhpFiles(repoRoot, path.join(pkg.srcRoot, 'Listeners'))) {
      const content = readSafe(rel);
      if (!content) continue;
      listeners.push({ ...parseListenerClass(content, rel), package: pkg.label });
    }
  }

  const listenerByShort = new Map(listeners.map((l) => [l.shortName, l]));

  const allListen = [];
  for (const pkg of eventData.byPackage) {
    for (const row of pkg.listen) {
      allListen.push({ ...row, package: pkg.label });
    }
  }

  for (const row of allListen) {
    const steps = row.listeners.map((ln) => {
      const meta = listenerByShort.get(ln);
      const mode = meta?.queued ? 'async (queue)' : 'sync';
      const effects = meta?.sideEffects?.join(', ') || 'handle()';
      return { listener: ln, mode, effects };
    });
    flows.push({
      event: row.event,
      package: row.package,
      steps,
      mermaid: `${row.event} --> ${row.listeners.join('\\n${row.event} --> ')}`,
    });
  }

  const observers = [];
  for (const pkg of eventData.byPackage) {
    for (const obs of pkg.observers) {
      observers.push({ ...obs, package: pkg.label });
    }
  }

  return {
    events,
    listeners,
    flows,
    observers,
    stats: {
      eventClasses: events.length,
      listenerClasses: listeners.length,
      queuedListeners: listeners.filter((l) => l.queued).length,
      syncListeners: listeners.filter((l) => !l.queued).length,
      flowMappings: flows.length,
      observers: observers.length,
    },
  };
}

export function formatEventFlowMermaid(flows, limit = 15) {
  const fleetOps = flows.filter((f) =>
    ['OrderDispatched', 'OrderCompleted', 'OrderStarted', 'OrderDriverAssigned', 'OrderCreated', 'OrderCanceled'].includes(
      f.event
    )
  );
  const lines = ['flowchart TD'];
  for (const f of fleetOps.slice(0, limit)) {
    const eid = f.event.replace(/[^a-zA-Z0-9]/g, '_');
    lines.push(`  ${eid}[${f.event}]`);
    for (const step of f.steps) {
      const lid = `${eid}_${step.listener}`.replace(/[^a-zA-Z0-9_]/g, '_');
      lines.push(`  ${eid} -->|${step.mode}| ${lid}[${step.listener}]`);
    }
  }
  return lines.join('\n');
}
