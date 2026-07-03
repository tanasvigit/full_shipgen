import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { EntityForm, entityValuesFromApi } from "@/components/fleetops/forms/resources/ResourceForms";

export default function EntityDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.entity}
      FormComponent={EntityForm}
      valuesFromApi={entityValuesFromApi}
    />
  );
}
