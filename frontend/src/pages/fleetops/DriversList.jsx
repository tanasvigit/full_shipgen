import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import DriverForm from "@/components/fleetops/forms/DriverForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Mail, Star } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, statusLabel } from "@/lib/mappers";
import {
  markPendingSync,
  mergeListWithPending,
  reconcileCreatedRow,
  upsertListRow,
} from "@/lib/fleetops/list-reconcile";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";

export default function DriversList() {
  const { openDetail } = useFleetopsDetailDrawer("driver");
  const formRef = useFormRef();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const lookups = useFleetopsLookups();
  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Driver onboarded",
    onSubmit: async (values) => {
      const created = await fleetopsService.createDriver(values);
      const mapped = markPendingSync(
        reconcileCreatedRow(mapDriverRow(created), values, {
          name: "name",
          email: "email",
          phone: "phone",
        }),
      );
      setDrivers((prev) => upsertListRow(prev, mapped));
      fleetopsCache.invalidateDriver(mapped.id);
      void loadDrivers();
      return created;
    },
  });

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fleetopsService.listDrivers();
      const fromApi = raw.map(mapDriverRow);
      setDrivers((prev) => mergeListWithPending(fromApi, prev));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load drivers.");
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Driver",
        sortable: true,
        render: (r) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-[#0066FF] text-white grid place-items-center rounded-md font-mono font-bold text-xs">
              {String(r.name || "")
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="font-medium text-[#0A0E1A]">{r.name}</div>
              <div className="text-[10px] font-mono text-[#4B5563]">{r.publicId}</div>
            </div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (r) => <StatusBadge status={r.status} label={statusLabel(r.status)} />,
      },
      {
        key: "phone",
        header: "Contact",
        render: (r) => (
          <div className="text-xs font-mono text-[#374151] space-y-0.5">
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {r.phone || "—"}
            </div>
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" /> {r.email || "—"}
            </div>
          </div>
        ),
      },
      {
        key: "vehicleId",
        header: "Vehicle",
        render: (r) =>
          r.vehicleId ? (
            <span className="font-mono text-xs">{r.vehicleId}</span>
          ) : (
            <span className="text-[#4B5563] italic">—</span>
          ),
      },
      {
        key: "rating",
        header: "Rating",
        sortable: true,
        render: (r) => (
          <span className="inline-flex items-center gap-1 font-mono">
            <Star className="h-3 w-3 fill-amber-400 text-[#A16207]" /> {Number(r.rating || 0).toFixed(1)}
          </span>
        ),
      },
      {
        key: "ordersCompleted",
        header: "Orders",
        sortable: true,
        render: (r) => <span className="font-mono tabular">{Number(r.ordersCompleted || 0).toLocaleString()}</span>,
      },
      {
        key: "internalId",
        header: "Internal ID",
        render: (r) => <span className="font-mono text-xs text-[#4B5563]">{r.internalId || r.publicId}</span>,
      },
    ],
    [],
  );

  return (
    <div data-testid="drivers-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Management" }, { label: "Drivers" }]}
        overline="Management"
        title="Drivers"
        description={loading ? "Loading roster…" : `${drivers.length} drivers in the roster`}
        actions={
          <Button
            onClick={() => dialog.setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="drivers-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Onboard driver
          </Button>
        }
      />
      <div className="p-6">
        {!loading && drivers.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="drivers-empty">
            No drivers returned for this company. Try onboarding a driver above.
          </div>
        )}
        <DataTable
          testid="drivers-table"
          columns={columns}
          data={drivers}
          loading={loading}
          loadingMessage="Loading drivers…"
          searchKeys={["name", "publicId", "email", "internalId"]}
          pageSize={10}
          onRowClick={(r) => openDetail(r.id)}
        />
      </div>

      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="Onboard driver"
        description="Creates driver + user per FleetOps internal API contract."
        submitLabel="Onboard driver"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="onboard-driver-dialog"
        size="xl"
      >
        <DriverForm
          ref={formRef}
          formId="driver-create-form"
          mode="create"
          vehicleOptions={lookups.vehicles}
          vendorOptions={lookups.facilitators}
        />
      </FleetOpsFormDialog>
    </div>
  );
}
