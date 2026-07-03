import { useState } from "react";
import { Button } from "@/components/ui/button";
import ServiceAreaMapPanel from "@/components/fleetops/service-areas/ServiceAreaMapPanel";
import ServiceAreaMapEditor from "@/pages/fleetops/service-areas/ServiceAreaMapEditor";

/**
 * Single map block with View (overview) and Edit boundary modes.
 */
export default function ServiceAreaBoundarySection({
  serviceAreaBorder,
  zones = [],
  onSaveBoundary,
  onDeleteBoundary,
  busy = false,
}) {
  const [mode, setMode] = useState("view");

  return (
    <section className="rounded-md border border-black/[0.08] p-4 space-y-3" data-testid="service-area-map-section">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="overline">Map</div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "view" ? "default" : "outline"}
            onClick={() => setMode("view")}
            data-testid="service-area-map-view-mode"
          >
            View
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "default" : "outline"}
            onClick={() => setMode("edit")}
            data-testid="service-area-map-edit-mode"
          >
            Edit boundary
          </Button>
        </div>
      </div>

      {mode === "view" ? (
        <>
          <p className="text-xs text-[#4B5563]">
            Service area boundary (blue) and zone polygons. Switch to Edit boundary to change the service area shape.
          </p>
          <ServiceAreaMapPanel serviceAreaBorder={serviceAreaBorder} zones={zones} />
        </>
      ) : (
        <>
          <p className="text-xs text-[#4B5563]">
            Click the map to place points (minimum 3). Use Undo or Clear to adjust, then save the boundary.
          </p>
          <ServiceAreaMapEditor
            geometry={serviceAreaBorder}
            onSave={onSaveBoundary}
            onDelete={onDeleteBoundary}
            busy={busy}
            saveLabel="Save boundary"
            deleteLabel="Delete boundary"
          />
        </>
      )}
    </section>
  );
}
