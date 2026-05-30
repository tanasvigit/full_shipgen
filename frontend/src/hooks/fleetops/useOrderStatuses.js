import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { ORDER_STATUSES, normalizeStatus } from "@/domain/fleetops/status";
import { extractStatusesFromFlow } from "@/lib/fleetops/orderConfig";

const FALLBACK_STATUSES = ORDER_STATUSES.filter((s) => s !== "cancelled");

/** Distinct order statuses from API with static fallback. */
export function useOrderStatuses(orderConfigId) {
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = orderConfigId ? { order_config_uuid: orderConfigId } : {};
      const rows = await fleetopsService.getOrderStatuses(params);
      let normalized = [...new Set((rows || []).map((s) => normalizeStatus(s)).filter(Boolean))];

      if (!normalized.length) {
        const configs = await fleetopsService.listOrderConfigs();
        const fromConfigs = new Set();
        for (const cfg of configs || []) {
          if (cfg?.flow) extractStatusesFromFlow(cfg.flow).forEach((s) => fromConfigs.add(s));
        }
        normalized = [...fromConfigs];
      }

      if (normalized.length) setStatuses(normalized);
      else setStatuses(FALLBACK_STATUSES);
    } catch {
      setStatuses(FALLBACK_STATUSES);
    } finally {
      setLoading(false);
    }
  }, [orderConfigId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { statuses, loading, reload };
}
