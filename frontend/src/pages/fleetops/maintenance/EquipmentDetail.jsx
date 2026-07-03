import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import EquipmentForm, { equipmentValuesFromApi } from "@/components/fleetops/forms/maintenance/EquipmentForm";

export default function EquipmentDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.equipment}
      FormComponent={EquipmentForm}
      valuesFromApi={equipmentValuesFromApi}
    />
  );
}
