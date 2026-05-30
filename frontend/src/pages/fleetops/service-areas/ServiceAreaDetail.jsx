import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { fleetopsService } from "@/services/fleetops";
import ServiceAreaMapEditor from "./ServiceAreaMapEditor";
import DataTable from "@/components/common/DataTable";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";

function ServiceAreaRelations({ serviceAreaId }) {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geometry, setGeometry] = useState(null);
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="space-y-6" data-testid="service-area-relations">
      <section className="rounded-md border border-black/[0.08] p-4 space-y-3">
        <div className="overline">Geofence drawing</div>
        <ServiceAreaMapEditor geometry={geometry} onSave={saveGeometry} onDelete={deleteGeometry} busy={saving} />
      </section>
      <section className="rounded-md border border-black/[0.08] p-4 space-y-3">
        <div className="overline">Zones</div>
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
          ]}
        />
      </section>
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
