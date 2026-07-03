import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import SendWorkOrderEmailDialog from "@/components/fleetops/maintenance/SendWorkOrderEmailDialog";
import WorkOrderForm, { workOrderValuesFromApi } from "@/components/fleetops/forms/maintenance/WorkOrderForm";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

export default function WorkOrderDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={id}
      onClose={onClose}
      config={CRUD_ENTITIES.workOrder}
      FormComponent={WorkOrderForm}
      valuesFromApi={workOrderValuesFromApi}
      relationSlots={
        <div className="mt-4" data-testid="work-order-actions">
          <SendWorkOrderEmailDialog workOrderId={id} />
        </div>
      }
    />
  );
}
