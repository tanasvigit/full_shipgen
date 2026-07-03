import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { TrackingNumberForm } from "@/components/fleetops/forms/resources/ResourceForms";

export default function TrackingNumbersList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.trackingNumber} FormComponent={TrackingNumberForm} />;
}
