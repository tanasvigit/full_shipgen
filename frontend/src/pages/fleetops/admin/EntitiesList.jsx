import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function EntitiesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.entity} />;
}
