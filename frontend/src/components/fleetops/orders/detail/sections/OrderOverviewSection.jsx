import OrderRoutePanel from "../panels/OrderRoutePanel";
import OrderAssignmentsPanel from "../assignments/OrderAssignmentsPanel";
import CollapsibleSection from "../CollapsibleSection";

export default function OrderOverviewSection({
  order,
  rawOrder,
  driver,
  vehicle,
  etaLabel,
  loading,
}) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <OrderRoutePanel order={order} etaLabel={etaLabel} loading={loading} />
      <aside className="space-y-4">
        <CollapsibleSection title="Customer" testId="order-customer">
          <div className="font-display font-semibold">{order.customer.name}</div>
          <div className="mt-2 text-sm text-[#374151]">{order.customer.email || "—"}</div>
          <div className="text-sm text-[#374151]">{order.customer.phone || "—"}</div>
        </CollapsibleSection>
        <OrderAssignmentsPanel driver={driver} vehicle={vehicle} />
        <CollapsibleSection title="Notes" testId="order-notes">
          <p className="text-sm text-[#374151] whitespace-pre-wrap">
            {order.notes || rawOrder?.dispatch_notes || "—"}
          </p>
          {rawOrder?.instructions && (
            <p className="text-sm text-[#374151] mt-2 whitespace-pre-wrap border-t border-black/[0.06] pt-2">
              <span className="font-mono text-[10px] uppercase text-[#6B7280] block mb-1">
                Instructions
              </span>
              {rawOrder.instructions}
            </p>
          )}
        </CollapsibleSection>
        <CollapsibleSection title="Order" testId="order-meta" defaultOpen={false}>
          <div className="text-xs font-mono text-[#374151]">{order.publicId}</div>
          <div className="font-mono text-sm mt-2">${Number(order.total || 0).toFixed(2)}</div>
        </CollapsibleSection>
      </aside>
    </div>
  );
}
