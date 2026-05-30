/**
 * Entity lifecycle / data lineage stitching.
 */

const ENTITY_LIFECYCLES = {
  Order: {
    states: ['created', 'dispatched', 'started', 'completed', 'canceled'],
    stages: [
      { stage: 'HTTP create', layer: 'controller', ref: 'OrderController@createRecord' },
      { stage: 'Persist', layer: 'model', ref: 'Order::createRecordFromRequest' },
      { stage: 'Domain event', layer: 'event', ref: 'OrderCreated / OrderReady' },
      { stage: 'Allocation', layer: 'job', ref: 'ProcessAllocationJob' },
      { stage: 'Dispatch', layer: 'event', ref: 'OrderDispatched' },
      { stage: 'Notify', layer: 'listener', ref: 'NotifyOrderEvent' },
      { stage: 'Webhook', layer: 'webhook', ref: 'SendResourceLifecycleWebhook' },
      { stage: 'Realtime', layer: 'broadcast', ref: 'socketcluster channels' },
      { stage: 'Complete', layer: 'event', ref: 'OrderCompleted' },
      { stage: 'Ledger', layer: 'service', ref: 'invoice / payment (Ledger)' },
    ],
  },
  Driver: {
    states: ['created', 'online', 'assigned', 'offline'],
    stages: [
      { stage: 'CRUD', layer: 'controller', ref: 'DriverController' },
      { stage: 'Assignment', layer: 'model', ref: 'Order driver_uuid' },
      { stage: 'Tracking', layer: 'job', ref: 'ReplayPositions / telematics' },
      { stage: 'Realtime', layer: 'broadcast', ref: 'driver.{uuid} channel' },
    ],
  },
  Payment: {
    states: ['pending', 'succeeded', 'failed', 'refunded'],
    stages: [
      { stage: 'Checkout', layer: 'controller', ref: 'Storefront checkout' },
      { stage: 'Stripe', layer: 'webhook', ref: 'HandleSuccessfulPayment' },
      { stage: 'Ledger entry', layer: 'model', ref: 'Ledger accounts/transactions' },
    ],
  },
  Customer: {
    states: ['active', 'archived'],
    stages: [
      { stage: 'CRUD', layer: 'controller', ref: 'CustomerController' },
      { stage: 'Orders', layer: 'model', ref: 'customer_uuid on orders' },
      { stage: 'Directives', layer: 'auth', ref: 'permission directives' },
    ],
  },
  Product: {
    states: ['draft', 'published', 'archived'],
    stages: [
      { stage: 'Catalog', layer: 'controller', ref: 'ProductController' },
      { stage: 'Cart', layer: 'service', ref: 'Storefront cart jobs' },
      { stage: 'Inventory', layer: 'model', ref: 'Pallet inventory (if enabled)' },
    ],
  },
};

/**
 * @param {object} dispatchGraph
 * @param {object} controllerFlows
 * @param {object} eventRuntime
 */
export function buildEntityLineage(dispatchGraph, controllerFlows, eventRuntime) {
  const maps = [];

  for (const [entity, def] of Object.entries(ENTITY_LIFECYCLES)) {
    const relatedEdges = (dispatchGraph?.edges || []).filter(
      (e) =>
        e.source.includes(entity) ||
        e.target.includes(entity) ||
        e.sourceFile?.toLowerCase().includes(entity.toLowerCase())
    );

    const relatedFlows = (controllerFlows?.flows || []).filter((f) =>
      f.className?.includes(entity)
    );

    maps.push({
      entity,
      states: def.states,
      stages: def.stages,
      dispatchLinks: relatedEdges.slice(0, 15),
      controllerMethods: relatedFlows.flatMap((f) =>
        f.methods.map((m) => `${f.className.split('\\').pop()}::${m.method}`)
      ),
      mermaid: buildLineageMermaid(entity, def),
    });
  }

  return {
    maps,
    stats: { entities: maps.length },
  };
}

function buildLineageMermaid(entity, def) {
  const lines = ['stateDiagram-v2'];
  lines.push(`  [*] --> ${def.states[0]}`);
  for (let i = 0; i < def.states.length - 1; i++) {
    lines.push(`  ${def.states[i]} --> ${def.states[i + 1]}`);
  }
  if (def.states.includes('canceled')) {
    lines.push(`  ${def.states[0]} --> canceled`);
  }
  return lines.join('\n');
}
