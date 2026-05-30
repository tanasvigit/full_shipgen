import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import MapView from "@/components/common/MapView";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export default function RouteDetail() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRoute(await fleetopsService.getRoute(id));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Route not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const optimize = async () => {
    setBusy(true);
    try {
      await fleetopsService.optimizeRoutes({ route_uuid: id });
      toast.success("Route optimized");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Optimize failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="route-detail-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes", to: "/fleet-ops/operations/routes" }, { label: id }]}
        title={route?.public_id || route?.tracking_number || "Route"}
        description={route?.status || ""}
        actions={
          <Button variant="outline" disabled={busy} onClick={optimize} data-testid="route-optimize">
            <Sparkles className="h-4 w-4 mr-1" /> Optimize
          </Button>
        }
      />
      <div className="p-6">
        <div className="h-[480px] border border-black/[0.08] rounded-md overflow-hidden bg-white">
          <MapView loading={loading} testid="route-detail-map" />
        </div>
      </div>
    </div>
  );
}
