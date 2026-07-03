import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import EquipmentForm from "@/components/fleetops/forms/maintenance/EquipmentForm";

export default function EquipmentList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.equipment} FormComponent={EquipmentForm} />;
}
