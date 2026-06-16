import { useCallback, useEffect, useMemo, useState } from "react";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import PlaceForm from "@/components/fleetops/forms/PlaceForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { Button } from "@/components/ui/button";
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
import { Plus, MapPin, Trash2 } from "lucide-react";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import MapView from "@/components/common/MapView";
import { fleetopsService } from "@/services/fleetops";
import { mapPlaceRow } from "@/lib/mappers";
import {
  markPendingSync,
  mergeListWithPending,
  reconcileCreatedRow,
  upsertListRow,
} from "@/lib/fleetops/list-reconcile";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";

export default function PlacesList() {
  const { openDetail } = useFleetopsDetailDrawer("place");
  const { can } = useFleetopsPermission();
  const canDelete = can("delete", "place");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const formRef = useFormRef();
  const dialog = useFleetopsFormDialog({
    formRef,
    successMessage: "Place added",
    onSubmit: async (values) => {
      const created = await fleetopsService.createPlace(values);
      const mapped = markPendingSync(
        reconcileCreatedRow(mapPlaceRow(created), values, {
          name: "name",
        }),
      );
      setPlaces((prev) => upsertListRow(prev, mapped));
      fleetopsCache.invalidatePlace(mapped.id);
      void loadPlaces();
      return created;
    },
  });

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fleetopsService.listPlaces();
      const fromApi = rows.map(mapPlaceRow);
      setPlaces((prev) => mergeListWithPending(fromApi, prev));
    } catch (err) {
      toast.error(parseApiError(err, "Could not load places."));
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const selectedIds = useMemo(() => Array.from(selectedKeys), [selectedKeys]);

  const confirmDelete = async () => {
    const ids = deleteTarget?.ids || [];
    if (!ids.length) return;
    setDeleteBusy(true);
    try {
      await Promise.all(ids.map((placeId) => fleetopsService.deletePlace(placeId)));
      setPlaces((prev) => prev.filter((row) => !ids.includes(row.id)));
      ids.forEach((placeId) => fleetopsCache.invalidatePlace(placeId));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        ids.forEach((placeId) => next.delete(placeId));
        return next;
      });
      toast.success(ids.length === 1 ? "Place deleted" : `${ids.length} places deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(parseApiError(err, "Could not delete place."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Place",
        sortable: true,
        render: (r) => (
          <div>
            <div className="font-medium text-[#0A0E1A]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">{r.publicId}</div>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (r) => <span className="text-xs capitalize">{String(r.type || "").replace(/_/g, " ")}</span>,
      },
      { key: "address", header: "Address", render: (r) => <span className="text-xs text-[#374151]">{r.address}</span> },
      { key: "phone", header: "Contact", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.phone || "—"}</span> },
      {
        key: "openingHours",
        header: "Hours",
        render: (r) => <span className="font-mono text-xs">{r.openingHours || "—"}</span>,
      },
      ...(canDelete
        ? [
            {
              key: "actions",
              header: "",
              render: (r) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#4B5563] hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ ids: [r.id], label: r.name });
                  }}
                  data-testid={`place-delete-${r.id}`}
                  aria-label={`Delete ${r.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ),
            },
          ]
        : []),
    ],
    [canDelete],
  );

  return (
    <div data-testid="places-list-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Management" }, { label: "Places" }]}
        overline="Management"
        title="Places"
        description={loading ? "Loading locations…" : `${places.length} pickup, drop-off and hub locations`}
        actions={
          <Button
            onClick={() => dialog.setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="places-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add place
          </Button>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
        <div className="space-y-4">
          {!loading && places.length === 0 && (
            <div className="text-sm text-[#4B5563]" data-testid="places-empty">
              No places returned from the API for this company.
            </div>
          )}
          <DataTable
            testid="places-table"
            columns={columns}
            data={places}
            loading={loading}
            loadingMessage="Loading places…"
            searchKeys={["name", "address", "publicId"]}
            pageSize={10}
            selectable={canDelete}
            selectedKeys={selectedKeys}
            onSelectedKeysChange={setSelectedKeys}
            toolbarRight={
              canDelete && selectedIds.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() =>
                    setDeleteTarget({
                      ids: selectedIds,
                      label: `${selectedIds.length} selected place${selectedIds.length === 1 ? "" : "s"}`,
                    })
                  }
                  data-testid="places-bulk-delete"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete ({selectedIds.length})
                </Button>
              ) : null
            }
            onRowClick={(r) => openDetail(r.id)}
          />
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-[520px]">
          <div className="px-4 py-2.5 border-b border-black/[0.08] overline flex items-center gap-2">
            <MapPin className="h-3 w-3" /> All places
          </div>
          <div className="h-[calc(100%-37px)]">
            <MapView
              markers={places.map((p) => ({
                id: p.id,
                lat: p.lat,
                lng: p.lng,
                label: p.name,
                popup: p.address,
                color: "#06B6D4",
              }))}
              testid="places-overview-map"
            />
          </div>
        </div>
      </div>
      <FleetOpsFormDialog
        open={dialog.open}
        onOpenChange={dialog.setOpen}
        title="Add place"
        description="Place supports street, geocode, hours, and dock codes."
        submitLabel="Add place"
        busy={dialog.busy}
        error={dialog.error}
        onSubmit={dialog.handleSubmit}
        testId="add-place-dialog"
        size="lg"
      >
        <PlaceForm ref={formRef} formId="place-create-form" />
      </FleetOpsFormDialog>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleteBusy && setDeleteTarget(null)}>
        <AlertDialogContent data-testid="place-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.ids?.length === 1 ? "place" : "places"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.label ? (
                <>
                  <span className="font-medium text-[#1F2937]">{deleteTarget.label}</span> will be removed. This cannot
                  be undone.
                </>
              ) : (
                "This cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
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
