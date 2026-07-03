import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { TrackingNumberForm, trackingNumberValuesFromApi } from "@/components/fleetops/forms/resources/ResourceForms";

export default function TrackingNumberDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.trackingNumber}
      FormComponent={TrackingNumberForm}
      valuesFromApi={trackingNumberValuesFromApi}
    />
  );
}
