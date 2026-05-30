import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import DriverForm, { driverValuesFromApi } from "@/components/fleetops/forms/DriverForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Hash, Star, ArrowLeft, Edit3 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapVehicleRow, statusLabel } from "@/lib/mappers";
import { toast } from "sonner";
import HealthBanner from "@/components/fleetops/health/HealthBanner";
import { evaluateDriverCompliance } from "@/domain/fleetops/compliance/evaluateCompliance";
import { useFleetopsWarnings } from "@/hooks/fleetops/useFleetopsWarnings";
import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailDrawerLayout from "@/components/fleetops/detail/DetailDrawerLayout";
import DetailDrawerTabs from "@/components/fleetops/detail/DetailDrawerTabs";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import DriverOverviewTab from "@/components/fleetops/detail/tabs/driver/DriverOverviewTab";
import DriverOrdersTab from "@/components/fleetops/detail/tabs/driver/DriverOrdersTab";
import DriverPositionsTab from "@/components/fleetops/detail/tabs/driver/DriverPositionsTab";
import DriverScheduleTab from "@/components/fleetops/detail/tabs/driver/DriverScheduleTab";
import DriverDocumentsTab from "@/components/fleetops/detail/tabs/driver/DriverDocumentsTab";
import DriverActivityTab from "@/components/fleetops/detail/tabs/driver/DriverActivityTab";
import DriverFinancialsTab from "@/components/fleetops/detail/tabs/driver/DriverFinancialsTab";
import DriverAssignmentActions from "@/components/fleetops/driver/DriverAssignmentActions";
import { getExtensionTabs } from "@/domain/fleetops/detail/registry";
import { useFormDirtyBridge } from "@/hooks/fleetops/useFormDirtyBridge";
import { PageLoader } from "@/components/loaders";
import { wrapDetailEditDialog } from "@/lib/fleetops/detailEmbedded";

const DRIVER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "positions", label: "Live Map" },
  { id: "orders", label: "Orders" },
  { id: "schedule", label: "Schedule" },
  { id: "compliance", label: "Compliance" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity" },
  { id: "financials", label: "Financials" },
];

/**
 * @param {{ embedded?: boolean, entityId?: string, activeTab?: string|null, onTabChange?: (tab: string) => void, onClose?: () => void }} props
 */
export default function DriverDetail({
  embedded = false,
  entityId: entityIdProp,
  activeTab: activeTabProp,
  onTabChange,
  onClose,
}) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const id = entityIdProp || routeId;
  const [loading, setLoading] = useState(true);
  const [driverApi, setDriverApi] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [hosStatus, setHosStatus] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const editDialog = useFleetopsFormDialog({
    formRef,
    suspendDrawer: embedded,
    successMessage: "Driver updated",
    onSubmit: async (values) => {
      const updated = await fleetopsService.updateDriver(id, values);
      setDriverApi(updated);
      return updated;
    },
  });

  const loadAll = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const rawDriver = await fleetopsService.getDriver(id);
      setDriverApi(rawDriver || null);

      let v = null;
      const dv =
        rawDriver?.vehicle_uuid ||
        rawDriver?.vehicle_id ||
        rawDriver?.vehicle?.id ||
        rawDriver?.assigned_vehicle_uuid;
      if (dv) {
        try {
          const rawVehicle = await fleetopsService.getVehicle(dv);
          setVehicle(rawVehicle ? mapVehicleRow(rawVehicle) : null);
        } catch {
          setVehicle(null);
        }
      } else {
        setVehicle(null);
      }

      const [hos, shift] = await Promise.all([
        fleetopsService.getDriverHosStatus(id).catch(() => null),
        fleetopsService.getDriverActiveShift(id).catch(() => null),
      ]);
      setHosStatus(hos);
      setActiveShift(shift);
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error("Driver not found.");
        setDriverApi(null);
      } else {
        toast.error(err?.friendlyMessage || "Could not load driver.");
        setDriverApi(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const d = useMemo(() => (driverApi ? mapDriverRow(driverApi) : null), [driverApi]);
  const complianceIssues = useMemo(() => evaluateDriverCompliance(driverApi), [driverApi]);
  const { warnings } = useFleetopsWarnings({ driver: d });

  const tabValue = activeTabProp || "overview";
  const tabActive = (tab) => tabValue === tab;

  useFormDirtyBridge(formRef, editDialog.open, "driver-edit");

  const handleTabChange = (tab) => onTabChange?.(tab);

  const lastUpdated = d?.updatedAt || driverApi?.updated_at
    ? new Date(d?.updatedAt || driverApi?.updated_at).toLocaleString()
    : null;

  if (loading && !d) {
    return embedded ? (
      <PageLoader loading skeleton="detail" message="Loading driver…" testId="driver-detail-loader" />
    ) : (
      <div className="p-8 text-[#374151]">Loading driver…</div>
    );
  }

  if (!d) {
    return <div className="p-8 text-[#374151]">Driver not found.</div>;
  }

  const overviewMain = (
    <div className="space-y-4">
      <DriverAssignmentActions driverId={id} driverName={d.name} />
      <DriverOverviewTab driver={d} driverApi={driverApi} />
    </div>
  );

  const overviewSidebar = (
    <>
      <div className="bg-white border border-black/[0.08] rounded-md p-4">
        <div className="overline mb-3">Contact</div>
        <div className="space-y-2 text-sm text-[#1F2937]">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-[#4B5563]" /> {d.email || "—"}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[#4B5563]" /> {d.phone || "—"}
          </div>
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-[#4B5563]" />
            <span className="font-mono">{d.internalId || "—"}</span>
          </div>
        </div>
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md p-4">
        <div className="overline mb-3">Performance</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="overline">Rating</div>
            <div className="font-display text-xl font-bold mt-1 flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-[#A16207]" /> {Number(d.rating || 0).toFixed(1)}
            </div>
          </div>
          <div>
            <div className="overline">Orders</div>
            <div className="font-display text-xl font-bold tabular mt-1">
              {Number(d.ordersCompleted || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      {vehicle && (
        <div className="bg-white border border-black/[0.08] rounded-md p-4">
          <div className="overline mb-3">Assigned Vehicle</div>
          <DetailEntityLink entityKey="vehicle" entityId={vehicle.id}>
            <div className="font-medium">{vehicle.name}</div>
            <div className="text-xs font-mono text-[#4B5563] mt-0.5">
              {vehicle.plate} · {vehicle.make} {vehicle.model}
            </div>
          </DetailEntityLink>
        </div>
      )}
    </>
  );

  const extensionTabs = getExtensionTabs("driver").map((tab) => ({
    id: tab.id,
    label: tab.label,
    testId: tab.testId,
    content: tab.render?.({ driver: d, driverApi, embedded }) ?? null,
  }));

  const tabs = [
    ...DRIVER_TABS.map((t) => {
      let content = null;
      switch (t.id) {
        case "overview":
          content = <DetailDrawerLayout main={overviewMain} sidebar={overviewSidebar} />;
          break;
        case "positions":
          content = (
            <DriverPositionsTab driverId={id} driver={d} enabled={tabActive("positions")} />
          );
          break;
        case "orders":
          content = <DriverOrdersTab driverId={id} enabled={tabActive("orders")} />;
          break;
        case "schedule":
          content = <DriverScheduleTab driverId={id} enabled={tabActive("schedule")} />;
          break;
        case "documents":
          content = <DriverDocumentsTab driverApi={driverApi} enabled={tabActive("documents")} />;
          break;
        case "compliance":
          content = (
            <div className="p-4 space-y-4">
              <HealthBanner issues={complianceIssues} warnings={warnings} testId="driver-health-banner" />
            </div>
          );
          break;
        case "activity":
          content = (
            <DriverActivityTab driverId={id} driverApi={driverApi} enabled={tabActive("activity")} />
          );
          break;
        case "financials":
          content = <DriverFinancialsTab driverApi={driverApi} />;
          break;
        default:
          content = null;
      }
      return {
        ...t,
        testId: `driver-tab-${t.id}`,
        content,
      };
    }),
    ...extensionTabs,
  ];

  const drawerBody = (
    <>
      <DetailDrawerHeader
        overline="Driver"
        title={d.name}
        publicId={d.publicId}
        status={d.status}
        statusLabel={statusLabel(d.status)}
        healthIssues={complianceIssues}
        lastUpdated={lastUpdated}
        badges={
          <>
            {hosStatus && (
              <StatusBadge
                status={hosStatus.status || hosStatus.duty_status || "unknown"}
                label={`HOS: ${hosStatus.status || hosStatus.duty_status || "—"}`}
              />
            )}
            {activeShift && (
              <span className="text-xs font-mono text-[#374151]" data-testid="driver-active-shift-header">
                On shift
              </span>
            )}
          </>
        }
        onEdit={embedded ? editDialog.openEdit : () => editDialog.setOpen(true)}
        editTestId="driver-edit"
      />
      <div className="px-4 pb-2">
        {!embedded && (
          <HealthBanner issues={complianceIssues} warnings={warnings} testId="driver-health-banner" />
        )}
      </div>
      <DetailDrawerTabs value={tabValue} onValueChange={handleTabChange} tabs={tabs} />
      {wrapDetailEditDialog(
        embedded,
        editDialog.open,
        <FleetOpsFormDialog
          detached={embedded}
          open={editDialog.open}
          onOpenChange={editDialog.setOpen}
          title="Edit driver"
          description="Updates driver profile, license, assignment, and routing constraints."
          submitLabel="Save changes"
          busy={editDialog.busy}
          error={editDialog.error}
          onSubmit={editDialog.handleSubmit}
          testId="edit-driver-dialog"
          size="xl"
        >
          {editDialog.open && (
            <DriverForm
              key={`driver-edit-${id}`}
              ref={formRef}
              formId="driver-edit-form"
              initialValues={driverValuesFromApi(driverApi)}
              vehicleOptions={lookups.vehicles}
              vendorOptions={lookups.facilitators}
            />
          )}
        </FleetOpsFormDialog>,
      )}
    </>
  );

  if (embedded) {
    return <div data-testid="driver-detail-page">{drawerBody}</div>;
  }

  return (
    <div data-testid="driver-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Drivers", to: "/fleet-ops/management/drivers" },
          { label: d.name },
        ]}
        overline="Driver"
        title={d.name}
        description={
          <span className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={d.status} label={statusLabel(d.status)} />
            <span className="text-xs font-mono text-[#4B5563]">{d.publicId}</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => editDialog.setOpen(true)} className="bg-blue-600 hover:bg-blue-700" data-testid="driver-edit">
              <Edit3 className="h-4 w-4 mr-1" /> Edit driver
            </Button>
          </>
        }
      />
      {drawerBody}
    </div>
  );
}
