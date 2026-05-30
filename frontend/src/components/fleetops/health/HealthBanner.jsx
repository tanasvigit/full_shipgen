import OperationalWarnings from "@/components/common/OperationalWarnings";
import { ShieldAlert } from "lucide-react";

/**
 * Compliance + operational health surface for entity detail pages.
 */
export default function HealthBanner({ issues = [], warnings = [], testId = "health-banner" }) {
  const combined = [
    ...issues.map((i) => ({
      id: i.id,
      level: i.level === "blocking" ? "danger" : i.level,
      message: i.remediation ? `${i.message} ${i.remediation}` : i.message,
    })),
    ...warnings,
  ];

  if (!combined.length) return null;

  const blocking = combined.some((w) => w.level === "blocking" || w.level === "danger");

  return (
    <div
      className={`rounded-md border px-4 py-3 ${
        blocking ? "border-red-500/30 bg-red-500/5" : "border-amber-500/25 bg-amber-500/5"
      }`}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 mb-2">
        <ShieldAlert className={`h-4 w-4 ${blocking ? "text-red-600" : "text-amber-600"}`} />
        <span className="overline">Operational health</span>
      </div>
      <OperationalWarnings warnings={combined} testId={`${testId}-list`} />
    </div>
  );
}
