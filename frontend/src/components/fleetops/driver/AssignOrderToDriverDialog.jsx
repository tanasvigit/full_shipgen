import { useEffect, useMemo, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function AssignOrderToDriverDialog({ open, onOpenChange, driverId, driverName }) {
  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void Promise.all([
      fleetopsService.listOrdersPage({ without_driver: 1, limit: 100, search: search || undefined }),
      fleetopsService.listVehicles().catch(() => []),
    ]).then(([page, vRows]) => {
      setOrders(page.rows || []);
      setVehicles(vRows || []);
    });
  }, [open, search]);

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const term = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        String(o.publicId || o.public_id || "").toLowerCase().includes(term) ||
        String(o.customer?.name || "").toLowerCase().includes(term),
    );
  }, [orders, search]);

  const submit = async () => {
    if (!orderId) {
      setError("Select an order");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fleetopsService.assignDriverToOrder(orderId, {
        driverId,
        vehicleId: vehicleId || undefined,
      });
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
      <div className="space-y-3">
        <Input
          placeholder="Search orders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="assign-order-search"
        />
        <Select value={orderId} onValueChange={setOrderId}>
          <SelectTrigger data-testid="assign-order-select">
            <SelectValue placeholder="Select order" />
          </SelectTrigger>
          <SelectContent>
            {filtered.map((o) => {
              const id = String(o.id || o.uuid);
              return (
                <SelectItem key={id} value={id}>
                  {o.publicId || o.public_id || o.tracking_number || id}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Select value={vehicleId} onValueChange={setVehicleId}>
          <SelectTrigger data-testid="assign-order-vehicle-select">
            <SelectValue placeholder="Vehicle (optional)" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((v) => {
              const id = String(v.uuid || v.id);
              return (
                <SelectItem key={id} value={id}>
                  {v.name || v.plate || id}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </FleetOpsFormDialog>
  );
}
