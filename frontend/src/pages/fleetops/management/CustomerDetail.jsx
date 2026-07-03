import { useState } from "react";
import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import ResetCustomerCredentialsDialog from "@/components/fleetops/customer/ResetCustomerCredentialsDialog";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

export default function CustomerDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const { can } = useFleetopsPermission();
  const [resetOpen, setResetOpen] = useState(false);
  const canReset = can("update", "customer");

  return (
    <>
      <FleetopsCrudDetailPage
        embedded={embedded}
        entityId={id}
        onClose={onClose}
        config={CRUD_ENTITIES.customer}
        relationSlots={
          canReset ? (
            <div className="bg-[#F5F6F8] border border-black/[0.08] rounded-md p-4 mt-4">
              <div className="overline mb-3">Portal access</div>
              <Button variant="outline" size="sm" onClick={() => setResetOpen(true)} data-testid="customer-reset-credentials">
                <KeyRound className="h-3.5 w-3.5 mr-1" /> Reset credentials
              </Button>
            </div>
          ) : null
        }
      />
      <ResetCustomerCredentialsDialog open={resetOpen} onOpenChange={setResetOpen} customerId={id} />
    </>
  );
}
