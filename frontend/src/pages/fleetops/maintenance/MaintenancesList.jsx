import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import MaintenanceRecordForm from "@/components/fleetops/forms/maintenance/MaintenanceRecordForm";

export default function MaintenancesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.maintenance} FormComponent={MaintenanceRecordForm} />;
}
