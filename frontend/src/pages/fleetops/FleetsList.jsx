import { useCallback, useEffect, useState } from "react";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import FleetForm from "@/components/fleetops/forms/FleetForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Plus, Users, Truck, Building } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapFleet, statusLabel } from "@/lib/mappers";
import {
  ensureRowId,
  FLEET_LAST_CREATED_ID_KEY,
  markPendingSync,
  mergeListWithPending,
  reconcileCreatedRow,
  stripPendingSync,
  upsertListRow,
} from "@/lib/fleetops/list-reconcile";
import { hydrateFleetListRows } from "@/lib/fleetops/hydrate-fleet-list";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";

const COLORS = ["#0066FF", "#16A34A", "#7C3AED", "#EA580C", "#0891B2", "#DC2626"];

export default function FleetsList() {
  const { openDetail } = useFleetopsDetailDrawer("fleet");
  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Fleet created",
    onSubmit: async (values) => {
      const created = await fleetopsService.createFleet(values);
      const mapped = markPendingSync(
        ensureRowId(
          reconcileCreatedRow(mapFleet(created), values, {
            name: "name",
            description: "description",
          }),
          "id",
          "pending-fleet",
        ),
      );
      setFleets((prev) => upsertListRow(prev, mapped));
      const fleetId = getRowId(stripPendingSync(mapped));
      if (fleetId && !fleetId.startsWith("pending-")) {
        sessionStorage.setItem(FLEET_LAST_CREATED_ID_KEY, fleetId);
      }
      fleetopsCache.invalidateFleet(mapped.id);
      await load();
      setFleets((prev) =>
        prev.some((f) => f.name === values.name) ? prev : upsertListRow(prev, mapped),
      );
      return created;
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fleetopsService.listFleets();
      const hydrateId = sessionStorage.getItem(FLEET_LAST_CREATED_ID_KEY);
      const fromApi = await hydrateFleetListRows(rows, hydrateId);
      setFleets((prev) => mergeListWithPending(fromApi, prev));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load fleets.");
      setFleets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return fleetopsCache.subscribe((key) => {
      const tag = Array.isArray(key) ? key.join(":") : String(key || "");
      if (tag.includes("fleetops") && tag.includes("fleets")) {
        void load();
      }
    });
  }, [load]);

  return (
    <div data-testid="fleets-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Management" }, { label: "Fleets" }]}
        overline="Management"
        title="Fleets"
        description={loading ? "Loading fleets…" : `${fleets.length} fleets grouping drivers and vehicles`}
        actions={
          <Button
            onClick={() => dialog.setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="fleets-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create fleet
          </Button>
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && fleets.length === 0 && (
          <div className="col-span-full text-sm text-[#4B5563]" data-testid="fleets-empty">
            No fleets returned from the API.
          </div>
        )}
        {fleets.map((f, idx) => (
          <button
            key={f.id}
            type="button"
            onClick={() => openDetail(f.id)}
            className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors block w-full text-left"
            data-testid={`fleet-card-${f.id}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-1.5 rounded-sm" style={{ background: f.color || COLORS[idx % COLORS.length] }} />
                <div>
                  <div className="overline">{f.publicId}</div>
                  <div className="font-display font-bold text-lg tracking-tight">{f.name}</div>
                </div>
              </div>
              <StatusBadge status={f.status} label={statusLabel(f.status)} />
            </div>
            <p className="text-sm text-[#374151]">{f.description || "No description"}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/[0.08]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#4B5563]" strokeWidth={1.75} />
                <span className="font-mono text-sm tabular">{f.driverIds.length}</span>
                <span className="text-xs text-[#4B5563]">drivers</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#4B5563]" strokeWidth={1.75} />
                <span className="font-mono text-sm tabular">{f.vehicleIds.length}</span>
                <span className="text-xs text-[#4B5563]">vehicles</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="Create fleet"
        description="Fleet groups assets by region and service area."
        submitLabel="Create fleet"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="create-fleet-dialog"
        size="lg"
      >
        <FleetForm ref={formRef} formId="fleet-create-form" serviceAreaOptions={lookups.serviceAreas} />
      </FleetOpsFormDialog>
    </div>
  );
}
