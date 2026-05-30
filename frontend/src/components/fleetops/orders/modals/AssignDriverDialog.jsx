import { useCallback, useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function AssignDriverDialog({
  open,
  onOpenChange,
  orderId,
  order,
  initialDriverId,
  initialVehicleId,
  onAssigned,
}) {
  const lookups = useFleetopsLookups(open);
  const [driverId, setDriverId] = useState(initialDriverId || "");
  const [vehicleId, setVehicleId] = useState(initialVehicleId || "");
  const [busy, setBusy] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDriverId(initialDriverId || "");
    setVehicleId(initialVehicleId || "");
    setError(null);
  }, [open, initialDriverId, initialVehicleId]);

  const applyBestFit = useCallback(
    async ({ silent = false } = {}) => {
      if (!order) return;
      setSuggesting(true);
      setError(null);
      try {
        const rows = await fleetopsService.listDrivers();
        const best = fleetopsService.suggestBestDriver(rows, order);
        const id = best?.uuid || best?.id;
        if (id) {
          setDriverId(String(id));
          if (!silent) toast.success("Suggested nearest available driver");
        } else if (!silent) {
          toast.message("No available driver found for this order");
        }
      } catch (err) {
        const msg = parseFleetopsApiError(err);
        setError(msg);
        if (!silent) toast.error(msg);
      } finally {
        setSuggesting(false);
      }
    },
    [order],
  );

  useEffect(() => {
    if (!open || !order || initialDriverId) return;
    applyBestFit({ silent: true });
  }, [open, order, initialDriverId, applyBestFit]);

  const handleSubmit = async () => {
    if (!driverId) {
      setError("Select a driver to assign.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fleetopsService.assignDriverToOrder(orderId, { driverId, vehicleId: vehicleId || undefined });
      toast.success("Driver assigned");
      onAssigned?.();
      onOpenChange(false);
    } catch (err) {
      const msg = parseFleetopsApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign driver"
      description="Assign or change the driver and optional vehicle for this order."
      submitLabel="Save assignment"
      busy={busy || suggesting}
      error={error}
      onSubmit={handleSubmit}
      testId="assign-driver-dialog"
      size="lg"
    >
      <div className="space-y-4" data-testid="assign-driver-form">
        {order && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            disabled={busy || suggesting || lookups.loading}
            onClick={() => applyBestFit()}
            data-testid="assign-driver-suggest"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Suggest best-fit driver
          </Button>
        )}
        <div className="space-y-2">
          <Label>Driver</Label>
          <Select value={driverId || undefined} onValueChange={setDriverId} disabled={lookups.loading}>
            <SelectTrigger data-testid="assign-driver-trigger">
              <SelectValue placeholder={lookups.loading ? "Loading…" : "Select driver"} />
            </SelectTrigger>
            <SelectContent>
              {lookups.loading ? (
                <SelectItem value="__loading__" disabled>
                  Loading drivers…
                </SelectItem>
              ) : lookups.drivers.length === 0 ? (
                <SelectItem value="__empty__" disabled>
                  No drivers available
                </SelectItem>
              ) : (
                lookups.drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Vehicle (optional)</Label>
          <Select value={vehicleId || "__none"} onValueChange={(v) => setVehicleId(v === "__none" ? "" : v)}>
            <SelectTrigger data-testid="assign-vehicle-trigger">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— None —</SelectItem>
              {!lookups.loading &&
                lookups.vehicles.length === 0 && (
                  <SelectItem value="__no_vehicles__" disabled>
                    No vehicles available
                  </SelectItem>
                )}
              {lookups.vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FleetOpsFormDialog>
  );
}
