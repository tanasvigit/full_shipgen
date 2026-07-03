import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import MaintenanceLineItemsPanel from "@/components/fleetops/maintenance/MaintenanceLineItemsPanel";
import { fleetopsService } from "@/services/fleetops";
import MaintenanceRecordForm, {
  maintenanceRecordValuesFromApi,
} from "@/components/fleetops/forms/maintenance/MaintenanceRecordForm";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

export default function MaintenanceDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
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
      embedded={embedded}
      entityId={id}
      onClose={onClose}
      config={CRUD_ENTITIES.maintenance}
      FormComponent={MaintenanceRecordForm}
      valuesFromApi={maintenanceRecordValuesFromApi}
      relationSlots={<MaintenanceLineItemsPanel maintenanceId={id} maintenanceApi={maintenanceApi} />}
    />
  );
}
