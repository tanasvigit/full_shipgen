import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import EmptyState from "../components/yms/EmptyState";
import {
  ShieldCheck, CheckCircle2, XCircle, Truck, Clock, Search, RefreshCw, Loader2,
  LogIn, LogOut, History,
} from "lucide-react";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import { toast } from "sonner";
import gateManagementApi, {
  GATE_ID,
  ACTIVITY_TABS,
  canApproveEntry as entryChecksPass,
} from "../services/gateManagementApi";
import useOperationalAutoRefresh from "../hooks/useOperationalAutoRefresh";
import usePermissions from "../hooks/usePermissions";
import { safeDisplayValue } from "../utils/display";

const GATE_FIELDS = ["plate", "transporter", "driver", "appointment", "slot", "status", "activityTab"];
const REJECT_REASONS = [
  "Invalid documents",
  "Security clearance failed",
  "Appointment not found",
  "Slot expired",
  "Vehicle not permitted",
  "Other",
];

const TAB_LABELS = {
  APPROACHING: "Approaching",
  ARRIVED: "Arrived",
  CHECKED_IN: "Checked In",
  WAITING: "Waiting",
  LOADING_PIPELINE: "Loading Pipeline",
  EXIT_HOLDING: "Exit Holding",
  EXIT_VERIFIED: "Exit Verified",
  EXITED: "Exited",
  REJECTED: "Rejected",
};

const ENTRY_KPI_CARDS = [
  { key: "approaching", label: "Approaching", icon: Clock },
  { key: "arrived", label: "Arrived", icon: Truck },
  { key: "checkedIn", label: "Checked In", icon: LogIn },
  { key: "waiting", label: "Waiting", icon: ShieldCheck },
  { key: "exitHolding", label: "Exit Holding", icon: LogOut },
  { key: "exitedToday", label: "Exited Today", icon: CheckCircle2 },
];

const EXIT_KPI_CARDS = [
  { key: "vehiclesWaiting", label: "Vehicles Waiting", icon: Truck },
  { key: "avgExitDelay", label: "Avg Exit Delay (min)", icon: Clock },
  { key: "exitApprovedToday", label: "Exit Approved Today", icon: ShieldCheck },
  { key: "exitedToday", label: "Exited Today", icon: CheckCircle2 },
];

const CheckRow = ({ check }) => (
  <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
    <div className="flex items-center gap-2">
      {check.passed ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
      <div>
        <div className="text-[12px] font-semibold text-slate-900">{check.label}</div>
        <div className="text-[10px] text-slate-500 font-mono-yms">{check.hint}</div>
      </div>
    </div>
    <StatusPill status={check.passed ? "CHECKED_IN" : "DELAYED"} />
  </div>
);

const Gate = () => {
  const { openVehicle, openExitVerification, search } = useUI();
  const { canApproveEntry, canRejectEntry, canVerifyExit, canGateOut } = usePermissions();
  const [mode, setMode] = useState("entry");
  const [kpis, setKpis] = useState({});
  const [exitKpis, setExitKpis] = useState({});
  const [activity, setActivity] = useState([]);
  const [exitHolding, setExitHolding] = useState([]);
  const [selectedCtx, setSelectedCtx] = useState(null);
  const selectedCtxRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [lookupQuery, setLookupQuery] = useState("");
  const [activityTab, setActivityTab] = useState("ALL");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectCustom, setRejectCustom] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    selectedCtxRef.current = selectedCtx;
  }, [selectedCtx]);

  const loadGate = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const bundle = await gateManagementApi.fetchGateBundle(GATE_ID);
      setKpis(bundle.kpis || {});
      setExitKpis(bundle.exitKpis || {});
      setActivity(bundle.activity || []);
      setExitHolding(bundle.exitHolding || []);
      const prev = selectedCtxRef.current;
      if (silent && prev?.display?.plate) {
        try {
          const ctx = await gateManagementApi.lookupGateVehicle(prev.display.plate, GATE_ID);
          setSelectedCtx(ctx);
        } catch {
          /* selection may no longer exist */
        }
      }
    } catch (e) {
      setError(e.message || "Failed to load gate data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGate();
  }, [loadGate]);

  useOperationalAutoRefresh(() => loadGate(true));

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGate(true);
    } finally {
      setRefreshing(false);
    }
  };

  const selectContext = useCallback((ctx) => {
    setSelectedCtx(ctx);
    setRejectOpen(false);
    const exitStatuses = ["EXIT_HOLDING", "EXIT_VERIFIED"];
    if (exitStatuses.includes(ctx?.vehicle?.status)) {
      setMode("exit");
    }
  }, []);

  const openExitDrawer = useCallback(
    (row) => {
      openExitVerification({
        vehicleId: row.vehicleId,
        onUpdated: () => loadGate(true),
      });
    },
    [openExitVerification, loadGate]
  );

  const runLookup = async (query) => {
    const q = (query || lookupQuery).trim();
    if (!q) {
      toast.error("Enter plate or booking reference");
      return;
    }
    setLookupLoading(true);
    setError("");
    try {
      const ctx = await gateManagementApi.lookupGateVehicle(q, GATE_ID);
      selectContext(ctx);
      if (["EXIT_HOLDING", "EXIT_VERIFIED"].includes(ctx.vehicle?.status)) {
        openExitDrawer({ vehicleId: ctx.vehicleId });
      }
      toast.success(`Loaded ${ctx.display.plate}`);
    } catch (e) {
      setError(e.message || "Lookup failed");
      toast.error(e.message || "Lookup failed");
      setSelectedCtx(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredActivity = useMemo(() => {
    let list = activity;
    if (activityTab !== "ALL") list = list.filter((r) => r.activityTab === activityTab);
    return list.filter((v) => matchesSearch(v, search, GATE_FIELDS));
  }, [activity, search, activityTab]);

  const filteredExitHolding = useMemo(
    () =>
      exitHolding.filter((r) =>
        matchesSearch(r, search, ["plate", "appointment", "queueNumber", "dockCode", "status", "verifiedBy"])
      ),
    [exitHolding, search]
  );

  const display = selectedCtx?.display;
  const journey = selectedCtx?.journey;
  const entryChecks = selectedCtx?.entryChecks ?? [];
  const canEntry = selectedCtx && entryChecksPass(entryChecks) && !selectedCtx.queueEntry;
  const isExitMode = mode === "exit";
  const kpiCards = isExitMode ? EXIT_KPI_CARDS : ENTRY_KPI_CARDS;
  const activeKpis = isExitMode ? exitKpis : kpis;

  const handleApproveEntry = async () => {
    if (!selectedCtx) return;
    setActionLoading(true);
    try {
      const updated = await gateManagementApi.approveEntry(selectedCtx);
      selectContext(updated);
      toast.success("Entry approved — vehicle checked in");
      await loadGate(true);
    } catch (e) {
      toast.error(e.message || "Entry approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedCtx) return;
    const reason = rejectReason === "Other" ? rejectCustom.trim() : rejectReason;
    if (!reason) return toast.error("Select or enter a reject reason");
    setActionLoading(true);
    try {
      await gateManagementApi.rejectEntry(selectedCtx, reason);
      toast.error("Entry rejected", { description: reason });
      setSelectedCtx(null);
      setRejectOpen(false);
      await loadGate(true);
    } catch (e) {
      toast.error(e.message || "Reject failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!selectedCtx) return;
    setActionLoading(true);
    try {
      const updated = await gateManagementApi.markArrivedAtGate(selectedCtx);
      selectContext(updated);
      toast.success("Marked arrived at gate");
      await loadGate(true);
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const loadRow = async (row) => {
    const q = row?.plate || row?.appointment || "";
    setLookupQuery(q);
    await runLookup(q);
  };

  const auditEvents = useMemo(
    () => [...(selectedCtx?.events || [])].sort((a, b) => new Date(b.event_time) - new Date(a.event_time)),
    [selectedCtx?.events]
  );

  return (
    <>
      <TopBar
        title="Gate Management"
        subtitle={`Manual entry & exit verification · Gate ${GATE_ID}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-md overflow-hidden text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setMode("entry")}
                className={`px-3 py-1.5 ${mode === "entry" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
              >
                Entry
              </button>
              <button
                type="button"
                onClick={() => setMode("exit")}
                className={`px-3 py-1.5 ${mode === "exit" ? "bg-slate-900 text-white" : "bg-white text-slate-600"}`}
              >
                Exit Holding
              </button>
            </div>
            <button
              type="button"
              data-testid="gate-refresh"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        }
      />
      <div className="p-6 space-y-5">
        <div className={`grid gap-3 ${isExitMode ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6"}`}>
          {kpiCards.map(({ key, label, icon: Icon }) => (
            <div key={key} className="border border-slate-200 rounded-md bg-white px-3 py-3">
              <div className="flex items-center gap-2 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                <Icon className="w-3.5 h-3.5" /> {label}
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1">{activeKpis[key] ?? 0}</div>
            </div>
          ))}
        </div>

        {error && !selectedCtx && (
          <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {mode === "entry" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SectionCard testId="card-lookup" title="Vehicle Lookup" subtitle={`Gate ${GATE_ID} · manual only`}>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  data-testid="gate-lookup-input"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-[13px] font-mono-yms uppercase"
                  placeholder="Plate · APT-xxx · VEH-xxx"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runLookup()}
                />
              </div>
              <button
                type="button"
                disabled={lookupLoading}
                onClick={() => runLookup()}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-semibold py-2 rounded-md disabled:opacity-50"
              >
                {lookupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Lookup Appointment
              </button>
              <p className="mt-2 text-[10px] text-slate-500">
                Verify appointment and vehicle, then approve entry. No scanner or hardware required.
              </p>
            </SectionCard>

            <SectionCard title="Entry Verification" subtitle={display ? display.plate : "Lookup a vehicle"}>
              {!selectedCtx ? (
                <div className="py-10 text-center text-sm text-slate-500">Lookup a vehicle to verify entry</div>
              ) : (
                <>
                  <div
                    className={`mb-3 px-3 py-2 rounded-md text-center text-[11px] font-bold uppercase tracking-wider ${
                      canEntry ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {canEntry ? "Entry Approved" : "Entry Blocked"}
                  </div>
                  <div className="space-y-1 max-h-[240px] overflow-y-auto thin-scroll">
                    {entryChecks.map((c) => (
                      <CheckRow key={c.id} check={c} />
                    ))}
                  </div>
                  {(canApproveEntry || canRejectEntry) && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {canApproveEntry && (
                    <button
                      type="button"
                      disabled={!canEntry || actionLoading}
                      onClick={handleApproveEntry}
                      className="inline-flex items-center justify-center gap-1 bg-emerald-600 text-white text-xs font-semibold py-2 rounded-md disabled:bg-slate-300"
                    >
                      Approve Entry
                    </button>
                    )}
                    {canRejectEntry && (
                    <button type="button" onClick={() => setRejectOpen((o) => !o)} className="border border-red-300 text-red-700 text-xs font-semibold py-2 rounded-md">
                      Reject Entry
                    </button>
                    )}
                  </div>
                  )}
                  {canApproveEntry && selectedCtx.vehicle?.status === "SCHEDULED" && !selectedCtx.queueEntry && (
                    <button type="button" disabled={actionLoading} onClick={handleMarkArrived} className="mt-2 w-full text-[11px] font-semibold border py-2 rounded-md">
                      Mark Arrived
                    </button>
                  )}
                  {canRejectEntry && rejectOpen && (
                    <div className="mt-3 border border-red-200 rounded-md p-3 bg-red-50/50 space-y-2">
                      <select className="w-full text-[12px] border rounded-md px-2 py-1.5" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                        {REJECT_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {rejectReason === "Other" && (
                        <input className="w-full text-[12px] border rounded-md px-2 py-1.5" value={rejectCustom} onChange={(e) => setRejectCustom(e.target.value)} placeholder="Reason" />
                      )}
                      <button type="button" disabled={actionLoading} onClick={handleReject} className="w-full bg-red-600 text-white text-xs font-semibold py-2 rounded-md">
                        Confirm Reject
                      </button>
                    </div>
                  )}
                </>
              )}
            </SectionCard>

            <SectionCard title="Vehicle Details" subtitle="Journey & audit">
              {!display ? (
                <div className="py-10 text-center text-sm text-slate-500">No vehicle selected</div>
              ) : (
                <div className="space-y-2 text-[12px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-5 h-5 text-slate-700" />
                    <div>
                      <div className="font-mono-yms font-bold text-base">{display.plate}</div>
                      <div className="text-[10px] text-slate-500">{display.vehicleReference}</div>
                    </div>
                    <div className="ml-auto"><StatusPill status={display.status} /></div>
                  </div>
                  {[
                    ["Appointment", display.appointment],
                    ["Driver", display.driver],
                    ["Transporter", display.transporter],
                    ["Material", display.material],
                    ["Slot", display.slot],
                    ["Dock", journey?.dock?.dock_code || display.dock],
                    ["Queue", journey?.queue_entry?.queue_number || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-[10px] uppercase text-slate-500 font-semibold">{k}</span>
                      <span className="font-mono-yms font-semibold truncate max-w-[55%] text-right">{safeDisplayValue(v, "—")}</span>
                    </div>
                  ))}
                  <button type="button" onClick={() => setShowAudit((s) => !s)} className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                    <History className="w-3 h-3" /> {showAudit ? "Hide" : "Show"} audit ({auditEvents.length})
                  </button>
                  {showAudit && (
                    <div className="max-h-32 overflow-y-auto thin-scroll text-[10px] space-y-1">
                      {auditEvents.map((e) => (
                        <div key={e.id} className="border-b border-slate-50 pb-1">
                          <span className="font-semibold">{e.event_type}</span>
                          <span className="text-slate-500"> — {e.event_note}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {mode === "exit" && (
          <>
            <SectionCard testId="card-exit-lookup" title="Exit Lookup" subtitle="Find vehicle in exit holding">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-[13px] font-mono-yms uppercase"
                    placeholder="Plate · APT-xxx"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runLookup()}
                  />
                </div>
                <button type="button" disabled={lookupLoading} onClick={() => runLookup()} className="px-4 bg-slate-900 text-white text-xs font-semibold rounded-md">
                  Lookup
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Exit Holding" subtitle="Vehicles awaiting verification and gate-out" padding="p-0">
              {loading && exitHolding.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-slate-500">Loading…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead className="bg-slate-50 border-b">
                      <tr className="text-[10px] uppercase text-slate-500">
                        <th className="text-left px-4 py-2">Vehicle</th>
                        <th className="text-left px-2 py-2">Appointment</th>
                        <th className="text-left px-2 py-2">Queue</th>
                        <th className="text-left px-2 py-2">Dock</th>
                        <th className="text-left px-2 py-2">Completed Time</th>
                        <th className="text-left px-2 py-2">Waiting Time</th>
                        <th className="text-left px-2 py-2">Verified By</th>
                        <th className="text-left px-2 py-2">Status</th>
                        <th className="text-right px-4 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExitHolding.map((row) => (
                        <tr
                          key={row.vehicleId}
                          className="border-b hover:bg-slate-50 cursor-pointer"
                          onClick={() => openExitDrawer(row)}
                        >
                          <td className="px-4 py-2 font-mono-yms font-semibold">{row.plate}</td>
                          <td className="px-2 py-2">{row.appointment}</td>
                          <td className="px-2 py-2 font-mono-yms">{row.queueNumber || "—"}</td>
                          <td className="px-2 py-2">{row.dockCode}</td>
                          <td className="px-2 py-2 font-mono-yms text-[11px]">{safeDisplayValue(row.completedAt, "—")}</td>
                          <td className="px-2 py-2">{row.waitingMinutes} min</td>
                          <td className="px-2 py-2">{row.verifiedBy || "—"}</td>
                          <td className="px-2 py-2"><StatusPill status={row.status} /></td>
                          <td className="px-4 py-2 text-right">
                            {(canVerifyExit || canGateOut) ? (
                            <button
                              type="button"
                              className="text-[11px] font-semibold underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                openExitDrawer(row);
                              }}
                            >
                              {row.status === "EXIT_VERIFIED" ? "Gate Out" : "Verify"}
                            </button>
                            ) : (
                            <span className="text-[11px] text-slate-400">View only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredExitHolding.length === 0 && <EmptyState query={search} label="exit holding vehicles" />}
                </div>
              )}
            </SectionCard>
          </>
        )}

        {mode === "entry" && (
          <SectionCard title="Gate Activity" subtitle="Live lifecycle" padding="p-0">
            <div className="px-4 py-2 border-b flex flex-wrap gap-2">
              {["ALL", ...ACTIVITY_TABS].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivityTab(tab)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase rounded-sm ${
                    activityTab === tab ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab === "ALL" ? "All" : TAB_LABELS[tab] || tab}
                </button>
              ))}
            </div>
            {loading && activity.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-slate-50 border-b">
                    <tr className="text-[10px] uppercase text-slate-500">
                      <th className="text-left px-4 py-2">Plate</th>
                      <th className="text-left px-2 py-2">Appointment</th>
                      <th className="text-left px-2 py-2">Slot</th>
                      <th className="text-left px-2 py-2">Status</th>
                      <th className="text-left px-2 py-2">Tab</th>
                      <th className="text-right px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.map((v) => (
                      <tr
                        key={v.vehicleId}
                        onClick={() => loadRow(v)}
                        className={`border-b hover:bg-slate-50 cursor-pointer ${
                          selectedCtx?.vehicleId === v.vehicleId ? "bg-amber-50/40" : ""
                        }`}
                      >
                        <td className="px-4 py-2 font-mono-yms font-semibold">{v.plate}</td>
                        <td className="px-2 py-2">{v.appointment}</td>
                        <td className="px-2 py-2">{safeDisplayValue(v.slot, "—")}</td>
                        <td className="px-2 py-2"><StatusPill status={v.status} /></td>
                        <td className="px-2 py-2 text-[10px] font-semibold">{TAB_LABELS[v.activityTab] || v.activityTab}</td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button
                            type="button"
                            className="text-[11px] font-semibold underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openVehicle({ vehicleId: v.vehicleId, appointmentId: v.appointmentId, queueEntryId: v.queueEntryId });
                            }}
                          >
                            View
                          </button>
                          {canApproveEntry && v.activityTab === "ARRIVED" && (
                            <button type="button" className="text-[11px] font-semibold text-emerald-700" onClick={(e) => { e.stopPropagation(); loadRow(v).then(() => handleApproveEntry()); }}>
                              Approve
                            </button>
                          )}
                          {(canVerifyExit || canGateOut) && (v.status === "EXIT_HOLDING" || v.status === "EXIT_VERIFIED") && (
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-violet-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                openExitDrawer({ vehicleId: v.vehicleId });
                              }}
                            >
                              Exit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredActivity.length === 0 && <EmptyState query={search || activityTab} label="gate vehicles" />}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </>
  );
};

export default Gate;
