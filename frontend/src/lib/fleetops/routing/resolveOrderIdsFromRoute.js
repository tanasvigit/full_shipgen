/**
 * Resolve orchestrator order public_ids from a route record.
 */
export function resolveOrderIdsFromRoute(route = {}) {
  const fromAssignments = (route?.details?.assignments || [])
    .map((row) => row?.order_id || row?.orderId)
    .filter(Boolean);

  if (fromAssignments.length) {
    return [...new Set(fromAssignments.map(String))];
  }

  if (route?.order_public_id) return [String(route.order_public_id)];
  if (route?.order?.public_id) return [String(route.order.public_id)];

  return [];
}
