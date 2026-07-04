import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import RouteOptimizationWizard from "@/components/fleetops/routing/RouteOptimizationWizard";

export default function RouteNew() {
  const [searchParams] = useSearchParams();
  const orderIds = searchParams.get("order_ids")?.split(",").filter(Boolean) || [];

  return (
    <div data-testid="route-new-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes", to: "/fleet-ops/operations/routes" }, { label: "New" }]}
        title="Route planner"
        description={
          orderIds.length
            ? `${orderIds.length} orders selected from Orders`
            : "Select orders, optimize stops, and save a route plan"
        }
      />
      <div className="p-6">
        <RouteOptimizationWizard orderIds={orderIds} allowOrderSelection={orderIds.length === 0} />
      </div>
    </div>
  );
}
