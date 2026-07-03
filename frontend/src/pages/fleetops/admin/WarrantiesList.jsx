import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import WarrantyForm from "@/components/fleetops/forms/maintenance/WarrantyForm";

export default function WarrantiesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.warranty} FormComponent={WarrantyForm} />;
}
