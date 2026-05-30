import OrderWorkflowActions from "@/components/fleetops/orders/OrderWorkflowActions";

export default function OrderWorkflowPanel({ order, nextActivity, busy, onExecute }) {
  return (
    <div
      className="bg-white border border-black/[0.08] rounded-md p-4 sticky top-0 z-20"
      data-testid="order-workflow-panel"
    >
      <div className="overline mb-3">Workflow</div>
      <OrderWorkflowActions
        order={order}
        nextActivity={nextActivity}
        busy={busy}
        onExecute={onExecute}
      />
    </div>
  );
}
