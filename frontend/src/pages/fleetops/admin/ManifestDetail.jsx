import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, RefreshCw, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { toast } from "sonner";

export default function ManifestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fleetopsService.getManifest(id);
      setManifest(raw);
      const stopRows = raw?.stops || raw?.manifest_stops || raw?.manifestStops || [];
      setStops((stopRows || []).map((s) => mapCrudRow(s, "manifest-stop")));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load manifest");
      setManifest(null);
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancelManifest = async () => {
    if (!window.confirm("Cancel this manifest?")) return;
    setBusy(true);
    try {
      await fleetopsService.cancelManifest(id);
      toast.success("Manifest cancelled");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Cancel failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteManifest = async () => {
    if (!window.confirm("Delete this manifest permanently?")) return;
    setBusy(true);
    try {
      await fleetopsService.deleteManifest(id);
      toast.success("Manifest deleted");
      navigate("/fleet-ops/admin/manifests");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const row = manifest ? mapCrudRow(manifest, "manifest") : null;

  return (
    <div data-testid="manifest-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Manifests", to: "/fleet-ops/admin/manifests" },
          { label: row?.publicId || id },
        ]}
        overline="Manifest"
        title={row?.name || "Manifest"}
        description={row?.status ? <StatusBadge status={row.status} label={row.status} /> : null}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/fleet-ops/admin/manifests">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <Button variant="outline" onClick={load} disabled={loading || busy} data-testid="manifest-detail-refresh">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" onClick={cancelManifest} disabled={busy} data-testid="manifest-cancel">
              <Ban className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button variant="outline" className="text-[#B91C1C]" onClick={deleteManifest} disabled={busy} data-testid="manifest-delete">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        {manifest && (
          <DetailFieldGrid
            fields={[
              { label: "Public ID", value: row.publicId },
              { label: "Status", value: row.status },
              { label: "Driver", value: manifest.driver_uuid || manifest.driver?.name || "—" },
              { label: "Vehicle", value: manifest.vehicle_uuid || manifest.vehicle?.name || "—" },
            ]}
          />
        )}
        <section className="rounded-md border border-black/[0.08] p-4" data-testid="manifest-stops-section">
          <div className="overline mb-3">Manifest stops (G080)</div>
          <DataTable
            testid="manifest-stops-table"
            loading={loading}
            data={stops}
            pageSize={10}
            searchKeys={["name", "publicId", "status"]}
            columns={[
              { key: "name", header: "Stop", render: (r) => r.name || r.publicId },
              { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={r.status} /> },
              { key: "sequence", header: "Seq", render: (r) => r.raw?.sequence ?? r.raw?.stop_order ?? "—" },
            ]}
            emptyMessage="No stops on this manifest"
          />
        </section>
      </div>
    </div>
  );
}
