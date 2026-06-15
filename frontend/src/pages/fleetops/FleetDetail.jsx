import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFleetopsDetailDrawer } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import PageHeader from "@/components/common/PageHeader";
import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { useFormDirtyBridge } from "@/hooks/fleetops/useFormDirtyBridge";
import { DetailLoadingState, resolveDetailEntityId, wrapDetailEditDialog } from "@/lib/fleetops/detailEmbedded";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import FleetForm, { fleetValuesFromApi } from "@/components/fleetops/forms/FleetForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapFleet, mapVehicleRow, statusLabel } from "@/lib/mappers";
import { reconcileCreatedRow } from "@/lib/fleetops/list-reconcile";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";
import HealthBanner from "@/components/fleetops/health/HealthBanner";
import { useFleetopsWarnings } from "@/hooks/fleetops/useFleetopsWarnings";
import FleetMembersPanel from "@/components/fleetops/fleet/FleetMembersPanel";
import FleetOrdersTab from "@/components/fleetops/detail/tabs/fleet/FleetOrdersTab";

const FLEET_DETAIL_WITH =
  "drivers,vehicles,service_area,zone,vendor,parent_fleet,subfleets";

function formatTimestamp(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function FleetDetail({ embedded = false, entityId: entityIdProp }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const { closeDetail } = useFleetopsDetailDrawer("fleet");
  const { can } = useFleetopsPermission();
  const canDelete = can("delete", "fleet");
  const [loading, setLoading] = useState(true);
  const [fleet, setFleet] = useState(null);
  const [fleetApi, setFleetApi] = useState(null);
  const [fleetDrivers, setFleetDrivers] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const editDialog = useFleetopsFormDialog({
    formRef,
    suspendDrawer: embedded,
    successMessage: "Fleet updated",
    onSubmit: async (values) => {
      const updated = await fleetopsService.updateFleet(id, values);
      setFleetApi(updated);
      setFleet(
        reconcileCreatedRow(mapFleet(updated), values, {
          name: "name",
          task: "task",
        }),
      );
      fleetopsCache.invalidateFleet(id);
      await load();
      return updated;
    },
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const raw = await fleetopsService.getFleet(id, { with: FLEET_DETAIL_WITH });
      if (!raw) {
        setFleet(null);
        setFleetApi(null);
        setFleetDrivers([]);
        setFleetVehicles([]);
        return;
      }
      setFleetApi(raw);
      const fm = mapFleet(raw);
      setFleet(fm);
      setFleetDrivers(Array.isArray(raw?.drivers) ? raw.drivers.map(mapDriverRow) : []);
      setFleetVehicles(Array.isArray(raw?.vehicles) ? raw.vehicles.map(mapVehicleRow) : []);
    } catch (err) {
      if (err?.response?.status === 404) toast.error("Fleet not found.");
      else toast.error(err?.friendlyMessage || "Could not load fleet.");
      setFleet(null);
      setFleetDrivers([]);
      setFleetVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useFormDirtyBridge(formRef, editDialog.open, "fleet-edit", { suspendDrawer: embedded });

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setDeleteBusy(true);
    try {
      await fleetopsService.deleteFleet(id);
      fleetopsCache.invalidateFleet(id);
      toast.success("Fleet deleted");
      setDeleteOpen(false);
      if (embedded) closeDetail();
      else navigate("/fleet-ops/management/fleets");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not delete fleet.");
    } finally {
      setDeleteBusy(false);
    }
  }, [closeDetail, embedded, id, navigate]);

  const accent = useMemo(() => fleet?.color || "#0066FF", [fleet?.color]);

  const { warnings } = useFleetopsWarnings({ fleet });

  if (!loading && !fleet) {
    return <div className="p-8 text-[#374151]">Fleet not found.</div>;
  }
  if (loading && !fleet) {
    return (
      <DetailLoadingState embedded={embedded} message="Loading fleet…" testId="fleet-detail-loader" />
    );
  }

  const f = fleet;
  const subfleets = f.subfleets || [];

  const overviewFields = [
    { label: "Public ID", value: f.publicId },
    { label: "Status", value: statusLabel(f.status) },
    { label: "Task / notes", value: f.task || "—" },
    { label: "Service area", value: f.serviceAreaName || "—" },
    { label: "Zone", value: f.zoneName || "—" },
    { label: "Vendor", value: f.vendorName || "—" },
    {
      label: "Parent fleet",
      value: f.parentFleetId ? (
        <DetailEntityLink entityKey="fleet" entityId={f.parentFleetId}>
          {f.parentFleetName || f.parentFleetId}
        </DetailEntityLink>
      ) : (
        "—"
      ),
    },
    { label: "Drivers", value: `${f.driversCount ?? fleetDrivers.length} (${f.driversOnlineCount ?? 0} online)` },
    { label: "Vehicles", value: `${f.vehiclesCount ?? fleetVehicles.length} (${f.vehiclesOnlineCount ?? 0} online)` },
    { label: "Subfleets", value: subfleets.length },
    { label: "Created", value: formatTimestamp(f.createdAt) },
    { label: "Updated", value: formatTimestamp(f.updatedAt) },
  ];

  const deleteDialog = (
    <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && !deleteBusy && setDeleteOpen(open)}>
      <AlertDialogContent data-testid="fleet-delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete fleet?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-[#1F2937]">{f.name}</span> will be removed. Driver and vehicle records
            are not deleted — only fleet membership links.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteBusy}
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const content = (
    <>
      {embedded && (
        <DetailDrawerHeader
          overline={f.publicId}
          title={f.name}
          status={f.status}
          statusLabel={statusLabel(f.status)}
          onEdit={embedded ? editDialog.openEdit : () => editDialog.setOpen(true)}
          editTestId="fleet-edit"
          actions={
            canDelete
              ? [
                  {
                    id: "delete",
                    label: "Delete",
                    testId: "fleet-delete",
                    onClick: () => setDeleteOpen(true),
                    icon: <Trash2 className="h-3.5 w-3.5 mr-1" />,
                  },
                ]
              : []
          }
        />
      )}
      <div className={embedded ? "px-4 pb-2" : "px-6 pb-2"}>
        <HealthBanner warnings={warnings} testId="fleet-health-banner" />
      </div>
      <div className={embedded ? "p-4 pt-2" : "p-6 pt-2"}>
        <div className="flex items-center gap-3 mb-5">
          <div className="h-2 w-12 rounded-sm" style={{ background: accent }} />
          <StatusBadge status={f.status} label={statusLabel(f.status)} />
          <span className="text-xs font-mono text-[#4B5563]">
            {fleetDrivers.length} drivers · {fleetVehicles.length} vehicles
            {subfleets.length ? ` · ${subfleets.length} subfleets` : ""}
          </span>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#F1F2F5] border border-black/[0.08] flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders" data-testid="fleet-tab-orders">
              Orders
            </TabsTrigger>
            <TabsTrigger value="drivers" data-testid="fleet-tab-drivers">
              Drivers ({fleetDrivers.length})
            </TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="fleet-tab-vehicles">
              Vehicles ({fleetVehicles.length})
            </TabsTrigger>
            {subfleets.length > 0 && (
              <TabsTrigger value="subfleets" data-testid="fleet-tab-subfleets">
                Subfleets ({subfleets.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="bg-white border border-black/[0.08] rounded-md p-5">
              <DetailFieldGrid fields={overviewFields} />
            </div>
            {f.task && (
              <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
                {f.task}
              </div>
            )}
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <FleetOrdersTab fleetId={id} enabled={activeTab === "orders"} />
          </TabsContent>
          <TabsContent value="drivers" className="mt-4">
            <FleetMembersPanel fleetId={id} drivers={fleetDrivers} vehicles={[]} onChanged={load} mode="drivers" />
          </TabsContent>
          <TabsContent value="vehicles" className="mt-4">
            <FleetMembersPanel fleetId={id} drivers={[]} vehicles={fleetVehicles} onChanged={load} mode="vehicles" />
          </TabsContent>
          {subfleets.length > 0 && (
            <TabsContent value="subfleets" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
                {subfleets.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-4 py-3">
                    <DetailEntityLink entityKey="fleet" entityId={sub.id}>
                      <div className="font-medium text-sm">{sub.name}</div>
                      <div className="text-[10px] font-mono text-[#4B5563]">{sub.publicId}</div>
                    </DetailEntityLink>
                    <StatusBadge status={sub.status} label={statusLabel(sub.status)} />
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
          <TabsContent value="analytics" className="mt-4">
            <div className="bg-white border border-black/[0.08] rounded-md p-5">
              <DetailFieldGrid
                fields={[
                  { label: "Drivers assigned", value: f.driversCount ?? fleetDrivers.length },
                  { label: "Drivers online", value: f.driversOnlineCount ?? 0 },
                  { label: "Vehicles assigned", value: f.vehiclesCount ?? fleetVehicles.length },
                  { label: "Vehicles online", value: f.vehiclesOnlineCount ?? 0 },
                  { label: "Utilization", value: f.driversCount ? `${Math.round(((f.driversOnlineCount ?? 0) / f.driversCount) * 100)}% drivers online` : "—" },
                  { label: "Fleet status", value: statusLabel(f.status) },
                ]}
              />
            </div>
          </TabsContent>
          <TabsContent value="compliance" className="mt-4">
            <div className="p-4">
              <HealthBanner warnings={warnings} testId="fleet-health-banner-compliance" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {wrapDetailEditDialog(
        embedded,
        editDialog.open,
        <FleetOpsFormDialog
          detached={embedded}
          open={editDialog.open}
          onOpenChange={editDialog.setOpen}
          title="Edit fleet"
          description="Update fleet profile, geography, vendor, and hierarchy."
          submitLabel="Save changes"
          busy={editDialog.busy}
          error={editDialog.error}
          onSubmit={editDialog.handleSubmit}
          testId="edit-fleet-dialog"
          size="lg"
        >
          {editDialog.open && (
            <FleetForm
              key={`fleet-edit-${id}`}
              ref={formRef}
              formId="fleet-edit-form"
              initialValues={fleetValuesFromApi(fleetApi)}
              serviceAreaOptions={lookups.serviceAreas}
              vendorOptions={lookups.facilitators}
              fleetOptions={lookups.fleets}
              excludeFleetId={id}
            />
          )}
        </FleetOpsFormDialog>,
      )}
      {deleteDialog}
    </>
  );

  if (embedded) {
    return <div data-testid="fleet-detail-page">{content}</div>;
  }

  return (
    <div data-testid="fleet-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Fleets", to: "/fleet-ops/management/fleets" },
          { label: f.name },
        ]}
        overline={f.publicId}
        title={f.name}
        description={f.task}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => editDialog.setOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="fleet-edit">
              <Edit3 className="h-4 w-4 mr-1" /> Edit fleet
            </Button>
            {canDelete ? (
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(true)}
                className="border-red-200 text-red-700 hover:bg-red-50"
                data-testid="fleet-delete"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            ) : null}
          </>
        }
      />
      {content}
    </div>
  );
}
