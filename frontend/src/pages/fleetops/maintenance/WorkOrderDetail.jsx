import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import SendWorkOrderEmailDialog from "@/components/fleetops/maintenance/SendWorkOrderEmailDialog";

export default function WorkOrderDetail() {
  const { id } = useParams();
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.workOrder}
      relationSlots={
        <div className="mt-4" data-testid="work-order-actions-panel">
          <SendWorkOrderEmailDialog workOrderId={id} />
        </div>
      }
    />
  );
}
