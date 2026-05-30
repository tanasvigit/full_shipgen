import { useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function SetDriverAvailabilityDialog({ open, onOpenChange, driverId, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const submit = async () => {
    if (!start || !end) {
      setError("Start and end times are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fleetopsService.createDriverAvailability(driverId, {
        start_at: start,
        end_at: end,
        available: true,
      });
      toast.success("Availability saved");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err?.friendlyMessage || "Could not save availability");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Set availability"
      description="Define when this driver is available for assignment."
      submitLabel="Save availability"
      busy={busy}
      error={error}
      onSubmit={submit}
      testId="set-driver-availability-dialog"
    >
      <div className="space-y-3">
        <div>
          <Label htmlFor="avail-start">Start</Label>
          <Input id="avail-start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="avail-end">End</Label>
          <Input id="avail-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
    </FleetOpsFormDialog>
  );
}
