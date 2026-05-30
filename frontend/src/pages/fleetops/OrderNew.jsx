import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OrderCreateDialog from "@/components/fleetops/orders/OrderCreateDialog";

/** Deep-link route: opens create-order modal (Dashboard, routing, legacy /new URLs). */
export default function OrderNew() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) navigate("/fleet-ops/operations/orders", { replace: true });
  };

  return (
    <div data-testid="order-new-page" className="min-h-[1px]">
      <OrderCreateDialog open={open} onOpenChange={handleOpenChange} />
    </div>
  );
}
