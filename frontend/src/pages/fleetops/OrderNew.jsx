import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import OrderCreateDialog from "@/components/fleetops/orders/OrderCreateDialog";
import OrderImportDialog from "@/components/fleetops/orders/OrderImportDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

/** Deep-link route: opens create-order modal (Dashboard, routing, legacy /new URLs). */
export default function OrderNew() {
  const navigate = useNavigate();
  const ability = useFleetopsAbility();
  const [open, setOpen] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) navigate("/fleet-ops/operations/orders", { replace: true });
  };

  return (
    <div data-testid="order-new-page" className="min-h-[1px] p-6 space-y-4">
      {ability.canImportOrder && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 bg-transparent border-black/[0.08]"
            onClick={() => setImportOpen(true)}
            data-testid="order-new-import-button"
          >
            <Upload className="h-4 w-4 mr-1" /> Import spreadsheet
          </Button>
        </div>
      )}
      <OrderCreateDialog open={open} onOpenChange={handleOpenChange} />
      <OrderImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => navigate("/fleet-ops/operations/orders", { replace: true })}
      />
    </div>
  );
}
