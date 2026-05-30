import { useCallback, useEffect, useMemo, useState } from "react";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import VehicleForm from "@/components/fleetops/forms/VehicleForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapVehicleRow, mapDriverRow, statusLabel } from "@/lib/mappers";
import {
  markPendingSync,
  mergeListWithPending,
  reconcileCreatedRow,
  upsertListRow,
} from "@/lib/fleetops/list-reconcile";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";

export default function VehiclesList() {
  const { openDetail } = useFleetopsDetailDrawer("vehicle");
  const [vehicles, setVehicles] = useState([]);
  const [driverNames, setDriverNames] = useState({});
  const [loading, setLoading] = useState(true);
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Vehicle registered",
    onSubmit: async (values) => {
      const created = await fleetopsService.createVehicle(values);
      const mapped = markPendingSync(
        reconcileCreatedRow(mapVehicleRow(created), values, {
          name: "name",
          plate: "plate",
        }),
      );
      setVehicles((prev) => upsertListRow(prev, mapped));
      fleetopsCache.invalidateVehicle(mapped.id);
      void loadAll();
      return created;
    },
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const rawVehicles = await fleetopsService.listVehicles();
      const fromApi = rawVehicles.map(mapVehicleRow);
      setVehicles((prev) => mergeListWithPending(fromApi, prev));

      try {
        const driversRaw = await fleetopsService.listDrivers();
        const nameMap = {};
        driversRaw.forEach((d) => {
          const row = mapDriverRow(d);
          if (row.id) nameMap[row.id] = row.name;
        });
        setDriverNames(nameMap);
      } catch {
        setDriverNames({});
      }
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not load vehicles.");
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Vehicle",
        sortable: true,
        render: (r) => (
          <div>
            <div className="font-medium text-[#0A0E1A]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">{r.publicId}</div>
          </div>
        ),
      },
      { key: "plate", header: "Plate", sortable: true, render: (r) => <span className="font-mono text-xs">{r.plate}</span> },
      {
        key: "type",
        header: "Type",
        render: (r) => <span className="text-xs capitalize">{String(r.type || "").replace(/_/g, " ")}</span>,
      },
      {
        key: "make",
        header: "Make / Model",
        render: (r) => (
          <span className="text-sm">
            {r.make} {r.model}{" "}
            <span className="text-[#4B5563] font-mono text-xs">({r.year || "—"})</span>
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (r) => <StatusBadge status={r.status} label={statusLabel(r.status)} />,
      },
      {
        key: "fuel",
        header: "Fuel",
        sortable: true,
        render: (r) => {
          const fuel = Number.isFinite(Number(r.fuel)) ? Number(r.fuel) : 0;
          return (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm overflow-hidden">
                <div
                  className={`h-full ${fuel < 25 ? "bg-red-500" : fuel < 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(100, Math.max(0, fuel))}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular">{fuel}%</span>
            </div>
          );
        },
      },
      {
        key: "mileage",
        header: "Mileage",
        sortable: true,
        render: (r) => <span className="font-mono text-xs tabular">{Number(r.mileage || 0).toLocaleString()} km</span>,
      },
      {
        key: "driverId",
        header: "Driver",
        render: (r) =>
          r.driverId ? (
            <span className="text-sm">{driverNames[r.driverId] || `Driver ${String(r.driverId).slice(0, 8)}…`}</span>
          ) : (
            <span className="text-xs text-[#4B5563] italic">Unassigned</span>
          ),
      },
    ],
    [driverNames],
  );

  return (
    <div data-testid="vehicles-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Management" }, { label: "Vehicles" }]}
        overline="Management"
        title="Vehicles"
        description={loading ? "Loading fleet…" : `${vehicles.length} vehicles in fleet`}
        actions={
          <Button
            onClick={() => dialog.setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="vehicles-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Register vehicle
          </Button>
        }
      />
      <div className="p-6">
        {!loading && vehicles.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="vehicles-empty">
            No vehicles returned. Register one to get started.
          </div>
        )}
        <DataTable
          testid="vehicles-table"
          columns={columns}
          data={vehicles}
          loading={loading}
          loadingMessage="Loading vehicles…"
          searchKeys={["name", "plate", "publicId", "vin"]}
          pageSize={10}
          onRowClick={(r) => openDetail(r.id)}
        />
      </div>
      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="Register vehicle"
        description="Vehicle payload uses { vehicle: … } per Fleetbase REST contract."
        submitLabel="Register vehicle"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="register-vehicle-dialog"
        size="xl"
      >
        <VehicleForm ref={formRef} formId="vehicle-create-form" driverOptions={lookups.drivers} />
      </FleetOpsFormDialog>
    </div>
  );
}
