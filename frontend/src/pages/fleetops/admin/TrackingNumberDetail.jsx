import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function TrackingNumberDetail() {
  return <FleetopsCrudDetailPage config={CRUD_ENTITIES.trackingNumber} />;
}
