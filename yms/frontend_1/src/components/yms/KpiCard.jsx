import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const KpiCard = ({ label, value, suffix, hint, trend, accent = "slate", icon: Icon, testId }) => {
  const accentMap = {
    slate: "text-slate-900",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
    info: "text-blue-600",
  };
  const Trend = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? "text-red-600" : trend < 0 ? "text-emerald-600" : "text-slate-400";

  return (
    <div data-testid={testId} className="bg-white border border-slate-200 rounded-md p-3 sm:p-4 hover:shadow-sm transition-shadow group min-w-0">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.15em] font-semibold text-slate-500 truncate">{label}</div>
        {Icon && (
          <div className="w-7 h-7 rounded-md bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center text-slate-600">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 min-w-0">
        <div className={`font-display font-bold text-2xl sm:text-3xl tracking-tight truncate ${accentMap[accent]}`}>{value}</div>
        {suffix && <div className="text-sm font-medium text-slate-400">{suffix}</div>}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
        {hint && <div className="text-[11px] text-slate-500 truncate">{hint}</div>}
        {typeof trend === "number" && (
          <div className={`inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono-yms ${trendColor}`}>
            <Trend className="w-3 h-3" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiCard;
