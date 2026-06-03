import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import MaintenanceLineItemsPanel from "@/components/fleetops/maintenance/MaintenanceLineItemsPanel";
import { fleetopsService } from "@/services/fleetops";

export default function MaintenanceDetail() {
  const { id } = useParams();
  const [maintenanceApi, setMaintenanceApi] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setMaintenanceApi(await fleetopsService.getMaintenance(id));
    } catch {
      setMaintenanceApi(null);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.maintenance}
      relationSlots={<MaintenanceLineItemsPanel maintenanceId={id} maintenanceApi={maintenanceApi} />}
    />
  );
}
