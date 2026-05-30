import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RiskAlertsBar({ risks, onSelectOrder, testId = "risk-alerts-bar" }) {
  if (!risks?.topAlerts?.length) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-amber-500/[0.06] border border-amber-500/25 rounded-lg"
      data-testid={testId}
    >
      <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
      <span className="text-xs font-mono text-amber-900">
        <strong>{risks.dangerCount}</strong> critical · <strong>{risks.warningCount}</strong> warnings
      </span>
      <div className="flex flex-wrap gap-1.5 ml-auto">
        {risks.topAlerts.slice(0, 4).map((a) => (
          <Button
            key={`${a.orderId}-${a.code}`}
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px] font-mono bg-white border-amber-500/30"
            onClick={() => onSelectOrder?.(a.orderId)}
            data-testid={`risk-alert-${a.orderId}`}
          >
            {a.publicId}: {a.message.slice(0, 36)}
            {a.message.length > 36 ? "…" : ""}
          </Button>
        ))}
      </div>
    </div>
  );
}
