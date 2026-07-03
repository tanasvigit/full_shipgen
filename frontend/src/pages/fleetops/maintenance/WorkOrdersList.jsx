import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import WorkOrderForm from "@/components/fleetops/forms/maintenance/WorkOrderForm";

export default function WorkOrdersList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.workOrder} FormComponent={WorkOrderForm} />;
}
