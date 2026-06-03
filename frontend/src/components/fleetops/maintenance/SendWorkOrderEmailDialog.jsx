import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";

export default function SendWorkOrderEmailDialog({ workOrderId, trigger }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const { can } = useFleetopsPermission();
  const canSend = can("update", "work-order") || can("update", "work_order");

  if (!canSend) return null;

  const send = async () => {
    setBusy(true);
    try {
      await fleetopsService.sendWorkOrderEmail(workOrderId, { email: email || undefined });
      toast.success("Work order email sent");
      setOpen(false);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Send failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {trigger ? (
        trigger({ onClick: () => setOpen(true) })
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} data-testid="work-order-send-email">
          <Mail className="h-3.5 w-3.5 mr-1" /> Send email
        </Button>
      )}
      <FleetOpsFormDialog
        open={open}
        onOpenChange={setOpen}
        title="Send work order"
        description="Email this work order to a technician or vendor."
        submitLabel="Send"
        busy={busy}
        onSubmit={send}
        testId="send-work-order-dialog"
      >
        <div className="space-y-2">
          <Label>Recipient email (optional — uses default if empty)</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="work-order-send-email-input" />
        </div>
      </FleetOpsFormDialog>
    </>
  );
}
