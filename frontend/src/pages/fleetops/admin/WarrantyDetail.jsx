import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import WarrantyForm, { warrantyValuesFromApi } from "@/components/fleetops/forms/maintenance/WarrantyForm";

export default function WarrantyDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.warranty}
      FormComponent={WarrantyForm}
      valuesFromApi={warrantyValuesFromApi}
    />
  );
}
