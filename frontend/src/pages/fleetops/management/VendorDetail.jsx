import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import VendorDriversPanel from "@/components/fleetops/vendor/VendorDriversPanel";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";
import { useParams } from "react-router-dom";

export default function VendorDetail({
  embedded = false,
  entityId: entityIdProp,
  onClose,
}) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);

  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={id}
      onClose={onClose}
      config={CRUD_ENTITIES.vendor}
      relationSlots={
        <div className="space-y-4">
          <VendorDriversPanel vendorId={id} />
        </div>
      }
    />
  );
}
