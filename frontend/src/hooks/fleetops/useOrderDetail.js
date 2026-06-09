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
import { isOrderAlreadyDispatched } from "@/domain/fleetops/guards/orderGuards";
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
    for (const key of ["driver_assigned", "driverAssigned", "driver", "assigned_driver"]) {
      const d = rawOrder?.[key];
      if (d && typeof d === "object") return mapDriverRow(d);
    }
    return null;
  }, [rawOrder]);

  const vehicle = useMemo(() => {
    for (const key of ["vehicle_assigned", "vehicleAssigned", "vehicle"]) {
      const v = rawOrder?.[key];
      if (v && typeof v === "object") return mapVehicleRow(v);
    }
    return null;
  }, [rawOrder]);

  const runOrderTransition = useCallback(
    async (actionOrId, messages = {}) => {
      const transition =
        typeof actionOrId === "string" ? getTransitionById(actionOrId) : actionOrId;
      if (!transition || !orderId) return { ok: false };

      if (transition.id === "dispatch" && isOrderAlreadyDispatched(rawOrder)) {
        return { ok: true, skipped: true };
      }

      const nextCode = nextActivity?.code || nextActivity?.activity?.code;
      const patch = optimisticPatchForTransition(transition);

      const result = await run({
        id: transition.id,
        apply: () => {
          const prev = rawOrder;
          setRawOrder((o) => {
            if (!o) return o;
            const next = { ...o, ...patch };
            if (transition.id === "dispatch") {
              next.dispatched = true;
              next.dispatched_at = next.dispatched_at || new Date().toISOString();
            }
            return next;
          });
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
