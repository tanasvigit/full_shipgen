import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { DeviceForm } from "@/components/fleetops/forms/connectivity/ConnectivityForms";

export default function DevicesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.device} FormComponent={DeviceForm} />;
}
