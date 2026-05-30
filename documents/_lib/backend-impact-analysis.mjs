/**
 * Change impact analysis from semantic graph + routes + runtime catalogs.
 */

const ENTITY_ALIASES = {
  Order: ['order', 'orders', 'Order'],
  Driver: ['driver', 'drivers', 'Driver'],
  Payment: ['payment', 'payments', 'Payment', 'Transaction'],
  Customer: ['customer', 'customers', 'Contact'],
  Product: ['product', 'products', 'Product'],
  User: ['user', 'users', 'User'],
};

/**
 * @param {object} ctx
 */
export function buildImpactAnalysis(ctx) {
  const {
    semantic,
    callGraph,
    pkgData,
    eventRuntime,
    jobData,
    traceRows,
    realtime,
  } = ctx;

  const impacts = [];

  for (const [entity, aliases] of Object.entries(ENTITY_ALIASES)) {
    const downstream = {
      endpoints: [],
      jobs: [],
      events: [],
      listeners: [],
      channels: [],
      policies: [],
      uiScreens: [],
    };

    for (const pkg of pkgData) {
      for (const route of pkg.parsedRoutes || []) {
        const hay = `${route.path} ${route.handlerString || ''}`.toLowerCase();
        if (aliases.some((a) => hay.includes(a.toLowerCase()))) {
          downstream.endpoints.push(route.path);
        }
      }
      for (const res of pkg.resources || []) {
        if (aliases.some((a) => res.toLowerCase().includes(a.toLowerCase()))) {
          downstream.endpoints.push(`fleetbaseRoutes:${res}`);
        }
      }
    }

    for (const j of jobData?.jobs || []) {
      const h = `${j.className} ${j.shortName} ${j.triggerSource}`.toLowerCase();
      if (aliases.some((a) => h.includes(a.toLowerCase()))) downstream.jobs.push(j.shortName);
    }

    for (const f of eventRuntime?.flows || []) {
      if (aliases.some((a) => f.event.toLowerCase().includes(a.toLowerCase()))) {
        downstream.events.push(f.event);
        downstream.listeners.push(...f.steps.map((s) => s.listener));
      }
    }

    for (const ch of realtime?.channels || []) {
      if (aliases.some((a) => ch.channel.toLowerCase().includes(a.toLowerCase()))) {
        downstream.channels.push(ch.channel);
      }
    }

    for (const row of traceRows || []) {
      if (aliases.some((a) => (row.resource || '').toLowerCase().includes(a.toLowerCase()))) {
        downstream.uiScreens.push(...(row.uiScreens || []).slice(0, 3));
      }
    }

    for (const [fqcn, sym] of semantic?.symbols || []) {
      if (sym.type === 'class' && aliases.some((a) => fqcn.includes(a))) {
        if (fqcn.includes('Policy')) downstream.policies.push(fqcn.split('\\').pop());
      }
    }

    const score =
      downstream.endpoints.length * 2 +
      downstream.jobs.length * 3 +
      downstream.events.length * 2 +
      downstream.listeners.length +
      downstream.channels.length;

    const risk =
      score > 40 ? 'high' : score > 15 ? 'medium' : 'low';

    impacts.push({
      entity,
      downstream,
      risk,
      summary: `${downstream.endpoints.length} API paths, ${downstream.jobs.length} jobs, ${downstream.events.length} events, ${downstream.listeners.length} listeners, ${downstream.channels.length} channels, ${downstream.uiScreens.length} UI specs`,
    });
  }

  return {
    impacts: impacts.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.risk] - order[b.risk];
    }),
    stats: { entities: impacts.length },
  };
}
