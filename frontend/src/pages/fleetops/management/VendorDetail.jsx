import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import VendorPersonnelPanel from "@/components/fleetops/vendor/VendorPersonnelPanel";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { useParams } from "react-router-dom";

export default function VendorDetail() {
  const { id } = useParams();
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.vendor}
      relationSlots={
        <div className="space-y-4">
          <VendorPersonnelPanel vendorId={id} />
        </div>
      }
    />
  );
}
