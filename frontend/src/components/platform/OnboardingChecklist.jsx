import { Link } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, X } from "lucide-react";
import { useState } from "react";

const STEPS = [
  { id: "driver", label: "Add your first driver", href: "/fleet-ops/management/drivers" },
  { id: "vehicle", label: "Register a vehicle", href: "/fleet-ops/management/vehicles" },
  { id: "orderConfig", label: "Configure order workflow", href: "/fleet-ops/operations/order-config" },
  { id: "order", label: "Create or import an order", href: "/fleet-ops/operations/orders" },
  { id: "invite", label: "Invite a dispatcher", href: "/iam/users" },
];

export default function OnboardingChecklist() {
  const { onboarding, markOnboardingStep, completeOnboarding } = useTenant();
  const [dismissed, setDismissed] = useState(false);

  if (onboarding.completed || dismissed) return null;

  const doneCount = STEPS.filter((s) => onboarding.steps?.[s.id]).length;
  const progress = Math.round((doneCount / STEPS.length) * 100);

  return (
    <aside
      className="fixed bottom-6 right-6 z-[90] w-80 bg-white border border-black/[0.08] rounded-lg shadow-lg p-4"
      data-testid="onboarding-checklist"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#374151]">Getting started</div>
          <div className="text-sm font-semibold text-[#0A0E1A]">{progress}% complete</div>
        </div>
        <button
          type="button"
          className="text-[#9CA3AF] hover:text-[#374151]"
          aria-label="Dismiss checklist"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-1.5 bg-[#F1F2F5] rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <ul className="space-y-2 mb-4">
        {STEPS.map((step) => {
          const done = Boolean(onboarding.steps?.[step.id]);
          return (
            <li key={step.id} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-[#D1D5DB] shrink-0" />
              )}
              <Link
                to={step.href}
                className={done ? "text-[#9CA3AF] line-through" : "text-[#1F2937] hover:text-blue-600"}
                onClick={() => !done && markOnboardingStep(step.id, true)}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1 border-black/[0.08]">
          <Link to="/onboarding">Setup wizard</Link>
        </Button>
        {doneCount >= 3 && (
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={completeOnboarding}>
            Finish
          </Button>
        )}
      </div>
    </aside>
  );
}
