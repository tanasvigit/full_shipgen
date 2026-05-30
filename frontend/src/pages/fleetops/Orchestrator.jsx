import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";

export default function Orchestrator() {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const runPreview = async () => {
    setBusy(true);
    try {
      const data = await fleetopsService.runOrchestratorPreview({ mode: "assign_drivers" });
      setPreview(data);
      toast.success("Preview ready");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Orchestrator preview unavailable");
    } finally {
      setBusy(false);
    }
  };

  const runCommit = async () => {
    setBusy(true);
    try {
      await fleetopsService.runOrchestratorCommit({ mode: "assign_drivers" });
      toast.success("Orchestrator committed");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Commit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="orchestrator-page">
      <PageHeader
        breadcrumbs={[{ label: "FleetOps", to: "/fleet-ops" }, { label: "Orchestrator" }]}
        title="Orchestrator"
        description="Auto-assign drivers to unassigned orders (MVP)"
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={runPreview} data-testid="orchestrator-preview">
            Preview
          </Button>
          <Button disabled={busy} onClick={runCommit} data-testid="orchestrator-commit">
            Commit
          </Button>
        </div>
        {preview && (
          <pre className="text-xs bg-[#F5F6F8] p-4 rounded overflow-auto max-h-96">{JSON.stringify(preview, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
