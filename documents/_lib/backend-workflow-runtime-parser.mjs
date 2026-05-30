/**
 * Workflow / Flow runtime graphs (FleetOps orders, payments, inventory).
 */

import {
  FLOW_JSON_SCHEMA,
  ORDER_TRANSITIONS,
  STANDARD_FLOW_CODES,
  tryLoadSampleFlowCodes,
} from './backend-flow-parser.mjs';
import { extractFunctionBody } from './backend-php-utils.mjs';

/**
 * @param {(p: string) => string|null} readSafe
 */
export function buildWorkflowRuntime(readSafe) {
  const flowCodes = tryLoadSampleFlowCodes(readSafe) || [];
  const orderModel = readSafe('packages/fleetops/server/src/Models/Order.php');
  const activity = readSafe('packages/fleetops/server/src/Flow/Activity.php');

  const transitions = [...ORDER_TRANSITIONS];
  if (orderModel) {
    if (orderModel.includes('function dispatch')) transitions.push({ action: 'dispatch()', effect: 'Model method' });
    if (orderModel.includes('function cancel')) transitions.push({ action: 'cancel()', effect: 'Model method' });
  }

  const stateDiagram = buildOrderStateMermaid(STANDARD_FLOW_CODES, flowCodes);

  const paymentFlow = {
    name: 'Ledger payments',
    states: ['pending', 'succeeded', 'failed', 'refunded'],
    triggers: ['Stripe webhook', 'HandleSuccessfulPayment listener'],
    package: 'ledger',
  };

  const dispatchFlow = {
    name: 'Order dispatch',
    states: ['created', 'dispatched', 'started', 'completed', 'canceled'],
    triggers: ['PATCH dispatch', 'driver assignment', 'activity graph'],
    package: 'fleetops',
  };

  return {
    flowJsonSchema: FLOW_JSON_SCHEMA,
    sampleFlowCodes: flowCodes,
    orderTransitions: transitions,
    stateDiagramMermaid: stateDiagram,
    flowchartMermaid: buildDispatchFlowchart(),
    domains: [dispatchFlow, paymentFlow],
    activityParser: activity
      ? {
          hasLogic: activity.includes('logic'),
          hasEvents: activity.includes('fireEvents'),
        }
      : null,
    stats: {
      standardCodes: STANDARD_FLOW_CODES.length,
      sampleCodesLoaded: flowCodes.length,
    },
  };
}

function buildOrderStateMermaid(codes, sampleCodes) {
  const states = sampleCodes.length ? sampleCodes : codes;
  const lines = ['stateDiagram-v2', '  [*] --> created'];
  const flow = ['created', 'dispatched', 'started', 'completed'];
  for (let i = 0; i < flow.length - 1; i++) {
    if (states.includes(flow[i]) && states.includes(flow[i + 1])) {
      lines.push(`  ${flow[i]} --> ${flow[i + 1]}`);
    }
  }
  lines.push('  created --> canceled');
  lines.push('  dispatched --> canceled');
  lines.push('  started --> canceled');
  return lines.join('\n');
}

function buildDispatchFlowchart() {
  return `flowchart TD
  A[Order created] --> B{pod_required?}
  B -->|yes| C[Require pod_method]
  B -->|no| D[Validate payload]
  D --> E{has driver?}
  E -->|no adhoc| F[OrderDispatchFailed]
  E -->|yes| G[Insert DISPATCHED tracking]
  G --> H[OrderDispatched event]
  H --> I[Listeners + webhooks + notify]`;
}
