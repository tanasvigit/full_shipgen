import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";

export default function ReportsList() {
  const { can } = useFleetopsPermission();
  const canView = can("view", "report");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const list = await fleetopsService.listReports().catch(() => []);
      if (active) {
        setRows((list || []).map((row) => mapCrudRow(row, "report")));
        setLoading(false);
      }
    };
    if (canView) void load();
    else setLoading(false);
    return () => {
      active = false;
    };
  }, [canView]);

  if (!canView) {
    return <div className="p-8 text-[#374151]" data-testid="report-forbidden">You do not have permission to view reports.</div>;
  }

  return (
    <div data-testid="report-list-page">
      <PageHeader
        overline="Analytics"
        title="Reports"
        description="Query-driven fleet analytics reports with safe empty states."
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
              render: (row) => <Link className="text-[#0066FF]" to={`/fleet-ops/analytics/reports/${row.id}`}>{row.name}</Link>,
            },
            { key: "status", header: "Status", render: (row) => row.status || "ready" },
            { key: "publicId", header: "Public ID", render: (row) => row.publicId || "—" },
          ]}
        />
      </div>
    </div>
  );
}
