import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Renders children when plan includes feature; otherwise upgrade prompt.
 */
export default function FeatureGate({ feature, children, fallback = null, showUpgrade = true }) {
  const { can, plan } = useSubscription();

  if (can(feature)) return children;

  if (fallback) return fallback;

  if (!showUpgrade) return null;

  return (
    <div
      className="rounded-md border border-dashed border-black/[0.12] bg-[#F9FAFB] p-8 text-center"
      data-testid={`feature-gate-${feature}`}
    >
      <p className="text-sm font-medium text-[#0A0E1A] mb-1">
        Available on higher plans
      </p>
      <p className="text-xs text-[#4B5563] mb-4">
        <span className="font-mono">{feature}</span> is not included in your {plan.name} plan.
      </p>
      <Button asChild size="sm" variant="outline" className="border-black/[0.08]">
        <Link to="/settings">View plans & billing</Link>
      </Button>
    </div>
  );
}
