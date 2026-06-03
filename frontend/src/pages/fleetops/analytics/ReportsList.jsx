import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { toast } from "sonner";

export default function ReportsList() {
  const navigate = useNavigate();
  const { can } = useFleetopsPermission();
  const canView = can("view", "report");
  const canCreate = can("create", "report");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const list = await fleetopsService.listReports().catch(() => []);
    setRows((list || []).map((row) => mapCrudRow(row, "report")));
    setLoading(false);
  };

  useEffect(() => {
    if (canView) void load();
    else setLoading(false);
  }, [canView]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete report ${row.name}?`)) return;
    try {
      await fleetopsService.deleteReport(row.id);
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Delete failed");
    }
  };

  if (!canView) {
    return <div className="p-8 text-[#374151]" data-testid="report-forbidden">You do not have permission to view reports.</div>;
  }

  return (
    <div data-testid="report-list-page">
      <PageHeader
        overline="Analytics"
        title="Reports"
        description="Build, run, and export fleet analytics reports."
        actions={
          canCreate ? (
            <Button asChild className="bg-[#0066FF]">
              <Link to="/fleet-ops/analytics/reports/new" data-testid="report-new-button">
                <Plus className="h-4 w-4 mr-1" /> New report
              </Link>
            </Button>
          ) : null
        }
      />
      <div className="p-6">
        <DataTable
          testid="report-table"
          data={rows}
          loading={loading}
          searchKeys={["name", "publicId", "status"]}
          columns={[
            {
              key: "name",
              header: "Report",
              render: (row) => (
                <Link className="text-[#0066FF]" to={`/fleet-ops/analytics/reports/${row.id}`}>
                  {row.name}
                </Link>
              ),
            },
            { key: "status", header: "Status", render: (row) => row.status || "ready" },
            {
              key: "actions",
              header: "",
              render: (row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/fleet-ops/analytics/reports/${row.id}/result`)} data-testid={`report-run-${row.id}`}>
                    Run
                  </Button>
                  {canCreate && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(row)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
