import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function RouteNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIds = searchParams.get("order_ids")?.split(",").filter(Boolean) || [];
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const result = await fleetopsService.createRoute({ order_uuids: orderIds });
      const id = result?.uuid || result?.id || result?.public_id;
      if (orderIds.length) {
        try {
          await fleetopsService.optimizeRoutes({ orders: orderIds });
          toast.success("Route created and optimized");
        } catch {
          toast.success("Route created (optimize pending)");
        }
      } else {
        toast.success("Route created");
      }
      navigate(id ? `/fleet-ops/operations/routes/${id}` : "/fleet-ops/operations/routes");
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="route-new-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes", to: "/fleet-ops/operations/routes" }, { label: "New" }]}
        title="New route"
        description={orderIds.length ? `${orderIds.length} orders selected` : "Create a route plan"}
      />
      <div className="p-6 space-y-4">
        <p className="text-sm text-[#374151]">
          {orderIds.length
            ? `Will plan route for orders: ${orderIds.join(", ")}`
            : "Create an empty route or select orders from the list first."}
        </p>
        <Button disabled={busy} onClick={handleCreate} data-testid="route-create-submit">
          {busy ? "Creating…" : "Create & optimize"}
        </Button>
      </div>
    </div>
  );
}
