import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import PartForm, { partValuesFromApi } from "@/components/fleetops/forms/maintenance/PartForm";

export default function PartDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.part}
      FormComponent={PartForm}
      valuesFromApi={partValuesFromApi}
    />
  );
}
