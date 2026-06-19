import React from "react";
import { CheckCircle2, XCircle, Circle, Info } from "lucide-react";

const RESOURCE_LABELS = {
  dock: "Dock",
  labor: "Labor",
  equipment: "Equipment",
};

const MandatoryRow = ({ ok, label }) => (
  <div className={`flex items-center gap-2 text-[12px] ${ok ? "text-emerald-700" : "text-red-700"}`}>
    {ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
    <span>{ok ? `✓ ${label}` : label}</span>
  </div>
);

const OptionalEquipmentRow = ({ assigned }) => (
  <div
    className={`flex items-center gap-2 text-[12px] ${
      assigned ? "text-emerald-700" : "text-slate-600"
    }`}
  >
    {assigned ? (
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
    ) : (
      <Circle className="w-3.5 h-3.5 shrink-0 text-slate-400" />
    )}
    <span>
      {assigned ? "✓ Equipment Assigned" : "○ Equipment Assigned (Optional)"}
    </span>
  </div>
);

/**
 * @param {object} props
 * @param {{ ready?: boolean, missing?: string[], dockAssigned?: boolean, laborAssigned?: boolean, equipmentAssigned?: boolean, equipmentRecommended?: boolean }} props.readiness
 * @param {boolean} [props.compact]
 */
export const ResourceReadinessPanel = ({ readiness, compact = false }) => {
  if (!readiness) return null;

  const missing = (readiness.missing || []).filter((k) => k !== "equipment");
  const dockOk = readiness.dockAssigned && !missing.includes("dock");
  const laborOk = readiness.laborAssigned && !missing.includes("labor");
  const equipAssigned = readiness.equipmentAssigned;
  const showEquipHint =
    readiness.equipmentRecommended !== false && !equipAssigned;

  return (
    <div className={`border border-slate-200 rounded-md ${compact ? "p-2" : "p-3"}`}>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
        Resource Readiness
      </div>
      <div className="space-y-1.5">
        <MandatoryRow ok={dockOk} label={dockOk ? "Dock Assigned" : "Dock Missing"} />
        <MandatoryRow ok={laborOk} label={laborOk ? "Labor Assigned" : "Labor Missing"} />
        <OptionalEquipmentRow assigned={equipAssigned} />
      </div>
      <div
        className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${
          readiness.ready ? "text-emerald-700" : "text-amber-700"
        }`}
      >
        Status: {readiness.ready ? "READY FOR LOADING" : "NOT READY"}
      </div>
      {showEquipHint && readiness.ready && (
        <div className="mt-2 text-[10px] text-slate-600 border border-slate-200 bg-slate-50 rounded px-2 py-1.5 flex items-start gap-1.5">
          <Info className="w-3 h-3 shrink-0 mt-0.5 text-slate-500" />
          <span>Equipment not assigned — loading may proceed; assign if required for this job.</span>
        </div>
      )}
      {!readiness.ready && missing.length > 0 && (
        <div className="mt-2 text-[10px] text-red-700 border border-red-100 bg-red-50 rounded px-2 py-1.5">
          <div className="font-semibold uppercase tracking-wide mb-1">Missing Resources</div>
          <ul className="space-y-0.5">
            {missing.map((key) => (
              <li key={key} className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {RESOURCE_LABELS[key] || key}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResourceReadinessPanel;
