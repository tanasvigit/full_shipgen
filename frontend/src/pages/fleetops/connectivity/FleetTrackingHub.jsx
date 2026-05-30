import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapVehicleRow } from "@/lib/mappers";
import { toast } from "sonner";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";
import { resolveCompanyChannelId } from "@/domain/fleetops/realtime/socketConfig";

export default function FleetTrackingHub() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyChannel = resolveCompanyChannelId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, d] = await Promise.all([fleetopsService.listVehicles(), fleetopsService.listDrivers()]);
      setVehicles(v.map(mapVehicleRow));
      setDrivers(d.map(mapDriverRow));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load fleet positions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFleetopsRealtimeChannel(companyChannel, () => load(), {
    enabled: Boolean(companyChannel),
    debounceMs: 800,
  });

  const markers = useMemo(() => {
    const out = [];
    for (const v of vehicles) {
      const lat = v.location?.lat ?? v.latitude;
      const lng = v.location?.lng ?? v.longitude;
      if (lat == null || lng == null) continue;
      out.push({
        id: `vehicle-${v.id}`,
        lat: Number(lat),
        lng: Number(lng),
        label: v.plate || v.name,
        popup: `Vehicle · ${v.name}`,
        color: "#0066FF",
      });
    }
    for (const d of drivers) {
      const lat = d.location?.lat ?? d.latitude;
      const lng = d.location?.lng ?? d.longitude;
      if (lat == null || lng == null) continue;
      out.push({
        id: `driver-${d.id}`,
        lat: Number(lat),
        lng: Number(lng),
        label: d.name,
        popup: `Driver · ${d.name}`,
        color: "#10B981",
      });
    }
    return out;
  }, [vehicles, drivers]);

  return (
    <div data-testid="fleet-tracking-hub">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Connectivity" },
          { label: "Fleet tracking" },
        ]}
        overline="Connectivity"
        title="Fleet tracking"
        description={`${markers.length} live markers`}
        actions={
          <Button variant="outline" onClick={load} data-testid="tracking-refresh">
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        }
      />
      <div className="p-6">
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-[560px]">
          <MapView markers={markers} loading={loading} testid="fleet-tracking-map" zoom={markers.length ? 11 : 8} />
        </div>
        <p className="mt-3 text-xs text-[#4B5563] font-mono">
          Blue = vehicles · Green = drivers · Live refresh via company channel
        </p>
      </div>
    </div>
  );
}
