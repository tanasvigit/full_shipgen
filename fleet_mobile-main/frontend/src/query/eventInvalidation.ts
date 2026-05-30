import type { QueryClient } from "@tanstack/react-query";
import type { RealtimeEventName, RealtimeMessage } from "@/src/realtime/eventRouter";
import {
  invalidateFleetAggregate,
  invalidateOrderLists,
  refreshOrderScope,
} from "@/src/query/invalidation";
import { queryKeys } from "@/src/query/keys";

function orderRefFromData(data: Record<string, unknown>) {
  return String(data.uuid || data.id || data.public_id || data.order_uuid || "");
}

export async function invalidateForRealtimeEvent(
  queryClient: QueryClient,
  companyUuid: string | null,
  message: RealtimeMessage
) {
  if (!companyUuid) return;

  const orderRef = orderRefFromData(message.data);

  switch (message.event as RealtimeEventName) {
    case "order.updated":
    case "order.completed":
    case "order.canceled":
      if (orderRef) {
        await refreshOrderScope(queryClient, companyUuid, orderRef);
      } else {
        await invalidateOrderLists(queryClient, companyUuid);
      }
      return;
    case "driver.assigned":
    case "driver.unassigned":
      await invalidateOrderLists(queryClient, companyUuid);
      return;
    case "tracking.updated":
      if (orderRef) {
        await refreshOrderScope(queryClient, companyUuid, orderRef);
      } else {
        await invalidateOrderLists(queryClient, companyUuid);
      }
      return;
    case "notification.created":
      await queryClient.invalidateQueries({ queryKey: queryKeys.fleet(companyUuid), exact: true });
      await invalidateFleetAggregate(queryClient, companyUuid);
      return;
    default:
      return;
  }
}
