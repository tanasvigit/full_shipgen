import { useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function ResetCustomerCredentialsDialog({ open, onOpenChange, customerId, customerName }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await fleetopsService.resetCustomerCredentials(customerId);
      toast.success(`Credentials reset for ${customerName || "customer"}`);
      onOpenChange(false);
    } catch (err) {
      setError(err?.friendlyMessage || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reset customer credentials"
      description={`Send new login credentials to ${customerName || "this customer"}?`}
      submitLabel="Reset credentials"
      busy={busy}
      error={error}
      onSubmit={submit}
      testId="reset-customer-credentials-dialog"
    >
      <p className="text-sm text-[#374151]">
        This triggers the backend reset-credentials flow. The customer will receive updated portal access.
      </p>
    </FleetOpsFormDialog>
  );
}
