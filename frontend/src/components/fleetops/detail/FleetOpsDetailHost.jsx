import { lazy, Suspense, useCallback, useEffect } from "react";
import { ensureFleetopsEditPortal } from "@/components/fleetops/detail/fleetopsEditPortal";
import { useSearchParams } from "react-router-dom";
import EntityDetailDrawer from "@/components/fleetops/detail/EntityDetailDrawer";
import DetailUnsavedDialog from "@/components/fleetops/detail/DetailUnsavedDialog";
import { PageLoader } from "@/components/loaders";
import { useActiveFleetopsDetail } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import {
  FleetopsDetailDirtyProvider,
  useFleetopsDetailDirty,
} from "@/hooks/fleetops/useFleetopsDetailDirty";
import { FLEETOPS_DETAIL_DRAWER_WIDTH } from "@/domain/fleetops/detail/registry";

const DETAIL_VIEWS = {
  driver: lazy(() => import("@/pages/fleetops/DriverDetail")),
  vehicle: lazy(() => import("@/pages/fleetops/VehicleDetail")),
  fleet: lazy(() => import("@/pages/fleetops/FleetDetail")),
  place: lazy(() => import("@/pages/fleetops/PlaceDetail")),
  order: lazy(() => import("@/pages/fleetops/OrderDetail")),
  route: lazy(() => import("@/pages/fleetops/routes/RouteDetail")),
  vendor: lazy(() => import("@/pages/fleetops/management/VendorDetail")),
  contact: lazy(() => import("@/pages/fleetops/management/ContactDetail")),
  issue: lazy(() => import("@/pages/fleetops/management/IssueDetail")),
  fuelReport: lazy(() => import("@/pages/fleetops/management/FuelReportDetail")),
  serviceRate: lazy(() => import("@/pages/fleetops/ServiceRateDetail")),
  customer: lazy(() => import("@/pages/fleetops/management/CustomerDetail")),
  integratedVendor: lazy(() => import("@/pages/fleetops/management/IntegratedVendorDetail")),
  telematic: lazy(() => import("@/pages/fleetops/connectivity/TelematicDetail")),
  device: lazy(() => import("@/pages/fleetops/connectivity/DeviceDetail")),
  sensor: lazy(() => import("@/pages/fleetops/connectivity/SensorDetail")),
  deviceEvent: lazy(() => import("@/pages/fleetops/connectivity/DeviceEventDetail")),
  maintenanceSchedule: lazy(() => import("@/pages/fleetops/maintenance/MaintenanceScheduleDetail")),
  maintenance: lazy(() => import("@/pages/fleetops/maintenance/MaintenanceDetail")),
  workOrder: lazy(() => import("@/pages/fleetops/maintenance/WorkOrderDetail")),
  equipment: lazy(() => import("@/pages/fleetops/maintenance/EquipmentDetail")),
  part: lazy(() => import("@/pages/fleetops/maintenance/PartDetail")),
  warranty: lazy(() => import("@/pages/fleetops/admin/WarrantyDetail")),
  manifest: lazy(() => import("@/pages/fleetops/admin/ManifestDetail")),
  payload: lazy(() => import("@/pages/fleetops/admin/PayloadDetail")),
  entity: lazy(() => import("@/pages/fleetops/admin/EntityDetail")),
  proof: lazy(() => import("@/pages/fleetops/admin/ProofDetail")),
  purchaseRate: lazy(() => import("@/pages/fleetops/admin/PurchaseRateDetail")),
  trackingNumber: lazy(() => import("@/pages/fleetops/admin/TrackingNumberDetail")),
  trackingStatus: lazy(() => import("@/pages/fleetops/admin/TrackingStatusDetail")),
  serviceArea: lazy(() => import("@/pages/fleetops/service-areas/ServiceAreaDetail")),
  customField: lazy(() => import("@/pages/fleetops/custom-fields/CustomFieldDetail")),
};

function FleetOpsDetailHostInner() {
  useEffect(() => {
    ensureFleetopsEditPortal();
  }, []);

  const { entity, entityId, config } = useActiveFleetopsDetail();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    requestClose,
    confirmOpen,
    discardAndProceed,
    cancelClose,
    isDirty,
    detailEditOpen,
    isDetailEditGuarded,
  } = useFleetopsDetailDirty();

  const closeDetail = useCallback(() => {
    if (!config) return;
    const next = new URLSearchParams(searchParams);
    next.delete(config.param);
    next.delete(`${config.param}Tab`);
    setSearchParams(next, { replace: true });
  }, [config, searchParams, setSearchParams]);

  const onTabChange = useCallback(
    (tab) => {
      if (!config || !entityId) return;
      const apply = () => {
        const next = new URLSearchParams(searchParams);
        if (tab) next.set(`${config.param}Tab`, tab);
        else next.delete(`${config.param}Tab`);
        setSearchParams(next, { replace: true });
      };
      if (isDirty) requestClose(apply);
      else apply();
    },
    [config, entityId, searchParams, setSearchParams, isDirty, requestClose],
  );

  const activeTab = config ? searchParams.get(`${config.param}Tab`) : null;
  const DetailView = entity ? DETAIL_VIEWS[entity] : null;

  const handleOpenChange = useCallback(
    (nextOpen) => {
      if (!nextOpen && (detailEditOpen || isDetailEditGuarded())) {
        return;
      }
      if (!nextOpen) requestClose(closeDetail);
    },
    [requestClose, closeDetail, detailEditOpen],
  );

  return (
    <>
      <EntityDetailDrawer
        open={Boolean(entityId && config)}
        onOpenChange={handleOpenChange}
        suspended={detailEditOpen}
        width={config?.width ?? FLEETOPS_DETAIL_DRAWER_WIDTH}
        large={false}
        testId={config?.testId || "entity-detail-drawer"}
        accessibilityTitle={config?.label ? `${config.label} details` : "FleetOps detail"}
        dirty={isDirty}
        onCloseAttempt={() => {
          if (isDirty) {
            requestClose(closeDetail);
            return false;
          }
          return true;
        }}
      >
        {entityId && DetailView ? (
          <Suspense
            fallback={
              <PageLoader loading skeleton="detail" message="Loading…" testId="detail-drawer-loader" />
            }
          >
            <DetailView
              embedded
              entityId={entityId}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onClose={() => requestClose(closeDetail)}
            />
          </Suspense>
        ) : null}
      </EntityDetailDrawer>
      <DetailUnsavedDialog
        open={confirmOpen}
        onDiscard={discardAndProceed}
        onCancel={cancelClose}
      />
    </>
  );
}

export default function FleetOpsDetailHost() {
  return (
    <FleetopsDetailDirtyProvider>
      <FleetOpsDetailHostInner />
    </FleetopsDetailDirtyProvider>
  );
}
