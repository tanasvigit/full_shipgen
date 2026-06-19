import React, { useCallback, useEffect, useState } from "react";
import TopBar from "../components/yms/TopBar";
import PageContent from "../components/yms/PageContent";
import SectionCard from "../components/yms/SectionCard";
import aiInsightsApi from "../services/aiInsightsApi";
import { formatINR } from "../data/db";
import {
  Sparkles, TrendingUp, Brain, AlertTriangle, CheckCircle2, IndianRupee, RefreshCw,
} from "lucide-react";
import useOperationalAutoRefresh from "../hooks/useOperationalAutoRefresh";

const MODULE_ICONS = {
  "Queue Congestion": { icon: Brain, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  "Loading Delay": { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  "Resource Shortage": { icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  "Dock Blocked": { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  "Exit Delay": { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  "Yard Capacity": { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Operational Alert": { icon: Sparkles, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" },
};

const AiInsights = () => {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiInsightsApi.fetchOperationalInsights();
      setBundle(data);
    } catch (e) {
      console.error(e);
      setBundle({ insights: [], summary: { total: 0, critical: 0, warning: 0, activeAlerts: 0, potentialSavings: 0 } });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useOperationalAutoRefresh(load);

  const insights = bundle?.insights || [];
  const summary = bundle?.summary || {};

  return (
    <>
      <TopBar
        title="Operational Recommendations"
        subtitle="Live insights from Control Tower alerts · queue · loading · resources"
        actions={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />
      <PageContent className="space-y-5">
        <div
          data-testid="ai-hero-banner"
          className="bg-slate-900 text-white rounded-md p-4 sm:p-6 relative overflow-hidden isolate"
        >
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" aria-hidden />
          <div className="relative z-10 flex items-center gap-4 sm:gap-6 flex-wrap">
            <div className="w-14 h-14 bg-amber-400 rounded-md flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-amber-400 font-bold">YARD.OS · Operational Engine</div>
              <div className="font-display font-bold text-2xl mt-1">
                {loading ? "Loading…" : `${summary.activeAlerts ?? insights.length} active operational signals`}
              </div>
              <div className="text-[12px] text-slate-300 mt-1">
                Rule-based recommendations from live alerts — not predictive AI.
              </div>
            </div>
            <div className="text-right border-l border-slate-700 pl-4 sm:pl-6 shrink-0">
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Critical / Warning</div>
              <div className="font-display font-bold text-2xl mt-1 font-mono-yms">
                {summary.critical ?? 0} / {summary.warning ?? 0}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">From Control Tower</div>
            </div>
          </div>
        </div>

        {insights.length === 0 && !loading && (
          <SectionCard title="No Active Recommendations" subtitle="Yard operating within normal thresholds">
            <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              No operational alerts requiring action.
            </div>
          </SectionCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((item) => {
            const meta = MODULE_ICONS[item.module] || MODULE_ICONS["Operational Alert"];
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                className={`border rounded-md p-4 ${meta.bg} ${meta.border}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-md bg-white flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{item.module}</div>
                    <div className="font-semibold text-slate-900 mt-0.5">{item.title}</div>
                    <div className="text-[12px] text-slate-600 mt-1">{item.impact}</div>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                      <span>Confidence {item.confidence}%</span>
                      <span className="uppercase font-semibold">{item.severity}</span>
                      {item.vehicle && <span className="font-mono-yms">{item.vehicle}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {summary.potentialSavings > 0 && (
          <div className="text-[11px] text-slate-500 text-center">
            Estimated delay exposure from waiting alerts: {formatINR(summary.potentialSavings)} (illustrative)
          </div>
        )}
      </PageContent>
    </>
  );
};

export default AiInsights;
