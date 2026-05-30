import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Truck, Send, Ban, Trash2, X, Route } from "lucide-react";
import BulkAssignDriverDialog from "../modals/BulkAssignDriverDialog";

export default function OrdersBulkToolbar({
  selectedCount,
  onClearSelection,
  onBulkDispatch,
  onBulkCancel,
  onBulkDelete,
  onBulkAssign,
  onPlanRoutes,
  canPlanRoutes = false,
  canDispatch = true,
  canCancel = true,
  canDelete = true,
  canAssign = true,
  busy = false,
}) {
  const [confirm, setConfirm] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);

  if (selectedCount < 1) return null;

  const runConfirm = async () => {
    const action = confirm?.action;
    setConfirm(null);
    if (action === "dispatch") await onBulkDispatch?.();
    if (action === "cancel") await onBulkCancel?.();
    if (action === "delete") await onBulkDelete?.();
  };

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#EEF0F4] border border-black/[0.08] rounded-lg"
        data-testid="orders-bulk-toolbar"
      >
        <span className="text-xs font-mono text-[#374151] mr-1">
          <span className="text-[#0A0E1A] font-semibold">{selectedCount}</span> selected
        </span>
        {canDispatch && (
          <Button
            size="sm"
            className="h-8 bg-[#0066FF] hover:bg-[#0040CC]"
            disabled={busy}
            data-testid="orders-bulk-dispatch"
            onClick={() => setConfirm({ action: "dispatch", title: "Dispatch selected orders?", body: `Dispatch ${selectedCount} order(s)?` })}
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Dispatch
          </Button>
        )}
        {canAssign && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-white"
            disabled={busy}
            data-testid="orders-bulk-assign"
            onClick={() => setAssignOpen(true)}
          >
            <Truck className="h-3.5 w-3.5 mr-1" /> Assign driver
          </Button>
        )}
        {canPlanRoutes && onPlanRoutes && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 bg-white"
            disabled={busy}
            data-testid="orders-plan-routes"
            onClick={onPlanRoutes}
          >
            <Route className="h-3.5 w-3.5 mr-1" /> Plan routes
          </Button>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-red-500/30 text-[#B91C1C] hover:bg-red-500/5"
            disabled={busy}
            data-testid="orders-bulk-cancel"
            onClick={() => setConfirm({ action: "cancel", title: "Cancel selected orders?", body: `Cancel ${selectedCount} order(s)? This cannot be undone.` })}
          >
            <Ban className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
        )}
        {canDelete && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-red-500/30 text-[#B91C1C] hover:bg-red-500/5"
            disabled={busy}
            data-testid="orders-bulk-delete"
            onClick={() => setConfirm({ action: "delete", title: "Delete selected orders?", body: `Permanently delete ${selectedCount} order(s)?` })}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 ml-auto"
          disabled={busy}
          data-testid="orders-bulk-clear"
          onClick={onClearSelection}
        >
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      </div>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent data-testid="orders-bulk-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              className={confirm?.action === "delete" || confirm?.action === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-[#0066FF] hover:bg-[#0040CC]"}
              onClick={(e) => {
                e.preventDefault();
                runConfirm();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkAssignDriverDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        orderCount={selectedCount}
        onAssign={async (driverId) => {
          await onBulkAssign?.(driverId);
          setAssignOpen(false);
        }}
      />
    </>
  );
}
