import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function DeviceEventDetail() {
  return <FleetopsCrudDetailPage config={{ ...CRUD_ENTITIES.deviceEvent, readOnly: true }} />;
}
