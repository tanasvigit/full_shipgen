import { useNavigate } from "react-router-dom";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import OrderForm from "@/components/fleetops/forms/OrderForm";
import { useFleetopsFormDialog, useFormRef } from "@/components/fleetops/useFleetopsFormDialog";
import { useFleetopsLookups } from "@/hooks/fleetops/useFleetopsLookups";
import { fleetopsService } from "@/services/fleetops";

/**
 * Centered create-order modal — same FleetOpsFormDialog pattern as drivers/vehicles/fleets.
 */
export default function OrderCreateDialog({ open, onOpenChange, onCreated }) {
  const navigate = useNavigate();
  const formRef = useFormRef();
  const lookups = useFleetopsLookups();
  const defaultConfigId = lookups.orderConfigs[0]?.id || "";

  const dialog = useFleetopsFormDialog({
    formRef,
    open,
    onOpenChange,
    successMessage: "Order created",
    onSubmit: async (values) => {
      const config = lookups.orderConfigs.find((c) => c.id === values.orderConfigId);
      return fleetopsService.createOrder(values, {
        orderConfigKey: config?.label?.toLowerCase?.().replace(/\s+/g, "_"),
      });
    },
    onSuccess: (created) => {
      const id = created?.id || created?.uuid || created?.public_id;
      onCreated?.(created, id);
      if (id) navigate(`/fleet-ops/operations/orders?order=${encodeURIComponent(id)}`);
      else navigate("/fleet-ops/operations/orders");
    },
  });

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Order"
      description="Full order payload aligned with internal CreateOrderRequest (order_config, payload, assignments, POD)."
      submitLabel="Create order"
      busyLabel="Creating…"
      busy={dialog.busy}
      submitDisabled={lookups.loading || lookups.orderConfigs.length === 0}
      error={dialog.error}
      onSubmit={dialog.handleSubmit}
      testId="new-order"
      size="xl"
    >
      {lookups.loading ? (
        <div className="text-sm text-[#4B5563]">Loading order types, places, and assignments…</div>
      ) : lookups.orderConfigs.length === 0 ? (
        <div
          className="text-sm text-amber-800 bg-amber-500/10 border border-amber-500/30 rounded-md px-4 py-3"
          data-testid="order-config-missing"
        >
          No order configs found. Create a default order config in FleetOps settings before creating orders.
        </div>
      ) : (
        <OrderForm
          ref={formRef}
          formId="order-new-form"
          mode="create"
          initialValues={{ orderConfigId: defaultConfigId }}
          orderConfigOptions={lookups.orderConfigs}
          customerOptions={lookups.customers}
          facilitatorOptions={lookups.facilitators}
          driverOptions={lookups.drivers}
          vehicleOptions={lookups.vehicles}
          placeOptions={lookups.places}
        />
      )}
    </FleetOpsFormDialog>
  );
}
