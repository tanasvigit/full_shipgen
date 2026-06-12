import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import VendorDriversPanel from "@/components/fleetops/vendor/VendorDriversPanel";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { useParams } from "react-router-dom";

export default function VendorDetail() {
  const { id } = useParams();
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.vendor}
      relationSlots={
        <div className="space-y-4">
          <VendorDriversPanel vendorId={id} />
        </div>
      }
    />
  );
}
