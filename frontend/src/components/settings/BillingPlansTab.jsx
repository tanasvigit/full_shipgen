import { PLANS } from "@/lib/subscription/plans";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";

export default function BillingPlansTab() {
  const { plan } = useTenant();

  return (
    <div className="space-y-4" data-testid="settings-billing">
      <p className="text-sm text-[#4B5563]">
        Current plan: <strong>{plan.name}</strong> ({plan.priceLabel}). Stripe integration is not
        connected yet — upgrades are stored locally for demo and QA.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(PLANS).map((p) => {
          const active = p.id === plan.id;
          return (
            <div
              key={p.id}
              className={`rounded-md border p-5 ${active ? "border-blue-500 bg-blue-50/50" : "border-black/[0.08] bg-white"}`}
            >
              <div className="font-semibold text-[#0A0E1A]">{p.name}</div>
              <div className="text-lg font-mono mt-1">{p.priceLabel}</div>
              <ul className="mt-4 space-y-1.5 text-xs text-[#374151]">
                <li>{p.seats} team seats</li>
                <li>{p.limits.ordersPerMonth === Infinity ? "Unlimited" : p.limits.ordersPerMonth} orders/mo</li>
                {Object.entries(p.features)
                  .filter(([, v]) => v)
                  .slice(0, 5)
                  .map(([k]) => (
                    <li key={k} className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-emerald-600" />
                      {k.replace(/([A-Z])/g, " $1")}
                    </li>
                  ))}
              </ul>
              <Button
                size="sm"
                className="w-full mt-4"
                variant={active ? "secondary" : "default"}
                disabled={active}
                onClick={() => toast.info(`Plan change to ${p.name} — connect Stripe in production`)}
              >
                {active ? "Current plan" : "Select plan"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
