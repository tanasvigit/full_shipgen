import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { TrackingStatusForm } from "@/components/fleetops/forms/resources/ResourceForms";

export default function TrackingStatusesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.trackingStatus} FormComponent={TrackingStatusForm} />;
}
