import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { useFormDirtyBridge } from "@/hooks/fleetops/useFormDirtyBridge";
import { DetailLoadingState, resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import FleetForm, { fleetValuesFromApi } from "@/components/fleetops/forms/FleetForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Edit3, Users, Truck } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapFleet, mapVehicleRow, statusLabel } from "@/lib/mappers";
import { reconcileCreatedRow } from "@/lib/fleetops/list-reconcile";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { toast } from "sonner";
import HealthBanner from "@/components/fleetops/health/HealthBanner";
import { useFleetopsWarnings } from "@/hooks/fleetops/useFleetopsWarnings";
import { wrapDetailEditDialog } from "@/lib/fleetops/detailEmbedded";

const COLORS = ["#0066FF", "#16A34A", "#7C3AED", "#EA580C", "#0891B2", "#DC2626"];

export default function FleetDetail({ embedded = false, entityId: entityIdProp }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fleet, setFleet] = useState(null);
  const [fleetApi, setFleetApi] = useState(null);
  const [fleetDrivers, setFleetDrivers] = useState([]);
  const [fleetVehicles, setFleetVehicles] = useState([]);
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
          description: "description",
        }),
      );
      fleetopsCache.invalidateFleet(id);
      return updated;
    },
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const raw = await fleetopsService.getFleet(id);
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

      const driverRows = Array.isArray(raw?.drivers) ? raw.drivers.map(mapDriverRow) : [];
      const vehicleRows = Array.isArray(raw?.vehicles) ? raw.vehicles.map(mapVehicleRow) : [];

      if (driverRows.length > 0) {
        setFleetDrivers(driverRows);
      } else {
        const ids = fm.driverIds || [];
        const loaded = await Promise.all(
          ids.map((did) => fleetopsService.getDriver(did).catch(() => null)),
        );
        setFleetDrivers(loaded.filter(Boolean).map(mapDriverRow));
      }

      if (vehicleRows.length > 0) {
        setFleetVehicles(vehicleRows);
      } else {
        const vids = fm.vehicleIds || [];
        const loadedV = await Promise.all(
          vids.map((vid) => fleetopsService.getVehicle(vid).catch(() => null)),
        );
        setFleetVehicles(loadedV.filter(Boolean).map(mapVehicleRow));
      }
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

  const accent = useMemo(() => {
    if (fleet?.color) return fleet.color;
    const i = String(fleet?.id || "").length % COLORS.length;
    return COLORS[i];
  }, [fleet]);

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
          </span>
        </div>
        <Tabs defaultValue="overview">
          <TabsList className="bg-[#F1F2F5] border border-black/[0.08] flex-wrap h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drivers" data-testid="fleet-tab-drivers">
              Drivers ({fleetDrivers.length})
            </TabsTrigger>
            <TabsTrigger value="vehicles" data-testid="fleet-tab-vehicles">
              Vehicles ({fleetVehicles.length})
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
              {f.description || "No fleet description."}
            </div>
          </TabsContent>
          <TabsContent value="drivers" className="mt-4">
            <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
              {fleetDrivers.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">No drivers associated with this fleet.</div>
              ) : (
                fleetDrivers.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F1F2F5]/50 transition-colors">
                    <div className="h-8 w-8 bg-blue-600 grid place-items-center rounded-sm font-mono font-bold text-xs text-white">
                      {String(d.name || "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <DetailEntityLink entityKey="driver" entityId={d.id} className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{d.name}</div>
                      <div className="text-[10px] font-mono text-[#4B5563]">{d.publicId}</div>
                    </DetailEntityLink>
                    <StatusBadge status={d.status} label={statusLabel(d.status)} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="vehicles" className="mt-4">
            <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
              {fleetVehicles.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">No vehicles associated with this fleet.</div>
              ) : (
                fleetVehicles.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F1F2F5]/50 transition-colors">
                    <div className="h-8 w-8 bg-[#F1F2F5] border border-black/[0.08] grid place-items-center rounded-sm">
                      <Truck className="h-4 w-4 text-[#374151]" strokeWidth={1.75} />
                    </div>
                    <DetailEntityLink entityKey="vehicle" entityId={v.id} className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{v.name}</div>
                      <div className="text-[10px] font-mono text-[#4B5563]">
                        {v.plate} · {v.make} {v.model}
                      </div>
                    </DetailEntityLink>
                    <StatusBadge status={v.status} label={statusLabel(v.status)} />
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <div className="bg-white border border-black/[0.08] rounded-md p-5">
              <DetailFieldGrid
                fields={[
                  { label: "Drivers", value: fleetDrivers.length },
                  { label: "Vehicles", value: fleetVehicles.length },
                  { label: "Status", value: statusLabel(f.status) },
                  { label: "Region", value: f.region || "—" },
                ]}
              />
            </div>
          </TabsContent>
          <TabsContent value="compliance" className="mt-4">
            <div className="p-4">
              <HealthBanner warnings={warnings} testId="fleet-health-banner" />
            </div>
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
              Fleet operational events surface from driver/vehicle assignment changes and dispatch activity.
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
          description="Updates fleet name, service area, region, and operational metadata."
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
            />
          )}
        </FleetOpsFormDialog>,
      )}
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
        description={f.description}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => editDialog.setOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="fleet-edit">
              <Edit3 className="h-4 w-4 mr-1" /> Edit fleet
            </Button>
          </>
        }
      />
      {content}
    </div>
  );
}
