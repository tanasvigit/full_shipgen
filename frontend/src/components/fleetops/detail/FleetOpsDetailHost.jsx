import { lazy, Suspense, useCallback, useEffect } from "react";
import { ensureFleetopsEditPortal } from "@/components/fleetops/detail/fleetopsEditPortal";
import { useSearchParams } from "react-router-dom";
import EntityDetailDrawer from "@/components/fleetops/detail/EntityDetailDrawer";
import DetailUnsavedDialog from "@/components/fleetops/detail/DetailUnsavedDialog";
import { useActiveFleetopsDetail } from "@/hooks/fleetops/useFleetopsDetailDrawer";
import {
  FleetopsDetailDirtyProvider,
  useFleetopsDetailDirty,
} from "@/hooks/fleetops/useFleetopsDetailDirty";
import { PageLoader } from "@/components/loaders";

const DETAIL_VIEWS = {
  driver: lazy(() => import("@/pages/fleetops/DriverDetail")),
  vehicle: lazy(() => import("@/pages/fleetops/VehicleDetail")),
  fleet: lazy(() => import("@/pages/fleetops/FleetDetail")),
  place: lazy(() => import("@/pages/fleetops/PlaceDetail")),
  order: lazy(() => import("@/pages/fleetops/OrderDetail")),
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
        width={config?.width ?? 720}
        large={config?.large}
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
