import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { EntityForm } from "@/components/fleetops/forms/resources/ResourceForms";

export default function EntitiesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.entity} FormComponent={EntityForm} />;
}
