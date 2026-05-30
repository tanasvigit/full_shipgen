import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order } from "@/src/data/types";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { useAuth } from "@/src/contexts/AuthContext";
import { ORDERS_LIST_PARAMS, queryKeys } from "@/src/query/keys";
import { refreshOrderScope } from "@/src/query/invalidation";
import { workflowService } from "@/src/services/workflowService";
import { runOrQueue } from "@/src/services/offlineAware";
import { flushOfflineQueue } from "@/src/offline/processor";

function patchOrderStatus(orders: Order[], orderId: string, status: string) {
  return orders.map((order) => (order.id === orderId ? { ...order, status } : order));
}

function useOrdersOptimisticContext() {
  const queryClient = useQueryClient();
  const { companyUuid } = useCompanyScope();
  const { user } = useAuth();
  const listKey = queryKeys.orders(companyUuid, ORDERS_LIST_PARAMS);

  const snapshot = () => queryClient.getQueryData<Order[]>(listKey);

  const setOrders = (orders: Order[]) => {
    queryClient.setQueryData(listKey, orders);
  };

  return { queryClient, companyUuid, userId: user?.id || "", listKey, snapshot, setOrders };
}

async function settleWorkflow(
  queryClient: ReturnType<typeof useQueryClient>,
  companyUuid: string | null,
  userId: string,
  orderId: string
) {
  if (companyUuid && userId) {
    await flushOfflineQueue(companyUuid);
  }
  await refreshOrderScope(queryClient, companyUuid, orderId);
}

export function useStartTripMutation() {
  const { queryClient, companyUuid, userId, snapshot, setOrders } = useOrdersOptimisticContext();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!companyUuid || !userId) {
        await workflowService.start(orderId);
        return;
      }
      const result = await runOrQueue({
        companyUuid,
        userId,
        type: "workflow.start",
        payload: { orderId },
        dedupeKey: `workflow:start:${companyUuid}:${orderId}`,
        execute: () => workflowService.start(orderId),
      });
      if (result.queued) return { queued: true };
      return { queued: false };
    },
    onMutate: async (orderId) => {
      const previous = snapshot();
      if (previous) {
        setOrders(patchOrderStatus(previous, orderId, "started"));
      }
      return { previous };
    },
    onError: (_error, _orderId, context) => {
      if (context?.previous) {
        setOrders(context.previous);
      }
    },
    onSettled: async (_data, _error, orderId) => {
      await settleWorkflow(queryClient, companyUuid, userId, orderId);
    },
  });
}

export function useAdvanceActivityMutation() {
  const { queryClient, companyUuid, userId, snapshot, setOrders } = useOrdersOptimisticContext();

  return useMutation({
    mutationFn: async ({ orderId, activityCode }: { orderId: string; activityCode?: string }) => {
      if (!companyUuid || !userId) {
        await workflowService.advance(orderId, activityCode);
        return;
      }
      await runOrQueue({
        companyUuid,
        userId,
        type: "workflow.advance",
        payload: { orderId, activityCode },
        dedupeKey: `workflow:advance:${companyUuid}:${orderId}:${activityCode || "next"}`,
        execute: () => workflowService.advance(orderId, activityCode),
      });
    },
    onMutate: async () => {
      const previous = snapshot();
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        setOrders(context.previous);
      }
    },
    onSettled: async (_data, _error, { orderId }) => {
      await settleWorkflow(queryClient, companyUuid, userId, orderId);
    },
  });
}

export function useCompleteOrderMutation() {
  const { queryClient, companyUuid, userId, snapshot, setOrders } = useOrdersOptimisticContext();

  return useMutation({
    mutationFn: async (orderId: string) => {
      if (!companyUuid || !userId) {
        await workflowService.complete(orderId);
        return;
      }
      await runOrQueue({
        companyUuid,
        userId,
        type: "workflow.complete",
        payload: { orderId },
        dedupeKey: `workflow:complete:${companyUuid}:${orderId}`,
        execute: () => workflowService.complete(orderId),
      });
    },
    onMutate: async (orderId) => {
      const previous = snapshot();
      if (previous) {
        setOrders(patchOrderStatus(previous, orderId, "completed"));
      }
      return { previous };
    },
    onError: (_error, _orderId, context) => {
      if (context?.previous) {
        setOrders(context.previous);
      }
    },
    onSettled: async (_data, _error, orderId) => {
      await settleWorkflow(queryClient, companyUuid, userId, orderId);
    },
  });
}
