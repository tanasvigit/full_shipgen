import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Truck, CalendarClock, Warehouse, Sparkles, CornerDownLeft, ArrowDown, ArrowUp,
  ListOrdered, Activity, Receipt, Wrench, HardHat, Loader2, AlertCircle,
} from "lucide-react";
import { fetchJumpResults } from "../../services/jumpToApi";
import { yardPath } from "../../constants/basePath";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";

const KIND_META = {
  vehicle: { icon: Truck, label: "Vehicle", color: "text-slate-700 bg-slate-100" },
  appointment: { icon: CalendarClock, label: "Appointment", color: "text-blue-700 bg-blue-100" },
  dock: { icon: Warehouse, label: "Dock", color: "text-emerald-700 bg-emerald-100" },
  queue: { icon: ListOrdered, label: "Queue", color: "text-indigo-700 bg-indigo-100" },
  yard_event: { icon: Activity, label: "Yard Event", color: "text-violet-700 bg-violet-100" },
  detention: { icon: Receipt, label: "Detention", color: "text-rose-700 bg-rose-100" },
  equipment: { icon: Wrench, label: "Equipment", color: "text-orange-700 bg-orange-100" },
  labor: { icon: HardHat, label: "Labor", color: "text-cyan-700 bg-cyan-100" },
  ai: { icon: Sparkles, label: "AI Insight", color: "text-amber-700 bg-amber-100" },
};

const ROUTE_FOR = {
  appointment: "/appointments",
  dock: "/docks",
  queue: "/queue",
  yard_event: "/",
  detention: "/detention",
  equipment: "/equipment",
  labor: "/labor",
  ai: "/ai",
};

const groupOrder = [
  "vehicle",
  "appointment",
  "queue",
  "dock",
  "detention",
  "equipment",
  "labor",
  "yard_event",
  "ai",
];

export const JumpToResults = ({ open, query, inputRef, onClose }) => {
  const navigate = useNavigate();
  const {
    openVehicle,
    openDetention,
    openEquipment,
    openLabor,
    setSearch,
    clearSearch,
  } = useUI();
  const [active, setActive] = useState(0);
  const [results, setResults] = useState([]);
  const [unavailable, setUnavailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const reqRef = useRef(0);

  useEffect(() => {
    setActive(0);
    if (!open || !query?.trim()) {
      setResults([]);
      setUnavailable([]);
      setError("");
      return undefined;
    }

    const id = ++reqRef.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchJumpResults(query);
        if (reqRef.current !== id) return;
        setResults(data.results || []);
        setUnavailable(data.unavailable || []);
      } catch (e) {
        if (reqRef.current !== id) return;
        setResults([]);
        setUnavailable([]);
        setError(e.message || "Search failed");
      } finally {
        if (reqRef.current === id) setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [open, query]);

  const select = (r) => {
    if (!r) return;
    if (r.kind === "vehicle" || r.kind === "queue") {
      openVehicle(r.payload || {});
      clearSearch();
    } else if (r.kind === "detention") {
      navigate(yardPath("/detention"));
      openDetention({ detentionId: r.payload?.detentionId });
      setSearch(query);
    } else if (r.kind === "equipment") {
      navigate(yardPath("/equipment"));
      openEquipment({ equipmentId: r.payload?.equipmentId });
      setSearch(query);
    } else if (r.kind === "labor") {
      navigate(yardPath("/labor"));
      openLabor({ laborId: r.payload?.laborId });
      setSearch(query);
    } else {
      const route = ROUTE_FOR[r.kind];
      if (route) {
        navigate(route);
        setSearch(query);
      }
    }
    onClose?.();
    inputRef?.current?.blur();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (!results.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        select(results[active]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-jump-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const groups = useMemo(
    () =>
      groupOrder
        .map((k) => ({ kind: k, items: results.filter((r) => r.kind === k) }))
        .filter((g) => g.items.length > 0),
    [results]
  );

  if (!open) return null;

  let runningIdx = 0;

  return (
    <div
      data-testid="jump-to-dropdown"
      className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-xl overflow-hidden z-50"
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading && (
        <div className="px-4 py-4 flex items-center gap-2 text-[12px] text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Searching live data…
        </div>
      )}
      {!loading && error && (
        <div className="px-4 py-4 flex items-start gap-2 text-[12px] text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Search unavailable</div>
            <div className="text-red-600/90">{error}</div>
          </div>
        </div>
      )}
      {!loading && !error && results.length === 0 && (
        <div className="px-4 py-6 text-center text-[12px] text-slate-500">
          <div className="font-display font-bold text-slate-900 mb-1">Nothing matches &ldquo;{query}&rdquo;</div>
          <div>Search will still filter the visible table.</div>
        </div>
      )}
      {!loading && !error && results.length > 0 && (
        <div ref={listRef} className="max-h-[400px] overflow-y-auto thin-scroll">
          {groups.map((group) => {
            const meta = KIND_META[group.kind];
            return (
              <div key={group.kind}>
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] uppercase tracking-widest font-bold text-slate-500 flex items-center gap-1.5">
                  <meta.icon className="w-3 h-3" />
                  {meta.label}s · {group.items.length}
                </div>
                {group.items.map((r) => {
                  const idx = runningIdx++;
                  const isActive = idx === active;
                  return (
                    <button
                      key={`${r.kind}-${r.id}`}
                      data-testid={`jump-result-${r.kind}-${r.id}`}
                      data-jump-idx={idx}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => select(r)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-slate-100 last:border-0 text-left transition ${
                        isActive ? "bg-amber-50" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md ${meta.color}`}>
                        <meta.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono-yms font-semibold text-[13px] text-slate-900 truncate">{r.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">{r.sub}</div>
                      </div>
                      {r.meta && <StatusPill status={r.meta} />}
                      {isActive && (
                        <div className="shrink-0 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-slate-500">
                          <CornerDownLeft className="w-3 h-3" /> Open
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
      {!loading && unavailable.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-100 bg-amber-50/80 text-[11px] text-amber-900">
          {unavailable.map((u) => (
            <div key={u.kind} className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>{u.reason}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-0.5"><ArrowUp className="w-2.5 h-2.5" /><ArrowDown className="w-2.5 h-2.5" /> navigate</span>
          <span className="inline-flex items-center gap-0.5"><CornerDownLeft className="w-2.5 h-2.5" /> open</span>
          <span className="inline-flex items-center gap-0.5"><kbd className="font-mono-yms border border-slate-300 rounded-sm px-1 text-[9px]">esc</kbd> close</span>
        </div>
        <span className="font-mono-yms">
          {loading ? "…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </span>
      </div>
    </div>
  );
};

export default JumpToResults;
