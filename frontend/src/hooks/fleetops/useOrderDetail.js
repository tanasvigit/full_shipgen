import { useCallback, useEffect, useMemo, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { filesService } from "@/services/files";
import { mapOrder, mapDriverRow, mapVehicleRow } from "@/lib/mappers";
import { eventsFromOrder, createSyntheticEvent } from "@/domain/fleetops/events/transformers";
import {
  executeOrderTransition,
  optimisticPatchForTransition,
  getTransitionById,
} from "@/domain/fleetops/workflows/orderWorkflow";
import { invalidateAfterOrderMutation } from "@/domain/fleetops/mutations/orchestrator";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { fleetopsCacheKeys } from "@/domain/fleetops/cache/keys";
import { useMutationOrchestrator } from "./useMutationOrchestrator";

export function useOrderDetail(orderId) {
  const [rawOrder, setRawOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextActivity, setNextActivity] = useState(null);
  const [eta, setEta] = useState(null);
  const [optimisticEvents, setOptimisticEvents] = useState([]);
  const { pending: actionPending, run } = useMutationOrchestrator(`order:${orderId || "none"}`);

  const refetch = useCallback(async () => {
    if (!orderId) return null;
    const raw = await fleetopsService.getOrder(orderId);
    setRawOrder(raw);
    setOptimisticEvents([]);
    try {
      const next = await fleetopsService.getNextActivity(orderId);
      setNextActivity(next);
    } catch {
      setNextActivity(null);
    }
    try {
      const etaData = await fleetopsService.getOrderEta(orderId);
      setEta(etaData);
    } catch {
      setEta(null);
    }
    return raw;
  }, [orderId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await refetch();
      } catch (err) {
        if (!active) return;
        setError(err);
        setRawOrder(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [refetch]);

  useEffect(() => {
    if (!orderId) return undefined;
    const detailKey = fleetopsCacheKeys.orders.detail(orderId);
    return fleetopsCache.subscribe((key) => {
      const keyStr = Array.isArray(key) ? key.join(":") : String(key);
      if (keyStr.includes(String(orderId))) refetch();
    });
  }, [orderId, refetch]);

  const order = useMemo(() => (rawOrder ? mapOrder(rawOrder) : null), [rawOrder]);

  const activities = useMemo(() => {
    const base = eventsFromOrder(rawOrder);
    const merged = [...optimisticEvents, ...base];
    const seen = new Set();
    return merged.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }, [rawOrder, optimisticEvents]);

  const files = useMemo(
    () => filesService.normalizeList(rawOrder?.files || rawOrder?.documents || []),
    [rawOrder],
  );

  const driver = useMemo(() => {
    const d = rawOrder?.driver || rawOrder?.assigned_driver;
    return d ? mapDriverRow(d) : null;
  }, [rawOrder]);

  const vehicle = useMemo(() => {
    const v = rawOrder?.vehicle || rawOrder?.vehicle_assigned;
    return v ? mapVehicleRow(v) : null;
  }, [rawOrder]);

  const runOrderTransition = useCallback(
    async (actionOrId, messages = {}) => {
      const transition =
        typeof actionOrId === "string" ? getTransitionById(actionOrId) : actionOrId;
      if (!transition || !orderId) return { ok: false };

      const nextCode = nextActivity?.code || nextActivity?.activity?.code;
      const patch = optimisticPatchForTransition(transition);

      const result = await run({
        id: transition.id,
        apply: () => {
          const prev = rawOrder;
          setRawOrder((o) => (o ? { ...o, ...patch } : o));
          if (transition.to || transition.method) {
            setOptimisticEvents((evts) => [
              createSyntheticEvent({
                code: transition.to || transition.method,
                title: `${transition.label} (pending)`,
              }),
              ...evts,
            ]);
          }
          return prev;
        },
        commit: () =>
          executeOrderTransition(orderId, transition, { nextActivityCode: nextCode }),
        rollback: (prev) => {
          setRawOrder(prev);
          setOptimisticEvents([]);
        },
        invalidate: () => invalidateAfterOrderMutation(orderId),
        successMessage: messages.success || `${transition.label} completed`,
        errorMessage: messages.error || `${transition.label} failed — reverted`,
      });

      if (result?.ok) await refetch();
      return result;
    },
    [orderId, rawOrder, nextActivity, run, refetch],
  );

  /** @deprecated Use runOrderTransition — kept for gradual migration */
  const optimisticOrderUpdate = useCallback(
    (patch, apiCall, messages = {}) =>
      run({
        id: "legacy-patch",
        apply: () => {
          const prev = rawOrder;
          setRawOrder((o) => (o ? { ...o, ...patch } : o));
          return prev;
        },
        commit: apiCall,
        rollback: (prev) => setRawOrder(prev),
        invalidate: () => invalidateAfterOrderMutation(orderId),
        successMessage: messages.success,
        errorMessage: messages.error,
      }).then(async (result) => {
        if (result?.ok) await refetch();
        return result;
      }),
    [rawOrder, run, refetch, orderId],
  );

  const mergeActivities = useCallback(
    (liveEvents = []) => {
      const merged = [...liveEvents, ...activities];
      const seen = new Set();
      return merged.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });
    },
    [activities],
  );

  return {
    orderId,
    rawOrder,
    order,
    driver,
    vehicle,
    activities,
    mergeActivities,
    files,
    nextActivity,
    eta,
    loading,
    error,
    actionPending,
    refetch,
    setRawOrder,
    runOrderTransition,
    optimisticOrderUpdate,
  };
}
