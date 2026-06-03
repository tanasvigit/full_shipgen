import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/loaders/indicators/LoadingButton";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { toast } from "sonner";

const STEPS = [
  { key: "createdb", label: "Create Database", action: () => authService.installerCreateDb() },
  { key: "migrate", label: "Run Migrations", action: () => authService.installerMigrate() },
  { key: "seed", label: "Seed Database", action: () => authService.installerSeed() },
];

function stepClass(status) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "running") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  return "border-black/[0.08] bg-[#F5F6F8] text-[#4B5563]";
}

export default function Installer() {
  const navigate = useNavigate();
  const { refreshInstallStatus } = useAuth();
  const [steps, setSteps] = useState(() =>
    STEPS.map((step) => ({ key: step.key, label: step.label, status: "pending", message: "" })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const allCompleted = useMemo(() => steps.every((step) => step.status === "completed"), [steps]);

  const updateStep = (key, patch) => {
    setSteps((prev) => prev.map((step) => (step.key === key ? { ...step, ...patch } : step)));
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      for (const step of STEPS) {
        const current = steps.find((s) => s.key === step.key);
        if (current?.status === "completed") continue;

        updateStep(step.key, { status: "running", message: "" });
        try {
          const response = await step.action();
          const status = String(response?.status || "").toLowerCase();
          if (status && status !== "success" && status !== "ok") {
            throw new Error(response?.error || `Installer step ${step.key} failed.`);
          }
          updateStep(step.key, { status: "completed", message: "" });
        } catch (err) {
          const message = err?.friendlyMessage || err?.message || `Failed at ${step.label}.`;
          updateStep(step.key, { status: "failed", message });
          setError(message);
          toast.error(message);
          return;
        }
      }

      const status = await refreshInstallStatus();
      if (status?.shouldInstall) {
        const message = "Installer completed but setup is still reported as incomplete. Please retry.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success("Installation completed successfully.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="installer-page">
      <div>
        <div className="overline mb-3">Environment setup</div>
        <h2 className="font-display text-[36px] font-black tracking-[-0.045em] leading-[1] text-[#0A0E1A]">
          Initialize Fleetbase
          <br />
          before onboarding.
        </h2>
        <p className="text-sm text-[#374151] mt-3 max-w-sm">
          Run database setup steps in order: create database, migrate schema, and seed defaults.
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.key}
            className={`rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${stepClass(step.status)}`}
            data-testid={`installer-step-${step.key}`}
          >
            <div>
              <div className="font-semibold">{step.label}</div>
              {step.message ? <div className="text-xs mt-1">{step.message}</div> : null}
            </div>
            <div className="font-mono text-xs uppercase">{step.status}</div>
          </div>
        ))}
      </div>

      {error ? (
        <div className="text-xs text-[#DC2626] bg-[#DC2626]/[0.06] border border-[#DC2626]/20 rounded-lg px-3.5 py-2.5" data-testid="installer-error">
          {error}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <LoadingButton
          type="button"
          loading={busy}
          loadingText="Installing…"
          onClick={run}
          className="bg-[#0066FF] hover:bg-[#0040CC] text-white"
          data-testid="installer-start"
        >
          {steps.some((s) => s.status === "failed") ? "Retry install" : "Start install"}
        </LoadingButton>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/auth/onboard")}
          disabled={!allCompleted}
          data-testid="installer-continue-onboard"
        >
          Continue to onboarding
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/auth")}
          disabled={!allCompleted}
          data-testid="installer-continue-login"
        >
          Go to login
        </Button>
      </div>
    </div>
  );
}

