import { useState } from "react";
import LoadingButton from "@/components/loaders/indicators/LoadingButton";
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
import { getAvailableOrderActions, isTerminalStatus } from "@/lib/fleetops/orderWorkflow";

export default function OrderWorkflowActions({
  order,
  nextActivity,
  busy,
  onExecute,
  testId = "order-workflow-actions",
}) {
  const [confirm, setConfirm] = useState(null);
  const [executing, setExecuting] = useState(false);

  if (!order) return null;

  const hasNext = Boolean(nextActivity?.code || nextActivity?.activity?.code);
  const actions = getAvailableOrderActions(order.status, { hasNextActivity: hasNext });

  if (isTerminalStatus(order.status) && !actions.length) {
    return (
      <p className="text-xs text-[#4B5563] font-mono" data-testid={`${testId}-terminal`}>
        Order is in a terminal state.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2" data-testid={testId}>
        {actions.map((action) => (
          <LoadingButton
            key={action.id}
            loading={busy || executing}
            variant={action.destructive ? "outline" : "default"}
            className={
              action.destructive
                ? "border-red-500/40 text-[#B91C1C] hover:bg-red-500/10"
                : "bg-[#0066FF] hover:bg-[#0040CC]"
            }
            data-testid={`order-action-${action.id}`}
            onClick={() => setConfirm(action)}
          >
            {action.label}
          </LoadingButton>
        ))}
      </div>

      <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent data-testid="order-action-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="order-action-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirm?.destructive ? "bg-red-600 hover:bg-red-700" : "bg-[#0066FF] hover:bg-[#0040CC]"}
              data-testid="order-action-confirm-accept"
              onClick={async (e) => {
                e.preventDefault();
                const action = confirm;
                setConfirm(null);
                setExecuting(true);
                try {
                  await onExecute?.(action);
                } finally {
                  setExecuting(false);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
