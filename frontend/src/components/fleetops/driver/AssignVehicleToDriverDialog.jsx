import { useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapVehicleRow } from "@/lib/mappers";
import { toast } from "sonner";

export default function AssignVehicleToDriverDialog({ open, onOpenChange, driverId }) {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fleetopsService.listVehicles().then((list) => setVehicles(list.map(mapVehicleRow)));
  }, [open]);

  const submit = async () => {
    if (!vehicleId) {
      setError("Select a vehicle");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fleetopsService.assignVehicleToDriver(driverId, vehicleId);
      toast.success("Vehicle assigned");
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
      title="Assign vehicle"
      submitLabel="Assign"
      busy={busy}
      error={error}
      onSubmit={submit}
      testId="assign-vehicle-to-driver-dialog"
    >
      <Select value={vehicleId} onValueChange={setVehicleId}>
        <SelectTrigger data-testid="assign-vehicle-select">
          <SelectValue placeholder="Select vehicle" />
        </SelectTrigger>
        <SelectContent>
          {vehicles.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.plate || v.name} · {v.publicId}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FleetOpsFormDialog>
  );
}
