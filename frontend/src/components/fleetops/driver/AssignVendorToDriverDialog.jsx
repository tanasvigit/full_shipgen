import { useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { toast } from "sonner";

export default function AssignVendorToDriverDialog({ open, onOpenChange, driverId }) {
  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    void fleetopsService.listVendor().then((list) => setVendors(list.map((v) => mapCrudRow(v, "vendor"))));
  }, [open]);

  const submit = async () => {
    if (!vendorId) {
      setError("Select a vendor");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await fleetopsService.assignVendorToDriver(driverId, vendorId);
      toast.success("Vendor assigned");
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
      title="Assign vendor"
      submitLabel="Assign"
      busy={busy}
      error={error}
      onSubmit={submit}
      testId="assign-vendor-to-driver-dialog"
    >
      <Select value={vendorId} onValueChange={setVendorId}>
        <SelectTrigger data-testid="assign-vendor-select">
          <SelectValue placeholder="Select vendor" />
        </SelectTrigger>
        <SelectContent>
          {vendors.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FleetOpsFormDialog>
  );
}
