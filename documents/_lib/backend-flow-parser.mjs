/**
 * Documents FleetOps Flow / Activity order state machine from PHP sources.
 */

/**
 * @param {string} content OrderConfig.php or similar
 */
export function parseOrderConfigFlowHelpers(content) {
  const methods = [];
  for (const name of [
    'activities',
    'getCreatedActivity',
    'getDispatchedActivity',
    'getCompletedActivity',
    'getCanceledActivity',
    'getStartedActivity',
    'getNextActivity',
    'getPreviousActivities',
    'getActivity',
  ]) {
    if (content.includes(`function ${name}`)) methods.push(name);
  }
  return methods;
}

/** Standard activity codes referenced in OrderConfig fallbacks. */
export const STANDARD_FLOW_CODES = [
  'created',
  'dispatched',
  'started',
  'completed',
  'canceled',
];

/** Flow JSON shape (stored on order_configs.flow). */
export const FLOW_JSON_SCHEMA = `{
  "activities": [
    {
      "code": "created",
      "status": "created",
      "activities": ["dispatched"],
      "logic": [{ "type": "and|or|if|not", "conditions": [...] }],
      "events": ["order.created"]
    }
  ],
  "created": { ... indexed by code for fast lookup ... }
}`;

/** Activity → Laravel event class resolution (from Flow/Event.php). */
export const FLOW_EVENT_RESOLUTION = [
  'Flow activity `events[]` string → `Fleetbase\\\\FleetOps\\\\Events\\\\{StudlyName}`',
  'Fallback → `Fleetbase\\\\Events\\\\{StudlyName}`',
];

/** Order runtime transitions (from Order model). */
export const ORDER_TRANSITIONS = [
  {
    action: 'updateActivity(Activity)',
    effect: 'insertActivity → setStatus(code) → activity.fireEvents(order)',
  },
  { action: 'dispatch()', effect: 'Sets dispatched; may fire OrderDispatched' },
  { action: 'complete()', effect: 'OrderCompleted event + completed tracking status' },
  { action: 'cancel()', effect: 'Canceled activity + OrderCanceled' },
  {
    action: 'PATCH update-activity/{id}',
    effect: 'Controller advances flow from client-supplied activity',
  },
  {
    action: 'GET next-activity/{id}',
    effect: 'Returns next Activity from OrderConfig flow graph',
  },
];

/**
 * Parse activity codes from a JSON flow file if present in repo.
 * @param {(p: string) => string|null} readSafe
 */
export function tryLoadSampleFlowCodes(readSafe) {
  const candidates = [
    'packages/fleetops/server/seeders/data/default-order-config-flow.json',
    'packages/fleetops/server/resources/default-flow.json',
  ];
  for (const file of candidates) {
    const raw = readSafe(file);
    if (!raw) continue;
    try {
      const json = JSON.parse(raw);
      const codes = new Set();
      if (Array.isArray(json.activities)) {
        for (const a of json.activities) {
          if (a.code) codes.add(a.code);
        }
      }
      if (json && typeof json === 'object') {
        for (const key of Object.keys(json)) {
          if (typeof json[key] === 'object' && json[key]?.code) {
            codes.add(json[key].code);
          }
        }
      }
      if (codes.size) return { file, codes: [...codes].sort() };
    } catch {
      /* ignore */
    }
  }
  return null;
}
