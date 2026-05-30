import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function SensorsList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.sensor} />;
}
