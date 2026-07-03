import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { TrackingStatusForm, trackingStatusValuesFromApi } from "@/components/fleetops/forms/resources/ResourceForms";

export default function TrackingStatusDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.trackingStatus}
      FormComponent={TrackingStatusForm}
      valuesFromApi={trackingStatusValuesFromApi}
    />
  );
}
