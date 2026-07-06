import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import FleetopsDetailDrawerPage from "@/components/fleetops/detail/FleetopsDetailDrawerPage";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Ban, RefreshCw, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { toast } from "sonner";
import { parseApiError } from "@/lib/errors";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { resolveDetailEntityId, DetailLoadingState } from "@/lib/fleetops/detailEmbedded";

const STOP_STATUSES = ["pending", "arrived", "completed", "skipped", "cancelled"];

function stopOrderLink(stop) {
  const order = stop?.order || stop?.raw?.order;
  const publicId = order?.public_id || order?.publicId;
  if (!publicId) return "—";
  return (
    <Link className="text-[#0066FF] font-mono text-xs" to={`/fleet-ops/orders/${publicId}`}>
      {publicId}
    </Link>
  );
}

export default function ManifestDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const { closeDetail } = useFleetopsDetailDrawer("manifest");
  const [manifest, setManifest] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const raw = await fleetopsService.getManifest(id);
      setManifest(raw);
      const stopRows = raw?.stops || raw?.manifest_stops || raw?.manifestStops || [];
      setStops((stopRows || []).map((s) => mapCrudRow(s, "manifest-stop")));
    } catch (err) {
      toast.error(parseApiError(err, "Failed to load manifest"));
      setManifest(null);
      setStops([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const leaveDetail = useCallback(() => {
    if (embedded) {
      onClose?.();
      closeDetail();
      return;
    }
    navigate("/fleet-ops/admin/manifests");
  }, [closeDetail, embedded, navigate, onClose]);

  const cancelManifest = async () => {
    if (!window.confirm("Cancel this manifest?")) return;
    setBusy(true);
    try {
      await fleetopsService.cancelManifest(id);
      toast.success("Manifest cancelled");
      await load();
    } catch (err) {
      toast.error(parseApiError(err, "Cancel failed"));
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
      leaveDetail();
    } catch (err) {
      toast.error(parseApiError(err, "Delete failed"));
    } finally {
      setBusy(false);
    }
  };

  const updateStopStatus = async (stopId, status) => {
    setBusy(true);
    try {
      await fleetopsService.updateManifestStop(stopId, { status });
      toast.success("Stop updated");
      await load();
    } catch (err) {
      toast.error(parseApiError(err, "Stop update failed"));
    } finally {
      setBusy(false);
    }
  };

  const row = manifest ? mapCrudRow(manifest, "manifest") : null;

  if (loading && !manifest) {
    return (
      <DetailLoadingState embedded={embedded} message="Loading manifest…" testId="manifest-detail-loader" />
    );
  }

  const detailBody = (
    <div className={embedded ? "space-y-4" : "p-6 space-y-4"}>
      {manifest && (
        <div className="bg-white border border-black/[0.08] rounded-md p-5" data-testid="manifest-overview-fields">
          <DetailFieldGrid
            fields={[
              { label: "Public ID", value: row.publicId, mono: true },
              {
                label: "Status",
                value: row.status ? <StatusBadge status={row.status} label={row.status} /> : "—",
              },
              { label: "Driver", value: manifest.driver?.name || manifest.driver_uuid || "—" },
              {
                label: "Vehicle",
                value:
                  manifest.vehicle?.name ||
                  manifest.vehicle?.plate_number ||
                  manifest.vehicle_uuid ||
                  "—",
              },
              {
                label: "Scheduled",
                value: manifest.scheduled_date ? String(manifest.scheduled_date).slice(0, 10) : "—",
              },
              { label: "Stops", value: String(stops.length) },
            ]}
          />
        </div>
      )}
      <section className="bg-white border border-black/[0.08] rounded-md p-5" data-testid="manifest-stops-section">
        <div className="overline mb-3">Manifest stops</div>
        <DataTable
          testid="manifest-stops-table"
          loading={loading}
          data={stops}
          pageSize={10}
          searchKeys={["name", "publicId", "status"]}
          columns={[
            { key: "sequence", header: "Seq", render: (r) => r.raw?.sequence ?? r.raw?.stop_order ?? "—" },
            {
              key: "place",
              header: "Place",
              render: (r) => r.raw?.place?.name || r.raw?.place?.street1 || "—",
            },
            { key: "order", header: "Order", render: (r) => stopOrderLink(r.raw) },
            {
              key: "status",
              header: "Status",
              render: (r) => {
                const stopId = r.raw?.public_id || r.publicId || r.id;
                return (
                  <Select
                    value={String(r.status || "pending")}
                    onValueChange={(v) => updateStopStatus(stopId, v)}
                    disabled={busy}
                  >
                    <SelectTrigger className="h-8 w-[140px]" data-testid={`manifest-stop-status-${stopId}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STOP_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              },
            },
            { key: "publicId", header: "Stop ID", render: (r) => <span className="font-mono text-xs">{r.publicId}</span> },
          ]}
          emptyMessage="No stops on this manifest"
        />
      </section>
    </div>
  );

  if (embedded) {
    return (
      <FleetopsDetailDrawerPage
        testId="manifest-detail-page"
        headerProps={{
          overline: "Manifest",
          title: row?.name || row?.publicId || "Manifest",
          publicId: row?.publicId,
          status: row?.status,
          actions: [
            {
              id: "refresh",
              label: "Refresh",
              icon: <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />,
              onClick: load,
              disabled: loading || busy,
              testId: "manifest-detail-refresh",
            },
            {
              id: "cancel",
              label: "Cancel",
              icon: <Ban className="h-4 w-4 mr-1" />,
              onClick: cancelManifest,
              disabled: busy,
              testId: "manifest-cancel",
            },
          ],
          extraActions: (
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                void deleteManifest();
              }}
              data-testid="manifest-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          ),
        }}
        body={detailBody}
      />
    );
  }

  return (
    <div data-testid="manifest-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Manifests", to: "/fleet-ops/admin/manifests" },
          { label: row?.publicId || id },
        ]}
        overline="Manifest"
        title={row?.name || row?.publicId || "Manifest"}
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
      {detailBody}
    </div>
  );
}
