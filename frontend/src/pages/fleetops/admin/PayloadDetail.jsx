import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { PayloadForm, payloadValuesFromApi } from "@/components/fleetops/forms/resources/ResourceForms";

export default function PayloadDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.payload}
      FormComponent={PayloadForm}
      valuesFromApi={payloadValuesFromApi}
    />
  );
}
