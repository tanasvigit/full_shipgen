import { useCallback, useEffect, useMemo, useState } from "react";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import FleetForm from "@/components/fleetops/forms/FleetForm";
import CrudImportExportBar from "@/components/fleetops/crud/CrudImportExportBar";
import FleetListFilters from "@/components/fleetops/fleet/FleetListFilters";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { parseApiError } from "@/lib/errors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Users, Truck, Search, LayoutGrid, LayoutList } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapFleet, statusLabel } from "@/lib/mappers";
import { buildFleetListApiParams, FLEET_LIST_DEFAULTS } from "@/lib/fleetops/fleetListQuery";
import {
  ensureRowId,
  FLEET_LAST_CREATED_ID_KEY,
  getRowId,
  markPendingSync,
  mergeListWithPending,
  reconcileCreatedRow,
  stripPendingSync,
  upsertListRow,
} from "@/lib/fleetops/list-reconcile";
import { hydrateFleetListRows } from "@/lib/fleetops/hydrate-fleet-list";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";

export default function FleetsList() {
  const { openDetail } = useFleetopsDetailDrawer("fleet");
  const { can } = useFleetopsPermission();
  const canCreate = can("create", "fleet");
  const canDelete = can("delete", "fleet");
  const [fleets, setFleets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ...FLEET_LIST_DEFAULTS });
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState("cards");
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
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
            task: "task",
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
      const apiParams = buildFleetListApiParams({ ...filters, search });
      const rows = await fleetopsService.listFleets(apiParams);
      const hydrateId = sessionStorage.getItem(FLEET_LAST_CREATED_ID_KEY);
      const fromApi = await hydrateFleetListRows(rows, hydrateId);
      setFleets((prev) => mergeListWithPending(fromApi, prev));
    } catch (err) {
      toast.error(parseApiError(err, "Could not load fleets."));
      setFleets([]);
    } finally {
      setLoading(false);
    }
  }, [filters, search]);

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

  const filteredFleets = useMemo(() => fleets, [fleets]);

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        header: "Fleet",
        sortable: true,
        render: (f) => (
          <button type="button" className="text-left" onClick={() => openDetail(f.id)}>
            <div className="font-medium">{f.name}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">{f.publicId}</div>
          </button>
        ),
      },
      { key: "status", header: "Status", render: (f) => <StatusBadge status={f.status} label={statusLabel(f.status)} /> },
      { key: "serviceAreaName", header: "Service area", render: (f) => f.serviceAreaName || "—" },
      { key: "zoneName", header: "Zone", render: (f) => f.zoneName || "—" },
      { key: "driversCount", header: "Drivers", render: (f) => f.driversCount ?? f.driverIds?.length ?? 0 },
      { key: "vehiclesCount", header: "Vehicles", render: (f) => f.vehiclesCount ?? f.vehicleIds?.length ?? 0 },
    ],
    [openDetail],
  );

  const selectedIds = useMemo(() => Array.from(selectedKeys), [selectedKeys]);

  const toggleSelected = (fleetId, checked) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(fleetId);
      else next.delete(fleetId);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedKeys(new Set(filteredFleets.map((f) => f.id)));
  };

  const clearSelection = () => setSelectedKeys(new Set());

  const confirmBulkDelete = async () => {
    if (!selectedIds.length) return;
    setBulkDeleteBusy(true);
    try {
      await fleetopsService.bulkDeleteResource("fleet", selectedIds);
      selectedIds.forEach((fleetId) => fleetopsCache.invalidateFleet(fleetId));
      setFleets((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      clearSelection();
      toast.success(selectedIds.length === 1 ? "Fleet deleted" : `${selectedIds.length} fleets deleted`);
      setBulkDeleteOpen(false);
      await load();
    } catch (err) {
      toast.error(parseApiError(err, "Could not delete selected fleets."));
    } finally {
      setBulkDeleteBusy(false);
    }
  };

  return (
    <div data-testid="fleets-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Management" }, { label: "Fleets" }]}
        overline="Management"
        title="Fleets"
        description={loading ? "Loading fleets…" : `${fleets.length} fleets grouping drivers and vehicles`}
        actions={
          canCreate ? (
            <Button
              onClick={() => dialog.setOpen(true)}
              className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
              data-testid="fleets-new-button"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Create fleet
            </Button>
          ) : null
        }
      />
      <div className="px-6 pb-2">
        <CrudImportExportBar
          entityKey="fleet"
          selectedIds={selectedIds}
          onComplete={load}
          testPrefix="fleets"
        />
        <FleetListFilters
          filters={filters}
          onChange={setFilters}
          serviceAreaOptions={lookups.serviceAreas}
          vendorOptions={lookups.facilitators}
        />
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative max-w-md flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4B5563]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search fleets…"
              className="pl-9 bg-[#F5F6F8] border-black/[0.08]"
              data-testid="fleets-search"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} data-testid="fleets-apply-search">
            Apply
          </Button>
          <div className="flex gap-1 border border-black/[0.08] rounded-md p-0.5">
            <Button
              variant={layout === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("cards")}
              data-testid="fleets-layout-cards"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={layout === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setLayout("table")}
              data-testid="fleets-layout-table"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
          </div>
          {filteredFleets.length > 0 && (
            <Button variant="outline" size="sm" onClick={selectAllFiltered} data-testid="fleets-select-all">
              Select all
            </Button>
          )}
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-[#4B5563]" data-testid="fleets-selected-count">
                {selectedIds.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={clearSelection} data-testid="fleets-clear-selection">
                Clear
              </Button>
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setBulkDeleteOpen(true)}
                  data-testid="fleets-bulk-delete"
                >
                  Delete selected
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {layout === "table" ? (
        <div className="px-6 pb-6">
          <DataTable
            columns={tableColumns}
            data={filteredFleets}
            loading={loading}
            rowKey="id"
            onRowClick={(r) => openDetail(r.id)}
            selectable
            selectedKeys={selectedKeys}
            onSelectedKeysChange={setSelectedKeys}
            testid="fleets-table"
          />
        </div>
      ) : (
      <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && filteredFleets.length === 0 && (
          <div className="col-span-full text-sm text-[#4B5563]" data-testid="fleets-empty">
            {search ? "No fleets match your search." : "No fleets returned from the API."}
          </div>
        )}
        {filteredFleets.map((f) => {
          const selected = selectedKeys.has(f.id);
          return (
            <div
              key={f.id}
              className={`relative bg-white border rounded-md transition-colors ${
                selected ? "border-[#0066FF] ring-1 ring-[#0066FF]/30" : "border-black/[0.08] hover:border-black/[0.14]"
              }`}
              data-testid={`fleet-card-${f.id}`}
            >
              <label
                className="absolute top-3 right-3 z-10 flex items-center gap-2 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={(checked) => toggleSelected(f.id, Boolean(checked))}
                  data-testid={`fleet-select-${f.id}`}
                />
              </label>
              <button
                type="button"
                onClick={() => openDetail(f.id)}
                className="block w-full text-left p-5 pr-12"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-1.5 rounded-sm" style={{ background: f.color || "#0066FF" }} />
                    <div>
                      <div className="overline">{f.publicId}</div>
                      <div className="font-display font-bold text-lg tracking-tight">{f.name}</div>
                    </div>
                  </div>
                  <StatusBadge status={f.status} label={statusLabel(f.status)} />
                </div>
                <p className="text-sm text-[#374151]">{f.task || "No task or notes"}</p>
                {(f.serviceAreaName || f.zoneName) && (
                  <p className="text-xs text-[#4B5563] mt-1">
                    {[f.serviceAreaName, f.zoneName].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/[0.08]">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#4B5563]" strokeWidth={1.75} />
                    <span className="font-mono text-sm tabular">{f.driversCount ?? f.driverIds.length}</span>
                    <span className="text-xs text-[#4B5563]">
                      drivers{f.driversOnlineCount ? ` (${f.driversOnlineCount} online)` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-[#4B5563]" strokeWidth={1.75} />
                    <span className="font-mono text-sm tabular">{f.vehiclesCount ?? f.vehicleIds.length}</span>
                    <span className="text-xs text-[#4B5563]">
                      vehicles{f.vehiclesOnlineCount ? ` (${f.vehiclesOnlineCount} online)` : ""}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      )}
      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="Create fleet"
        description="Group drivers and vehicles by service area, zone, and vendor."
        submitLabel="Create fleet"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="create-fleet-dialog"
        size="lg"
      >
        <FleetForm
          ref={formRef}
          formId="fleet-create-form"
          serviceAreaOptions={lookups.serviceAreas}
          vendorOptions={lookups.facilitators}
          fleetOptions={lookups.fleets}
        />
      </FleetOpsFormDialog>
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !open && !bulkDeleteBusy && setBulkDeleteOpen(open)}>
        <AlertDialogContent data-testid="fleets-bulk-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} fleet{selectedIds.length === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Selected fleets will be removed. Drivers and vehicles are not deleted — only fleet membership links.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmBulkDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
