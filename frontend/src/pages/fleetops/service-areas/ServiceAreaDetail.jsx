import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { fleetopsService } from "@/services/fleetops";
import ServiceAreaMapEditor from "./ServiceAreaMapEditor";
import DataTable from "@/components/common/DataTable";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import ZoneFormDialog from "@/components/fleetops/service-areas/ZoneFormDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

function ServiceAreaRelations({ serviceAreaId }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geometry, setGeometry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zoneDialog, setZoneDialog] = useState({ open: false, row: null });
  const [viewZone, setViewZone] = useState(null);
  const [zoneBusy, setZoneBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [zonesList, shape] = await Promise.all([
        fleetopsService.listServiceAreaZones(serviceAreaId),
        fleetopsService.getServiceAreaGeometry(serviceAreaId),
      ]);
      setZones((zonesList || []).map((row) => mapCrudRow(row, "service-area-zone")));
      setGeometry(shape || null);
    } catch (error) {
      toast.error(error?.friendlyMessage || "Failed to load service area relations.");
      setZones([]);
      setGeometry(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [serviceAreaId]);

  const saveGeometry = async (polygon) => {
    setSaving(true);
    try {
      await fleetopsService.saveServiceAreaGeometry(serviceAreaId, polygon);
      toast.success("Polygon saved");
      await load();
    } catch (error) {
      toast.error(error?.friendlyMessage || "Could not save polygon.");
    } finally {
      setSaving(false);
    }
  };

  const deleteGeometry = async () => {
    setSaving(true);
    try {
      await fleetopsService.deleteServiceAreaGeometry(serviceAreaId);
      toast.success("Polygon deleted");
      await load();
    } catch (error) {
      toast.error(error?.friendlyMessage || "Could not delete polygon.");
    } finally {
      setSaving(false);
    }
  };

  const saveZone = async (values) => {
    setZoneBusy(true);
    try {
      if (zoneDialog.row?.id) {
        await fleetopsService.updateServiceAreaZone(zoneDialog.row.id, values);
        toast.success("Zone updated");
      } else {
        await fleetopsService.createServiceAreaZone({ ...values, service_area_uuid: serviceAreaId });
        toast.success("Zone created");
      }
      setZoneDialog({ open: false, row: null });
      await load();
    } catch (error) {
      toast.error(error?.friendlyMessage || "Zone save failed");
    } finally {
      setZoneBusy(false);
    }
  };

  const deleteZone = async (row) => {
    if (!window.confirm(`Delete zone "${row.name}"?`)) return;
    try {
      await fleetopsService.deleteServiceAreaZone(row.id);
      toast.success("Zone deleted");
      await load();
    } catch (error) {
      toast.error(error?.friendlyMessage || "Could not delete zone");
    }
  };

  return (
    <div className="space-y-6" data-testid="service-area-relations">
      <section className="rounded-md border border-black/[0.08] p-4 space-y-3">
        <div className="overline">Geofence drawing</div>
        <ServiceAreaMapEditor geometry={geometry} onSave={saveGeometry} onDelete={deleteGeometry} busy={saving} />
      </section>
      <section className="rounded-md border border-black/[0.08] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="overline">Zones</div>
          <Button
            size="sm"
            onClick={() => setZoneDialog({ open: true, row: null })}
            data-testid="service-area-zone-add"
          >
            <Plus className="h-4 w-4 mr-1" /> Add zone
          </Button>
        </div>
        <DataTable
          testid="service-area-zones-table"
          loading={loading}
          data={zones}
          pageSize={5}
          searchKeys={["name", "publicId", "status"]}
          columns={[
            { key: "name", header: "Zone", render: (row) => row.name || "Untitled" },
            { key: "status", header: "Status", render: (row) => row.status || "active" },
            { key: "publicId", header: "Public ID", render: (row) => row.publicId || "—" },
            {
              key: "actions",
              header: "",
              render: (row) => (
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setViewZone(row)} data-testid={`zone-view-${row.id}`}>
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoneDialog({ open: true, row })}
                    data-testid={`zone-edit-${row.id}`}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[#B91C1C]" onClick={() => deleteZone(row)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <ZoneFormDialog
        open={zoneDialog.open}
        onOpenChange={(open) => setZoneDialog((s) => ({ ...s, open }))}
        serviceAreaId={serviceAreaId}
        initial={zoneDialog.row}
        busy={zoneBusy}
        onSubmit={saveZone}
      />

      <Dialog open={Boolean(viewZone)} onOpenChange={(open) => !open && setViewZone(null)}>
        <DialogContent data-testid="service-area-zone-view-dialog">
          <DialogHeader>
            <DialogTitle>Zone details</DialogTitle>
          </DialogHeader>
          {viewZone && (
            <dl className="text-sm space-y-2 font-mono">
              <div>
                <dt className="text-[#6B7280] text-xs uppercase">Name</dt>
                <dd>{viewZone.name}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280] text-xs uppercase">Status</dt>
                <dd>{viewZone.status}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280] text-xs uppercase">ID</dt>
                <dd>{viewZone.id}</dd>
              </div>
              <div>
                <dt className="text-[#6B7280] text-xs uppercase">Public ID</dt>
                <dd>{viewZone.publicId || "—"}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ServiceAreaDetail() {
  const { id } = useParams();
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.serviceArea}
      relationSlots={<ServiceAreaRelations serviceAreaId={id} />}
    />
  );
}
