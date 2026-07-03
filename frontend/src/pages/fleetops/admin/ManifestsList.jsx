import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errors";

function manifestLabel(raw) {
  return raw?.public_id || raw?.internal_id || raw?.uuid || "Manifest";
}

export default function ManifestsList() {
  const { openDetail } = useFleetopsDetailDrawer("manifest");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fleetopsService.listManifests();
      setRows((list || []).map((r) => mapCrudRow(r, "manifest")));
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load manifests"));
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
        description={
          loading
            ? "Loading…"
            : `${rows.length} manifests · created via orchestration / dispatch`
        }
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
                <button
                  type="button"
                  className="text-[#0066FF] font-medium font-mono text-xs text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(row.publicId || row.id);
                  }}
                >
                  {manifestLabel(row.raw)}
                </button>
              ),
            },
            {
              key: "driver",
              header: "Driver",
              render: (row) => row.raw?.driver?.name || row.raw?.driver_uuid || "—",
            },
            {
              key: "vehicle",
              header: "Vehicle",
              render: (row) =>
                row.raw?.vehicle?.name ||
                row.raw?.vehicle?.plate_number ||
                row.raw?.vehicle_uuid ||
                "—",
            },
            {
              key: "scheduled",
              header: "Scheduled",
              render: (row) =>
                row.raw?.scheduled_date ? String(row.raw.scheduled_date).slice(0, 10) : "—",
            },
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} label={row.status} /> },
            { key: "publicId", header: "Public ID", render: (row) => <span className="font-mono text-xs">{row.publicId}</span> },
          ]}
          onRowClick={(row) => openDetail(row.publicId || row.id)}
          emptyMessage="No manifests yet — run orchestration or dispatch to generate manifests"
        />
      </div>
    </div>
  );
}
