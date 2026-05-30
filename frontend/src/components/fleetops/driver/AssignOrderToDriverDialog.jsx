import { useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function AssignOrderToDriverDialog({ open, onOpenChange, driverId, driverName }) {
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fleetopsService.listOrders({ limit: 50 }).then((list) => {
      const rows = Array.isArray(list) ? list : list?.data || [];
      setOrders(rows.filter((o) => !o.driver_uuid && !o.driver_id));
    });
  }, [open]);

  const submit = async () => {
    if (!orderId) {
      setError("Select an order");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fleetopsService.assignOrderToDriver(driverId, orderId);
      toast.success(`Order assigned to ${driverName || "driver"}`);
      onOpenChange(false);
    } catch (err) {
      setError(err?.friendlyMessage || "Assignment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign order"
      description={`Assign an unassigned order to ${driverName || "this driver"}.`}
      submitLabel="Assign"
      busy={busy}
      error={error}
      onSubmit={submit}
      testId="assign-order-to-driver-dialog"
    >
      <Select value={orderId} onValueChange={setOrderId}>
        <SelectTrigger data-testid="assign-order-select">
          <SelectValue placeholder="Select order" />
        </SelectTrigger>
        <SelectContent>
          {orders.map((o) => {
            const id = String(o.uuid || o.id);
            return (
              <SelectItem key={id} value={id}>
                {o.public_id || o.tracking_number || id}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </FleetOpsFormDialog>
  );
}
