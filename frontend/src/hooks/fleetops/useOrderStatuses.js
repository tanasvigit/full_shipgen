import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { sanitizeOrderStatusList } from "@/domain/fleetops/status";
import { extractStatusesFromFlow } from "@/lib/fleetops/orderConfig";

/** Distinct order statuses from API with static fallback. */
export function useOrderStatuses(orderConfigId) {
  const [statuses, setStatuses] = useState(sanitizeOrderStatusList([]));
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(orderConfigId ? { order_config_uuid: orderConfigId } : {}),
        include_order_config_activities: false,
      };
      const rows = await fleetopsService.getOrderStatuses(params);
      let normalized = sanitizeOrderStatusList(rows);

      if (!normalized.length) {
        const configs = await fleetopsService.listOrderConfigs();
        const fromConfigs = new Set();
        for (const cfg of configs || []) {
          if (cfg?.flow) extractStatusesFromFlow(cfg.flow).forEach((s) => fromConfigs.add(s));
        }
        normalized = sanitizeOrderStatusList([...fromConfigs]);
      }

      setStatuses(normalized);
    } catch {
      setStatuses(sanitizeOrderStatusList([]));
    } finally {
      setLoading(false);
    }
  }, [orderConfigId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { statuses, loading, reload };
}
