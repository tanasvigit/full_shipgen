import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import ServiceAreaMapEditor from "@/pages/fleetops/service-areas/ServiceAreaMapEditor";
import { extractBorderGeometry } from "@/lib/fleetops/geofence";

export default function ZoneFormDialog({ open, onOpenChange, serviceAreaId, initial, onSubmit, busy }) {
  const [name, setName] = useState(initial?.name || "");
  const [status, setStatus] = useState(initial?.status || "active");
  const [border, setBorder] = useState(() => extractBorderGeometry(initial?.raw || initial));
  const editorKey = open ? String(initial?.id || "new") : "closed";

  const handleOpen = (v) => {
    if (v) {
      setName(initial?.name || "");
      setStatus(initial?.status || "active");
      setBorder(extractBorderGeometry(initial?.raw || initial));
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
      size="xl"
      onSubmit={async () => {
        await onSubmit?.({
          name,
          status,
          border,
          service_area_uuid: serviceAreaId,
          service_area_id: serviceAreaId,
        });
      }}
      testId="service-area-zone-dialog"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} data-testid="zone-field-name" required />
          </div>
          <div>
            <Label>Status</Label>
            <Input value={status} onChange={(e) => setStatus(e.target.value)} data-testid="zone-field-status" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="overline">Zone boundary</div>
          <p className="text-xs text-[#4B5563]">
            Optional — draw a polygon inside the service area. The boundary is saved with the zone.
          </p>
          <ServiceAreaMapEditor
            key={editorKey}
            geometry={extractBorderGeometry(initial?.raw || initial)}
            autoSync
            onChange={setBorder}
            busy={busy}
          />
        </div>
      </div>
    </FleetOpsFormDialog>
  );
}
