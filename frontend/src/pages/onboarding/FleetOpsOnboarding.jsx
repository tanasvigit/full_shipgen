import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { useTenant } from "@/contexts/TenantContext";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { CheckCircle2, Truck, Users, Settings2, Package, UserPlus, Sparkles } from "lucide-react";

const WIZARD_STEPS = [
  {
    id: "welcome",
    title: "Welcome to FleetOps",
    body: "Your dispatcher command center for last-mile and freight logistics.",
    icon: Sparkles,
    action: null,
  },
  {
    id: "driver",
    title: "Add drivers",
    body: "Register drivers who will receive assignments and share live location.",
    icon: Users,
    href: "/fleet-ops/management/drivers",
    stepKey: "driver",
  },
  {
    id: "vehicle",
    title: "Add vehicles",
    body: "Link plates and capacity to drivers for dispatch.",
    icon: Truck,
    href: "/fleet-ops/management/vehicles",
    stepKey: "vehicle",
  },
  {
    id: "orderConfig",
    title: "Order workflow",
    body: "Define statuses and transitions that match your operation.",
    icon: Settings2,
    href: "/fleet-ops/operations/order-config",
    stepKey: "orderConfig",
  },
  {
    id: "order",
    title: "First order",
    body: "Create an order or explore with demo data.",
    icon: Package,
    href: "/fleet-ops/operations/orders",
    stepKey: "order",
  },
  {
    id: "invite",
    title: "Invite your team",
    body: "Add dispatchers and managers with the right permissions.",
    icon: UserPlus,
    href: "/iam/users",
    stepKey: "invite",
  },
];

export default function FleetOpsOnboarding() {
  const navigate = useNavigate();
  const { onboarding, markOnboardingStep, completeOnboarding } = useTenant();
  const { setDemoMode } = useDemoMode();

  const currentIndex = WIZARD_STEPS.findIndex((s) => s.stepKey && !onboarding.steps?.[s.stepKey]);
  const active = currentIndex === -1 ? WIZARD_STEPS.length - 1 : Math.max(0, currentIndex);

  const step = WIZARD_STEPS[active];

  const markCurrent = () => {
    if (step.stepKey) markOnboardingStep(step.stepKey, true);
  };

  const finish = () => {
    completeOnboarding();
    navigate("/fleet-ops/operations/orders");
  };

  return (
    <div className="min-h-full" data-testid="fleetops-onboarding">
      <PageHeader
        overline="Onboarding"
        title="Set up your logistics workspace"
        description="Complete these steps to go live with FleetOps."
      />
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {WIZARD_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
                i === active ? "bg-blue-600 text-white" : onboarding.steps?.[s.stepKey] ? "bg-emerald-100 text-emerald-800" : "bg-[#F1F2F5] text-[#374151]"
              }`}
            >
              {s.title}
            </div>
          ))}
        </div>

        <div className="bg-white border border-black/[0.08] rounded-lg p-8">
          <step.icon className="h-10 w-10 text-blue-600 mb-4" />
          <h2 className="text-xl font-semibold text-[#0A0E1A] mb-2">{step.title}</h2>
          <p className="text-sm text-[#4B5563] mb-6">{step.body}</p>

          {step.id === "welcome" && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant="outline"
                className="border-black/[0.08]"
                onClick={() => {
                  setDemoMode(true);
                  markOnboardingStep("order", true);
                  navigate("/fleet-ops/operations/orders");
                }}
                data-testid="onboarding-load-demo"
              >
                Explore with demo data
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {step.href ? (
              <Button asChild className="bg-blue-600 hover:bg-blue-700" onClick={markCurrent}>
                <Link to={step.href}>Open {step.title}</Link>
              </Button>
            ) : (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => markOnboardingStep("welcome", true)}>
                Continue
              </Button>
            )}
            {step.stepKey && (
              <Button variant="outline" className="border-black/[0.08]" onClick={markCurrent}>
                Mark complete
              </Button>
            )}
            {active === WIZARD_STEPS.length - 1 ? (
              <Button variant="secondary" onClick={finish}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Finish setup
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => step.stepKey && markOnboardingStep(step.stepKey, true)}>
                Skip for now
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-[#9CA3AF] mt-4 text-center">
          You can return anytime via the checklist on your dashboard or orders view.
        </p>
      </div>
    </div>
  );
}
