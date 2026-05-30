import PageHeader from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/contexts/PlatformContext";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { PLANS } from "@/lib/subscription/plans";
import { RefreshCw } from "lucide-react";

function StatusDot({ ok }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`}
      aria-hidden
    />
  );
}

export default function PlatformHealth() {
  const { health, healthLoading, refreshHealth, configIssues, configSummary, online } = usePlatform();
  const { isDemoMode, setDemoMode } = useDemoMode();

  return (
    <div data-testid="platform-health-page">
      <PageHeader
        overline="Admin"
        title="Platform health"
        description="API, websocket, and runtime diagnostics for operations."
        actions={
          <Button
            size="sm"
            variant="outline"
            className="border-black/[0.08]"
            disabled={healthLoading}
            onClick={() => void refreshHealth()}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${healthLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />
      <div className="p-6 max-w-4xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-black/[0.08] rounded-md p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <StatusDot ok={online} /> Browser
            </div>
            <p className="text-xs text-[#4B5563]">{online ? "Online" : "Offline"}</p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-md p-4" data-testid="health-api">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <StatusDot ok={health?.api?.ok} /> REST API
            </div>
            <p className="text-xs text-[#4B5563]">
              {health?.api?.ok
                ? `${health.api.latencyMs}ms — ${health.api.url}`
                : health?.api?.error || "Checking…"}
            </p>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-md p-4" data-testid="health-websocket">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <StatusDot ok={health?.websocket?.ok} /> WebSocket
            </div>
            <p className="text-xs text-[#4B5563]">State: {health?.websocket?.state || "unknown"}</p>
          </div>
        </div>

        {configIssues.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <div className="text-sm font-medium text-amber-900 mb-2">Configuration warnings</div>
            <ul className="text-xs text-amber-800 space-y-1">
              {configIssues.map((i) => (
                <li key={i.key}>{i.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-3">Runtime</div>
          <dl className="grid grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(configSummary).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-[#6B7280]">{k}</dt>
                <dd className="text-[#1F2937] truncate">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-3">Sales & demo</div>
          <p className="text-sm text-[#4B5563] mb-3">
            Demo mode loads seeded orders, drivers, and simulated map movement without API writes.
          </p>
          <Button
            size="sm"
            variant={isDemoMode ? "secondary" : "default"}
            className={!isDemoMode ? "bg-violet-600 hover:bg-violet-700" : ""}
            onClick={() => setDemoMode(!isDemoMode)}
            data-testid="toggle-demo-mode"
          >
            {isDemoMode ? "Disable demo mode" : "Enable demo mode"}
          </Button>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-3">Subscription plans (preview)</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.values(PLANS).map((p) => (
              <div key={p.id} className="border border-black/[0.06] rounded p-3">
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-[#6B7280]">{p.priceLabel}</div>
                <div className="text-xs mt-2 text-[#374151]">{p.seats} seats</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
