import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { SensorForm } from "@/components/fleetops/forms/connectivity/ConnectivityForms";

export default function SensorsList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.sensor} FormComponent={SensorForm} />;
}
