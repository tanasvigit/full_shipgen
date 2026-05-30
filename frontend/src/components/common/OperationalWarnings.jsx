import { AlertTriangle, Info } from "lucide-react";

export default function OperationalWarnings({ warnings = [], testId = "operational-warnings" }) {
  if (!warnings.length) return null;

  return (
    <div className="space-y-2" data-testid={testId}>
      {warnings.map((w) => (
        <div
          key={w.id}
          className={`flex items-start gap-2 text-sm rounded-md px-3 py-2 border ${
            w.level === "danger" || w.level === "blocking"
              ? "bg-red-500/5 border-red-500/25 text-[#B91C1C]"
              : w.level === "warning"
                ? "bg-amber-500/5 border-amber-500/30 text-[#92400E]"
                : "bg-blue-500/5 border-blue-500/20 text-[#1E40AF]"
          }`}
          data-testid={`${testId}-${w.id}`}
        >
          {w.level === "danger" || w.level === "warning" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{w.message}</span>
        </div>
      ))}
    </div>
  );
}
