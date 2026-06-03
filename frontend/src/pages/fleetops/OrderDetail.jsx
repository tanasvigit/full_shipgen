import { useCallback, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import DetailDrawerHeader from "@/components/fleetops/detail/DetailDrawerHeader";
import DetailDrawerTabs from "@/components/fleetops/detail/DetailDrawerTabs";
import OrderTrackingTab from "@/components/fleetops/detail/tabs/order/OrderTrackingTab";
import OrderFinancialsTab from "@/components/fleetops/detail/tabs/order/OrderFinancialsTab";
import OrderCommunicationTab from "@/components/fleetops/detail/tabs/order/OrderCommunicationTab";
import OrderAuditTab from "@/components/fleetops/detail/tabs/order/OrderAuditTab";
import OrderOperationalDetailTab from "@/components/fleetops/detail/tabs/order/OrderOperationalDetailTab";
import OrderPayloadTab from "@/components/fleetops/detail/tabs/order/OrderPayloadTab";
import OrderMetadataTab from "@/components/fleetops/detail/tabs/order/OrderMetadataTab";
import OrderNotesTab from "@/components/fleetops/detail/tabs/order/OrderNotesTab";
import OrderPurchaseRateTab from "@/components/fleetops/detail/tabs/order/OrderPurchaseRateTab";
import OrderIntegratedVendorTab from "@/components/fleetops/detail/tabs/order/OrderIntegratedVendorTab";
import OrderCustomFieldsTab from "@/components/fleetops/detail/tabs/order/OrderCustomFieldsTab";
import { DetailLoadingState, resolveDetailEntityId, wrapDetailEditDialog } from "@/lib/fleetops/detailEmbedded";
import { useFormDirtyBridge } from "@/hooks/fleetops/useFormDirtyBridge";
import { useOrderRealtime } from "@/hooks/fleetops/useOrderRealtime";
import EmptyState from "@/components/common/EmptyState";
import HealthBanner from "@/components/fleetops/health/HealthBanner";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import OrderForm, { orderValuesFromApi } from "@/components/fleetops/forms/OrderForm";
import OrderWorkflowPanel from "@/components/fleetops/orders/detail/workflow/OrderWorkflowPanel";
import OrderOverviewSection from "@/components/fleetops/orders/detail/sections/OrderOverviewSection";
import OrderActivityPanel from "@/components/fleetops/orders/detail/timeline/OrderActivityPanel";
import OrderDocumentsPanel from "@/components/fleetops/orders/detail/documents/OrderDocumentsPanel";
import OrderRouteEditor from "@/components/fleetops/orders/detail/panels/OrderRouteEditor";
import AssignDriverDialog from "@/components/fleetops/orders/modals/AssignDriverDialog";
import OrderLabelDialog from "@/components/fleetops/orders/OrderLabelDialog";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { useOrderDetail } from "@/hooks/fleetops/useOrderDetail";
import { useFleetopsWarnings } from "@/hooks/fleetops/useFleetopsWarnings";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit3, RefreshCw, UserPlus, UserMinus, Tag, Calendar, Trash2 } from "lucide-react";
import OrderScheduleDialog from "@/components/fleetops/orders/modals/OrderScheduleDialog";
import OrderMetadataDialog from "@/components/fleetops/orders/modals/OrderMetadataDialog";
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
import { fleetopsService } from "@/services/fleetops";
import { canEditOrder } from "@/domain/fleetops/guards/orderGuards";
import { statusLabel } from "@/lib/mappers";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { getExtensionTabs } from "@/domain/fleetops/detail/registry";

export default function OrderDetail({
  embedded = false,
  entityId: entityIdProp,
  activeTab: activeTabProp,
  onTabChange,
}) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  const navigate = useNavigate();
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const tabActive = (tab) => (activeTabProp || "overview") === tab;
  const [pendingFiles, setPendingFiles] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const uploadedRef = useRef([]);
  const ability = useFleetopsAbility();
  const canAssignDriver = ability.canAssignDriver;

  const {
    order,
    rawOrder,
    driver,
    vehicle,
    activities,
    mergeActivities,
    files,
    nextActivity,
    eta,
    loading,
    error,
    actionPending,
    refetch,
    runOrderTransition,
  } = useOrderDetail(id);

  const { liveEvents, syncState } = useOrderRealtime({
    rawOrder,
    enabled: Boolean(rawOrder),
    onRefetch: refetch,
  });

  const timelineEvents = mergeActivities(liveEvents);

  const { warnings } = useFleetopsWarnings({ driver, vehicle, order, rawOrder });

  const editDialog = useFleetopsFormDialog({
    formRef,
    suspendDrawer: embedded,
    successMessage: "Order updated",
    onSubmit: async (values) => {
      const fileUuids = [...(values.files || []), ...uploadedRef.current.map((f) => ({ uuid: f.id }))];
      const payload = { ...values, files: fileUuids.length ? fileUuids : undefined };
      await fleetopsService.updateOrder(id, payload);
      uploadedRef.current = [];
      setPendingFiles([]);
      await refetch();
    },
  });

  const handleWorkflowAction = useCallback(
    (action) =>
      runOrderTransition(action, {
        success: `${action.label} completed`,
        error: `${action.label} failed — reverted`,
      }),
    [runOrderTransition],
  );

  const handleUnassignDriver = useCallback(async () => {
    try {
      await fleetopsService.unassignDriverFromOrder(id);
      toast.success("Driver unassigned");
      await refetch();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    }
  }, [id, refetch]);

  const handleDeleteOrder = useCallback(async () => {
    try {
      await fleetopsService.deleteOrder(id);
      toast.success("Order deleted");
      navigate("/fleet-ops/operations/orders");
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    }
  }, [id, navigate]);

  const headerOpsActions = useMemo(() => {
    const items = [];
    if (canAssignDriver) {
      items.push({
        id: "assign-driver",
        label: driver ? "Change driver" : "Assign driver",
        testId: "order-assign-driver",
        onClick: () => setAssignOpen(true),
        icon: <UserPlus className="h-3.5 w-3.5 mr-1" />,
      });
      if (driver) {
        items.push({
          id: "unassign-driver",
          label: "Unassign driver",
          testId: "order-unassign-driver",
          onClick: handleUnassignDriver,
          disabled: actionPending,
          icon: <UserMinus className="h-3.5 w-3.5 mr-1" />,
        });
      }
    }
    items.push({
      id: "view-label",
      label: "View label",
      testId: "order-view-label",
      onClick: () => setLabelOpen(true),
      icon: <Tag className="h-3.5 w-3.5 mr-1" />,
    });
    if (ability.canUpdateOrder) {
      items.push({
        id: "schedule",
        label: "Schedule",
        testId: "order-schedule",
        onClick: () => setScheduleOpen(true),
        icon: <Calendar className="h-3.5 w-3.5 mr-1" />,
      });
    }
    if (ability.canDeleteOrder) {
      items.push({
        id: "delete",
        label: "Delete",
        testId: "order-delete",
        onClick: () => setDeleteOpen(true),
        icon: <Trash2 className="h-3.5 w-3.5 mr-1" />,
      });
    }
    return items;
  }, [canAssignDriver, driver, actionPending, handleUnassignDriver, ability.canUpdateOrder, ability.canDeleteOrder]);

  useFormDirtyBridge(formRef, editDialog.open, "order-edit");

  if (loading && !order) {
    return (
      <DetailLoadingState
        embedded={embedded}
        message="Loading order…"
        testId="order-detail-loader"
      />
    );
  }

  if (error && !order) {
    return (
      <div className="p-8" data-testid="order-detail-page">
        <EmptyState
          title="Could not load order"
          description={parseFleetopsApiError(error)}
          actionLabel="Back to orders"
          onAction={() => navigate("/fleet-ops/operations/orders")}
          testId="order-detail-error"
        />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-[#374151]">Order not found.</div>;
  }

  const editable = canEditOrder(order.status);
  const etaLabel =
    eta?.eta || eta?.estimated_arrival || order.eta || (eta ? JSON.stringify(eta) : "—");

  const workflowSection = (
    <OrderWorkflowPanel
      order={order}
      nextActivity={nextActivity}
      busy={actionPending}
      onExecute={handleWorkflowAction}
    />
  );

  const orderTabs = [
    {
      id: "overview",
      label: "Overview",
      testId: "order-tab-overview",
      content: (
        <div className="p-4 space-y-4">
          {workflowSection}
          <OrderOverviewSection
            order={order}
            rawOrder={rawOrder}
            driver={driver}
            vehicle={vehicle}
            etaLabel={etaLabel}
            loading={loading}
          />
        </div>
      ),
    },
    {
      id: "detail",
      label: "Detail",
      testId: "order-tab-detail",
      content: (
        <OrderOperationalDetailTab
          order={order}
          rawOrder={rawOrder}
          driver={driver}
          vehicle={vehicle}
        />
      ),
    },
    {
      id: "payload",
      label: "Payload",
      content: <OrderPayloadTab rawOrder={rawOrder} />,
    },
    {
      id: "tracking",
      label: "Live Tracking",
      content: (
        <OrderTrackingTab
          orderId={id}
          order={order}
          driver={driver}
          enabled={tabActive("tracking")}
        />
      ),
    },
    {
      id: "activity",
      label: "Activity",
      badge: timelineEvents.length,
      testId: "order-tab-activity",
      content: (
        <div className="p-4">
          <OrderActivityPanel events={timelineEvents} loading={loading} live />
        </div>
      ),
    },
    {
      id: "proofs",
      label: "Proofs",
      badge: files.length + pendingFiles.length,
      testId: "order-tab-documents",
      content: (
        <div className="p-4">
          <OrderDocumentsPanel
            files={files}
            pendingFiles={pendingFiles}
            editable={editable}
            onUploaded={(f) => {
              uploadedRef.current.push(f);
              setPendingFiles((p) => [...p, f]);
            }}
          />
        </div>
      ),
    },
    {
      id: "financials",
      label: "Financials",
      content: <OrderFinancialsTab order={order} rawOrder={rawOrder} />,
    },
    {
      id: "communication",
      label: "Communication",
      badge: timelineEvents.length,
      content: (
        <OrderCommunicationTab
          orderId={id}
          rawOrder={rawOrder}
          enabled={tabActive("communication")}
          activityEvents={timelineEvents}
        />
      ),
    },
    {
      id: "route",
      label: "Route Intelligence",
      content: (
        <OrderRouteEditor
          order={order}
          rawOrder={rawOrder}
          etaLabel={etaLabel}
          loading={loading}
          editable={editable && ability.canUpdateOrder}
          onSaved={refetch}
        />
      ),
    },
    {
      id: "notes",
      label: "Notes",
      content: (
        <OrderNotesTab
          order={order}
          rawOrder={rawOrder}
          editable={editable && ability.canUpdateOrder}
          onSaved={refetch}
        />
      ),
    },
    {
      id: "metadata",
      label: "Metadata",
      content: (
        <OrderMetadataTab
          rawOrder={rawOrder}
          editable={editable && ability.canUpdateOrder}
          onEdit={() => setMetadataOpen(true)}
        />
      ),
    },
    {
      id: "purchase-rate",
      label: "Purchase rate",
      content: <OrderPurchaseRateTab rawOrder={rawOrder} />,
    },
    {
      id: "vendor",
      label: "Integrated vendor",
      content: <OrderIntegratedVendorTab rawOrder={rawOrder} />,
    },
    {
      id: "custom-fields",
      label: "Custom fields",
      content: <OrderCustomFieldsTab rawOrder={rawOrder} />,
    },
    {
      id: "audit",
      label: "Audit & API",
      content: <OrderAuditTab orderId={id} enabled={tabActive("audit")} />,
    },
    ...getExtensionTabs("order").map((tab) => ({
      id: tab.id || tab.key,
      label: tab.label,
      testId: tab.testId || `order-tab-${tab.id || tab.key}`,
      content: tab.render?.({ rawOrder, order, orderId: id, embedded }) ?? null,
    })),
  ];

  const editDialogBlock = wrapDetailEditDialog(
    embedded,
    editDialog.open,
    <FleetOpsFormDialog
      detached={embedded}
      open={editDialog.open}
      onOpenChange={editDialog.setOpen}
      title="Edit order"
      description="Update assignments, route, notes, and operational fields."
      submitLabel="Save changes"
      busy={editDialog.busy}
      error={editDialog.error}
      onSubmit={editDialog.handleSubmit}
      testId="edit-order-dialog"
      size="xl"
    >
      {editDialog.open && rawOrder && (
        <OrderForm
          key={`order-edit-${id}`}
          ref={formRef}
          formId="order-edit-form"
          mode="edit"
          initialValues={orderValuesFromApi(rawOrder, { defaultConfigId: lookups.orderConfigs[0]?.id })}
          orderConfigOptions={lookups.orderConfigs}
          customerOptions={lookups.customers}
          facilitatorOptions={lookups.facilitators}
          driverOptions={lookups.drivers}
          vehicleOptions={lookups.vehicles}
          placeOptions={lookups.places}
        />
      )}
    </FleetOpsFormDialog>,
  );

  if (embedded) {
    return (
      <div data-testid="order-detail-page">
        <DetailDrawerHeader
          overline={`Order · ${order.trackingNumber}`}
          title={order.customer.name}
          publicId={order.publicId}
          status={order.status}
          statusLabel={statusLabel(order.status)}
          lastUpdated={order.updatedAt ? new Date(order.updatedAt).toLocaleString() : null}
          syncState={syncState}
          onEdit={editable ? (embedded ? editDialog.openEdit : () => editDialog.setOpen(true)) : undefined}
          editTestId="order-edit"
          actions={[
            ...headerOpsActions,
            {
              id: "refresh",
              label: "Refresh",
              testId: "order-refresh",
              onClick: () => refetch(),
              disabled: actionPending,
              icon: <RefreshCw className="h-3.5 w-3.5 mr-1" />,
            },
          ]}
        />
        <div className="px-4 pb-2">
          <HealthBanner warnings={warnings} testId="order-health-banner" />
        </div>
        <DetailDrawerTabs
          value={activeTabProp || "overview"}
          onValueChange={onTabChange}
          tabs={orderTabs}
        />
        <AssignDriverDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          orderId={id}
          order={order}
          initialDriverId={driver?.id || rawOrder?.driver_uuid}
          initialVehicleId={vehicle?.id || rawOrder?.vehicle_uuid}
          onAssigned={refetch}
        />
        <OrderLabelDialog
          open={labelOpen}
          onOpenChange={setLabelOpen}
          orderId={id}
          orderPublicId={order.publicId}
        />
        <OrderScheduleDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          orderId={id}
          driverId={driver?.id}
          onScheduled={refetch}
        />
        <OrderMetadataDialog
          open={metadataOpen}
          onOpenChange={setMetadataOpen}
          orderId={id}
          meta={rawOrder?.meta}
          onSaved={refetch}
        />
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent data-testid="order-delete-dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this order?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteOrder}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {editDialogBlock}
      </div>
    );
  }

  return (
    <div data-testid="order-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Orders", to: "/fleet-ops/operations/orders" },
          { label: order.publicId },
        ]}
        overline={`Order · ${order.trackingNumber}`}
        title={order.customer.name}
        description={
          <span className="flex items-center gap-2 text-sm flex-wrap">
            <StatusBadge status={order.status} label={statusLabel(order.status)} />
            <StatusBadge status={order.priority} label={`${order.priority} priority`} dot={false} />
          </span>
        }
        actions={
          <>
            {headerOpsActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                onClick={action.onClick}
                disabled={action.disabled}
                className="bg-transparent border-black/[0.08]"
                data-testid={action.testId}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={actionPending}
              className="bg-transparent border-black/[0.08]"
              data-testid="order-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08]">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {editable && (
              <Button
                onClick={() => editDialog.setOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="order-edit"
              >
                <Edit3 className="h-4 w-4 mr-1" /> Edit order
              </Button>
            )}
          </>
        }
      />

      <div className="px-6 pb-6 space-y-4">
        <HealthBanner warnings={warnings} testId="order-health-banner" />
        <DetailDrawerTabs
          defaultValue="overview"
          tabs={orderTabs}
        />
      </div>

      <AssignDriverDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        orderId={id}
        order={order}
        initialDriverId={driver?.id || rawOrder?.driver_uuid}
        initialVehicleId={vehicle?.id || rawOrder?.vehicle_uuid}
        onAssigned={refetch}
      />
      <OrderLabelDialog
        open={labelOpen}
        onOpenChange={setLabelOpen}
        orderId={id}
        orderPublicId={order.publicId}
      />
      <OrderScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        orderId={id}
        driverId={driver?.id}
        onScheduled={refetch}
      />
      <OrderMetadataDialog
        open={metadataOpen}
        onOpenChange={setMetadataOpen}
        orderId={id}
        meta={rawOrder?.meta}
        onSaved={refetch}
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-testid="order-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {editDialogBlock}
    </div>
  );
}
