import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function FuelReportsList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.fuelReport} />;
}
