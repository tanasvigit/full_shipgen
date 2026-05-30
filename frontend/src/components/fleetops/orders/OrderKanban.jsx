import { useState } from "react";
import StatusBadge from "@/components/common/StatusBadge";
import { fleetopsService } from "@/services/fleetops";
import { statusLabel } from "@/lib/mappers";
import { normalizeStatus } from "@/domain/fleetops/status";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";
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

export default function OrderKanban({
  orders,
  statuses,
  onOpenDetail,
  onOrdersChange,
  testId = "orders-kanban",
}) {
  const [dragOrderId, setDragOrderId] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);
  const [busy, setBusy] = useState(false);

  const columns = statuses?.length ? statuses : ["created", "dispatched", "en_route", "delivered", "canceled"];

  const handleDrop = async (orderId, targetStatus) => {
    setPendingMove(null);
    setBusy(true);
    try {
      const next = await fleetopsService.getNextActivity(orderId);
      const nextCode = next?.code || next?.activity?.code;
      if (!nextCode) {
        toast.error("No next workflow step available for this order.");
        return;
      }
      await fleetopsService.updateOrderActivity(orderId, nextCode);
      toast.success(`Advanced to ${statusLabel(targetStatus)}`);
      await onOrdersChange?.();
    } catch (err) {
      toast.error(parseFleetopsApiError(err));
    } finally {
      setBusy(false);
      setDragOrderId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4" data-testid={testId}>
        {columns.map((status) => (
          <div
            key={status}
            className="bg-white border border-black/[0.08] rounded-md min-h-[280px] flex flex-col"
            data-testid={`kanban-column-${status}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const orderId = e.dataTransfer.getData("text/order-id") || dragOrderId;
              if (!orderId) return;
              const order = orders.find((o) => o.id === orderId);
              if (!order || normalizeStatus(order.status) === normalizeStatus(status)) return;
              setPendingMove({ orderId, targetStatus, fromStatus: order.status });
            }}
          >
            <div className="px-3 py-2.5 border-b border-black/[0.08] flex items-center justify-between">
              <StatusBadge status={status} label={statusLabel(status)} />
              <span className="text-[10px] font-mono text-[#4B5563]">
                {orders.filter((o) => normalizeStatus(o.status) === normalizeStatus(status)).length}
              </span>
            </div>
            <div className="p-2 space-y-2 flex-1">
              {orders
                .filter((o) => normalizeStatus(o.status) === normalizeStatus(status))
                .map((order) => (
                  <div
                    key={order.id}
                    draggable={!busy}
                    onDragStart={(e) => {
                      setDragOrderId(order.id);
                      e.dataTransfer.setData("text/order-id", order.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragOrderId(null)}
                    className={`w-full text-left bg-[#F1F2F5]/60 border border-black/[0.08] rounded-sm p-3 hover:bg-[#F1F2F5] cursor-grab active:cursor-grabbing ${
                      dragOrderId === order.id ? "opacity-50" : ""
                    }`}
                    data-testid={`kanban-card-${order.id}`}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => onOpenDetail?.(order.id)}
                    >
                      <div className="font-mono text-[10px] text-[#0066FF]">{order.publicId}</div>
                      <div className="text-sm font-medium text-[#0A0E1A] truncate">{order.customer.name}</div>
                      <div className="text-[10px] text-[#4B5563] mt-1 truncate">
                        {order.pickup.name} → {order.dropoff.name}
                      </div>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={Boolean(pendingMove)} onOpenChange={(open) => !open && setPendingMove(null)}>
        <AlertDialogContent data-testid="kanban-move-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Advance workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              Move this order toward <strong>{statusLabel(pendingMove?.targetStatus)}</strong> by executing the
              next activity in the order flow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#0066FF] hover:bg-[#0040CC]"
              onClick={(e) => {
                e.preventDefault();
                if (pendingMove) handleDrop(pendingMove.orderId, pendingMove.targetStatus);
              }}
            >
              Advance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
