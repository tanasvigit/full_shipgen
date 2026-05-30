import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function ServiceRatesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fleetopsService.listServiceRates());
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load service rates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <Link className="text-[#0066FF]" to={`/fleet-ops/operations/service-rates/${row.uuid || row.id}`}>
          {row.name || row.public_id || row.id}
        </Link>
      ),
    },
    { key: "service_type", header: "Type", render: (row) => row.service_type || "—" },
    { key: "base_fee", header: "Base fee", render: (row) => row.base_fee ?? row.amount ?? "—" },
  ];

  return (
    <div data-testid="service-rates-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Service rates" }]}
        title="Service rates"
        actions={
          <Button asChild className="bg-blue-600 h-9">
            <Link to="/fleet-ops/operations/service-rates/new">
              <Plus className="h-4 w-4 mr-1" /> New rate
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={rows} loading={loading} testid="service-rates-table" />
      </div>
    </div>
  );
}
