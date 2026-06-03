import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function ZoneFormDialog({ open, onOpenChange, serviceAreaId, initial, onSubmit, busy }) {
  const [name, setName] = useState(initial?.name || "");
  const [status, setStatus] = useState(initial?.status || "active");

  const handleOpen = (v) => {
    if (v) {
      setName(initial?.name || "");
      setStatus(initial?.status || "active");
    }
    onOpenChange(v);
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={handleOpen}
      title={initial?.id ? "Edit zone" : "New zone"}
      submitLabel={initial?.id ? "Save zone" : "Create zone"}
      busy={busy}
      onSubmit={async () => {
        await onSubmit?.({
          name,
          status,
          service_area_uuid: serviceAreaId,
          service_area_id: serviceAreaId,
        });
      }}
      testId="service-area-zone-dialog"
    >
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="zone-field-name" required />
        </div>
        <div>
          <Label>Status</Label>
          <Input value={status} onChange={(e) => setStatus(e.target.value)} data-testid="zone-field-status" />
        </div>
      </div>
    </FleetOpsFormDialog>
  );
}
