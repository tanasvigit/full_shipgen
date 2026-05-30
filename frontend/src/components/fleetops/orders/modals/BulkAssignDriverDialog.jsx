import { useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";

export default function BulkAssignDriverDialog({ open, onOpenChange, orderCount = 0, onAssign }) {
  const lookups = useFleetopsLookups(open);
  const [driverId, setDriverId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDriverId("");
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    if (!driverId) {
      setError("Select a driver.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAssign?.(driverId);
    } catch (err) {
      setError(err?.message || "Assignment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk assign driver"
      description={`Assign a driver to ${orderCount} selected order(s).`}
      submitLabel="Assign driver"
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      testId="bulk-assign-driver-dialog"
      size="lg"
    >
      <div className="space-y-2">
        <Label>Driver</Label>
        <Select value={driverId || undefined} onValueChange={setDriverId}>
          <SelectTrigger data-testid="bulk-assign-driver-select">
            <SelectValue placeholder="Select driver" />
          </SelectTrigger>
          <SelectContent>
            {lookups.drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FleetOpsFormDialog>
  );
}
