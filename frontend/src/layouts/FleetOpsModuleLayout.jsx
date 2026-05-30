import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import FleetOpsDetailHost from "@/components/fleetops/detail/FleetOpsDetailHost";
import { fleetopsRealtimeManager } from "@/domain/fleetops/realtime/registry";
import { resolveCompanyChannelId } from "@/domain/fleetops/realtime/socketConfig";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";

/**
 * FleetOps list + drawer shell — keeps list routes mounted while detail opens via query params.
 */
export default function FleetOpsModuleLayout() {
  useEffect(() => {
    void fleetopsRealtimeManager.connect();
  }, []);

  const companyChannel = resolveCompanyChannelId();
  useFleetopsRealtimeChannel(companyChannel, undefined, {
    enabled: Boolean(companyChannel),
    debounceMs: 500,
  });

  return (
    <>
      <Outlet />
      <FleetOpsDetailHost />
    </>
  );
}
