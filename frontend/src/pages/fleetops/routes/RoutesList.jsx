import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function RoutesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fleetopsService.listRoutes());
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load routes");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    {
      key: "id",
      header: "Route",
      render: (row) => (
        <Link className="text-[#0066FF] font-mono text-xs" to={`/fleet-ops/operations/routes/${row.uuid || row.id || row.public_id}`}>
          {row.public_id || row.tracking_number || row.uuid || row.id}
        </Link>
      ),
    },
    { key: "status", header: "Status", render: (row) => row.status || "—" },
    { key: "distance", header: "Distance", render: (row) => row.distance || row.total_distance || "—" },
  ];

  return (
    <div data-testid="routes-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Routes" }]}
        title="Routes"
        description={`${rows.length} routes`}
        actions={
          <Button asChild className="bg-blue-600 hover:bg-blue-700 h-9">
            <Link to="/fleet-ops/operations/routes/new">
              <Plus className="h-4 w-4 mr-1" /> New route
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={rows} loading={loading} testid="routes-table" />
      </div>
    </div>
  );
}
