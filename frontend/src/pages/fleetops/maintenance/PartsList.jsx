import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import PartForm from "@/components/fleetops/forms/maintenance/PartForm";

export default function PartsList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.part} FormComponent={PartForm} />;
}
