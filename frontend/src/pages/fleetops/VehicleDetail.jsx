import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import VehicleOrdersTab from "@/components/fleetops/detail/tabs/vehicle/VehicleOrdersTab";
import VehicleDevicesTab from "@/components/fleetops/detail/tabs/vehicle/VehicleDevicesTab";
import VehicleWorkOrdersTab from "@/components/fleetops/detail/tabs/vehicle/VehicleWorkOrdersTab";
import MapView from "@/components/common/MapView";
import { DetailLoadingState, resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";
import { useFormDirtyBridge } from "@/hooks/fleetops/useFormDirtyBridge";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import VehicleForm, { vehicleValuesFromApi } from "@/components/fleetops/forms/VehicleForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Edit3, Truck, Fuel, Gauge, Wrench, Calendar } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapVehicleRow, statusLabel } from "@/lib/mappers";
import { toast } from "sonner";
import HealthBanner from "@/components/fleetops/health/HealthBanner";
import { evaluateVehicleCompliance } from "@/domain/fleetops/compliance/evaluateCompliance";
import { useFleetopsWarnings } from "@/hooks/fleetops/useFleetopsWarnings";
import { wrapDetailEditDialog } from "@/lib/fleetops/detailEmbedded";

export default function VehicleDetail({
  embedded = false,
  entityId: entityIdProp,
  activeTab: activeTabProp,
  onClose,
}) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const tabActive = (tab) => (activeTabProp || "info") === tab;
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [vehicleApi, setVehicleApi] = useState(null);
  const [driver, setDriver] = useState(null);
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const editDialog = useFleetopsFormDialog({
    formRef,
    suspendDrawer: embedded,
    successMessage: "Vehicle updated",
    onSubmit: async (values) => {
      const updated = await fleetopsService.updateVehicle(id, values);
      setVehicleApi(updated);
      setVehicle(mapVehicleRow(updated));
      return updated;
    },
  });

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const rawVehicle = await fleetopsService.getVehicle(id);
      if (!rawVehicle) {
        setVehicle(null);
        setVehicleApi(null);
        setDriver(null);
        return;
      }
      setVehicleApi(rawVehicle);
      const vrow = mapVehicleRow(rawVehicle);
      setVehicle(vrow);

      if (vrow.driverId) {
        try {
          const rawDriver = await fleetopsService.getDriver(vrow.driverId);
          setDriver(rawDriver ? mapDriverRow(rawDriver) : null);
        } catch {
          setDriver(null);
        }
      } else {
        setDriver(null);
      }
    } catch (err) {
      if (err?.response?.status === 404) toast.error("Vehicle not found.");
      else toast.error(err?.friendlyMessage || "Could not load vehicle.");
      setVehicle(null);
      setDriver(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useFormDirtyBridge(formRef, editDialog.open, "vehicle-edit");

  const complianceIssues = useMemo(() => evaluateVehicleCompliance(vehicleApi), [vehicleApi]);
  const { warnings } = useFleetopsWarnings({ vehicle });

  if (!loading && !vehicle) {
    return <div className="p-8 text-[#374151]">Vehicle not found.</div>;
  }
  if (loading && !vehicle) {
    return (
      <DetailLoadingState embedded={embedded} message="Loading vehicle…" testId="vehicle-detail-loader" />
    );
  }

  const v = vehicle;
  const fuel = Number.isFinite(Number(v.fuel)) ? Number(v.fuel) : 0;

  const body = (
    <>
      {embedded ? (
        <DetailDrawerHeader
          overline={`Vehicle · ${v.plate}`}
          title={v.name}
          publicId={v.publicId}
          status={v.status}
          statusLabel={statusLabel(v.status)}
          healthIssues={complianceIssues}
          onEdit={embedded ? editDialog.openEdit : () => editDialog.setOpen(true)}
          editTestId="vehicle-edit"
        />
      ) : null}
      <div className={embedded ? "px-0 pb-2" : "px-6 pb-2"}>
        <HealthBanner issues={complianceIssues} warnings={warnings} testId="vehicle-health-banner" />
      </div>
      <div className={`${embedded ? "p-4" : "p-6"} pt-2 grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Telemetry icon={Fuel} label="Fuel Level" value={`${fuel}%`} tone={fuel < 25 ? "danger" : fuel < 50 ? "warning" : "success"} />
            <Telemetry icon={Gauge} label="Speed" value={`${Number(v.telematics?.speed ?? 0)} km/h`} tone="info" />
            <Telemetry
              icon={Truck}
              label="Engine"
              value={v.telematics?.engine ?? "—"}
              tone={v.telematics?.engine === "running" ? "success" : "neutral"}
            />
            <Telemetry icon={Gauge} label="Temp" value={`${Number(v.telematics?.temp ?? 0)}°C`} tone="info" />
          </div>
          <Tabs defaultValue="info">
            <TabsList className="bg-[#F1F2F5] border border-black/[0.08]">
              <TabsTrigger value="info" data-testid="vehicle-tab-info">
                Overview
              </TabsTrigger>
              <TabsTrigger value="tracking" data-testid="vehicle-tab-tracking">
                Live Tracking
              </TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="devices" data-testid="vehicle-tab-devices">
                Devices
              </TabsTrigger>
              <TabsTrigger value="work-orders" data-testid="vehicle-tab-work-orders">
                Work orders
              </TabsTrigger>
              <TabsTrigger value="orders">Orders / Trips</TabsTrigger>
              <TabsTrigger value="fuel">Fuel</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="telematics">Telematics</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Info label="Make" value={v.make || "—"} />
                <Info label="Model" value={v.model || "—"} />
                <Info label="Year" value={String(v.year || "—")} />
                <Info label="Type" value={String(v.type || "").replace(/_/g, " ")} />
                <Info label="VIN" value={v.vin} mono />
                <Info label="Plate" value={v.plate} mono />
                <Info label="Mileage" value={`${Number(v.mileage || 0).toLocaleString()} km`} />
                <Info label="Status" value={<StatusBadge status={v.status} />} />
              </div>
            </TabsContent>
            <TabsContent value="tracking" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
                <div className="h-[280px]">
                  <MapView
                    markers={[
                      {
                        id: v.id,
                        lat: Number(vehicleApi?.latitude || vehicleApi?.location?.latitude || 0) || 40.75,
                        lng: Number(vehicleApi?.longitude || vehicleApi?.location?.longitude || 0) || -73.98,
                        label: v.name,
                        color: "#0066FF",
                      },
                    ]}
                    testid="vehicle-tracking-map"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="devices" className="mt-4">
              <VehicleDevicesTab vehicleId={id} enabled={tabActive("devices") || !embedded} />
            </TabsContent>
            <TabsContent value="work-orders" className="mt-4">
              <VehicleWorkOrdersTab vehicleId={id} enabled={tabActive("work-orders") || !embedded} />
            </TabsContent>
            <TabsContent value="maintenance" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/30 grid place-items-center rounded-sm">
                      <Wrench className="h-4 w-4 text-[#15803D]" />
                    </div>
                    <div>
                      <div className="font-medium">Last service</div>
                      <div className="text-xs text-[#4B5563] font-mono">{v.lastService}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/30 grid place-items-center rounded-sm">
                      <Calendar className="h-4 w-4 text-[#A16207]" />
                    </div>
                    <div>
                      <div className="font-medium">Next service due</div>
                      <div className="text-xs text-[#4B5563] font-mono">{v.nextService}</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="orders" className="mt-4">
              <VehicleOrdersTab vehicleId={id} enabled={tabActive("orders") || !embedded} />
            </TabsContent>
            <TabsContent value="fuel" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md p-5">
                <DetailFieldGrid
                  fields={[
                    { label: "Fuel level", value: `${fuel}%` },
                    { label: "Efficiency", value: vehicleApi?.fuel_efficiency ?? "—" },
                    { label: "Last fill", value: vehicleApi?.last_fuel_at ?? "—" },
                  ]}
                />
              </div>
            </TabsContent>
            <TabsContent value="documents" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
                Registration and insurance documents appear when attached to this vehicle record.
              </div>
            </TabsContent>
            <TabsContent value="compliance" className="mt-4">
              <div className="p-4">
                <HealthBanner issues={complianceIssues} warnings={warnings} testId="vehicle-health-banner" />
              </div>
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md p-5 font-mono text-xs space-y-1">
                <div>last_service: {v.lastService}</div>
                <div>next_service: {v.nextService}</div>
                <div>driver_assignment: {driver?.name || "—"}</div>
              </div>
            </TabsContent>
            <TabsContent value="telematics" className="mt-4">
              <div className="bg-white border border-black/[0.08] rounded-md p-5 font-mono text-xs space-y-1">
                <div>engine_state: {v.telematics?.engine ?? "—"}</div>
                <div>speed_kmh: {Number(v.telematics?.speed ?? 0)}</div>
                <div>coolant_temp_c: {Number(v.telematics?.temp ?? 0)}</div>
                <div>fuel_pct: {fuel}</div>
                <div>odometer_km: {Number(v.mileage || 0)}</div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <aside className="space-y-4">
          {driver ? (
            <div className="bg-white border border-black/[0.08] rounded-md p-4">
              <div className="overline mb-3">Assigned Driver</div>
              <DetailEntityLink entityKey="driver" entityId={driver.id}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-blue-600 grid place-items-center rounded-sm font-mono font-bold text-xs text-white">
                    {String(driver.name || "")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-medium">{driver.name}</div>
                    <div className="text-[11px] text-[#4B5563] font-mono">{driver.publicId}</div>
                  </div>
                </div>
              </DetailEntityLink>
            </div>
          ) : (
            <div className="bg-white border border-black/[0.08] rounded-md p-4 text-sm text-[#4B5563]">No driver assigned to this vehicle.</div>
          )}
          <div className="bg-white border border-black/[0.08] rounded-md p-4">
            <div className="overline mb-3">Identifiers</div>
            <div className="space-y-2 text-xs font-mono text-[#374151]">
              <div>{v.publicId}</div>
              <div>VIN · {v.vin}</div>
              <div>Plate · {v.plate}</div>
            </div>
          </div>
        </aside>
      </div>
      {wrapDetailEditDialog(
        embedded,
        editDialog.open,
        <FleetOpsFormDialog
          detached={embedded}
          open={editDialog.open}
          onOpenChange={editDialog.setOpen}
          title="Edit vehicle"
          description="Updates registration, capacity, assignment, and status."
          submitLabel="Save changes"
          busy={editDialog.busy}
          error={editDialog.error}
          onSubmit={editDialog.handleSubmit}
          testId="edit-vehicle-dialog"
          size="xl"
        >
          {editDialog.open && (
            <VehicleForm
              key={`vehicle-edit-${id}`}
              ref={formRef}
              formId="vehicle-edit-form"
              initialValues={vehicleValuesFromApi(vehicleApi)}
              driverOptions={lookups.drivers}
            />
          )}
        </FleetOpsFormDialog>,
      )}
    </>
  );

  if (embedded) {
    return <div data-testid="vehicle-detail-page">{body}</div>;
  }

  return (
    <div data-testid="vehicle-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Vehicles", to: "/fleet-ops/management/vehicles" },
          { label: v.name },
        ]}
        overline={`Vehicle · ${v.plate}`}
        title={v.name}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={v.status} label={statusLabel(v.status)} /> <span className="text-xs font-mono text-[#4B5563]">{v.publicId}</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => editDialog.setOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="vehicle-edit">
              <Edit3 className="h-4 w-4 mr-1" /> Edit
            </Button>
          </>
        }
      />
      {body}
    </div>
  );
}

function Telemetry({ icon: Icon, label, value, tone = "info" }) {
  const tones = {
    success: "text-[#15803D] bg-emerald-500/10 border-emerald-500/20",
    warning: "text-[#A16207] bg-amber-500/10 border-amber-500/20",
    danger: "text-[#B91C1C] bg-red-500/10 border-red-500/20",
    info: "text-[#0066FF] bg-blue-500/10 border-blue-500/20",
    neutral: "text-[#374151] bg-[#EEF0F4] border-black/[0.14]",
  };
  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-4">
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border text-[10px] font-mono uppercase tracking-wider ${tones[tone]}`}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display text-2xl font-bold tabular mt-2 capitalize">{value}</div>
    </div>
  );
}
function Info({ label, value, mono }) {
  return (
    <div>
      <div className="overline">{label}</div>
      <div className={`text-sm text-[#0A0E1A] mt-1 capitalize ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
