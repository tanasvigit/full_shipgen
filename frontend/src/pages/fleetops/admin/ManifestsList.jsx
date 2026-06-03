import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { toast } from "sonner";

export default function ManifestsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fleetopsService.listManifests();
      setRows((list || []).map((r) => mapCrudRow(r, "manifest")));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load manifests");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div data-testid="manifests-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Manifests" }]}
        overline="Resources"
        title="Manifests"
        description={loading ? "Loading…" : `${rows.length} manifests`}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={load} disabled={loading} data-testid="manifests-refresh">
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />
      <div className="p-6">
        <DataTable
          testid="manifests-table"
          loading={loading}
          data={rows}
          pageSize={10}
          searchKeys={["name", "publicId", "status"]}
          columns={[
            {
              key: "name",
              header: "Manifest",
              render: (row) => (
                <Link className="text-[#0066FF] font-medium font-mono text-xs" to={`/fleet-ops/admin/manifests/${row.id}`}>
                  {row.name}
                </Link>
              ),
            },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} label={row.status} /> },
            { key: "publicId", header: "Public ID", render: (row) => <span className="font-mono text-xs">{row.publicId}</span> },
          ]}
          onRowClick={(row) => navigate(`/fleet-ops/admin/manifests/${row.id}`)}
          emptyMessage="No manifests yet"
        />
      </div>
    </div>
  );
}
