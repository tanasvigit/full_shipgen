import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { PayloadForm } from "@/components/fleetops/forms/resources/ResourceForms";

export default function PayloadsList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.payload} FormComponent={PayloadForm} />;
}
