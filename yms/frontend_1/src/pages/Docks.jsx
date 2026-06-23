import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import KpiCard from "../components/yms/KpiCard";
import EmptyState from "../components/yms/EmptyState";
import CreateDockDialog from "../components/yms/CreateDockDialog";
import EditDockDialog from "../components/yms/EditDockDialog";
import docksApi, { HOURS, nextAppointmentsForDock, buildAwaitingDockAssignment } from "../services/docksApi";
import { fetchQueueBundle } from "../services/queueApi";
import DockAssignDialog from "../components/yms/DockAssignDialog";
import {
  Warehouse, Wrench, Users, AlertTriangle, CheckCircle2, Truck,
  Gauge, TrendingUp, RefreshCw, Plus, Eye, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import usePermissions from "../hooks/usePermissions";
import { MOD } from "../constants/permissions";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartBox from "../components/common/ChartBox";
import PageContent from "../components/yms/PageContent";

const DOCK_FIELDS = ["code", "name", "type", "status", "currentVehicle", "plate", "transporter", "equipment", "laborTeam"];

const STATUS_META = {
  AVAILABLE: { bar: "bg-emerald-500", soft: "bg-emerald-50", text: "text-emerald-700" },
  OCCUPIED: { bar: "bg-red-500", soft: "bg-red-50", text: "text-red-700" },
  DELAYED: { bar: "bg-amber-500", soft: "bg-amber-50", text: "text-amber-700" },
  MAINTENANCE: { bar: "bg-slate-400", soft: "bg-slate-100", text: "text-slate-600" },
};

const cellColor = (v) => {
  switch (v) {
    case "FREE": return "bg-emerald-100 hover:bg-emerald-200";
    case "BOOKED": return "bg-blue-200 hover:bg-blue-300";
    case "BUSY": return "bg-red-300 hover:bg-red-400";
    case "DELAYED": return "bg-amber-400 hover:bg-amber-500";
    case "MAINT": return "bg-slate-400";
    default: return "bg-slate-200";
  }
};

const Docks = () => {
  const { search, openDock, openVehicle } = useUI();
  const { canWriteDock, canAssignDock, can } = usePermissions();
  const includeAppointments = can(MOD.APPOINTMENTS);
  const includeQueue = can(MOD.QUEUE) || can(MOD.DOCKS);
  const [rows, setRows] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [hoverDock, setHoverDock] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editDock, setEditDock] = useState(null);
  const [awaiting, setAwaiting] = useState([]);
  const [assignRow, setAssignRow] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);

  const loadDocks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const [bundle, queueBundle] = await Promise.all([
        docksApi.fetchDocksBundle({ includeAppointments, includeQueue }),
        includeQueue
          ? fetchQueueBundle().catch(() => ({ entries: [] }))
          : Promise.resolve({ entries: [] }),
      ]);
      setRows(bundle.rows);
      setAppointments(bundle.appointments);
      setAwaiting(buildAwaitingDockAssignment(queueBundle.entries || []));
    } catch (e) {
      setError(e.message || "Failed to load docks");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [includeAppointments, includeQueue]);

  useEffect(() => {
    loadDocks();
  }, [loadDocks]);

  useEffect(() => {
    const onYmsChange = () => loadDocks(true);
    window.addEventListener("yms-data-changed", onYmsChange);
    return () => window.removeEventListener("yms-data-changed", onYmsChange);
  }, [loadDocks]);

  const filtered = useMemo(() => {
    const byStatus = filter === "All" ? rows : rows.filter((d) => d.status === filter);
    return byStatus.filter((d) => matchesSearch(d, search, DOCK_FIELDS));
  }, [rows, filter, search]);

  const stats = useMemo(() => docksApi.computeDockKpis(rows), [rows]);
  const typeBreakdown = useMemo(() => docksApi.computeTypeBreakdown(rows), [rows]);
  const heatmap = useMemo(() => docksApi.buildScheduleHeatmap(rows, appointments), [rows, appointments]);

  const openDockDetail = (row) => {
    openDock({
      dockId: row.id,
      onUpdated: () => loadDocks(true),
      openVehicle: (v) => openVehicle(v),
    });
  };

  const handleEdit = (ev, d) => {
    ev.stopPropagation();
    setEditDock(d);
    setEditOpen(true);
  };

  const handleDelete = async (ev, d) => {
    ev.stopPropagation();
    if (!window.confirm(`Delete dock "${d.name}" (${d.code})? This cannot be undone.`)) return;
    try {
      await docksApi.deleteDock(d.id);
      toast.success(`${d.code} deleted`);
      await loadDocks(true);
    } catch (err) {
      toast.error(err.message || "Failed to delete dock");
    }
  };

  if (loading && rows.length === 0) {
    return (
      <>
        <TopBar title="Dock Management" subtitle="Loading bays…" />
        <PageContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-md animate-pulse" />
          ))}
        </div>
        </PageContent>
      </>
    );
  }

  if (error && rows.length === 0) {
    return (
      <>
        <TopBar title="Dock Management" subtitle="Bay control" />
        <PageContent className="text-center">
          <p className="text-sm text-slate-600">{error}</p>
          <button type="button" onClick={() => loadDocks()} className="mt-3 text-xs font-semibold bg-slate-900 text-white px-3 py-2 rounded-md">
            Retry
          </button>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Dock Management"
        subtitle="Live bay assignment · Equipment & labor coordination"
        actions={
          <div className="flex items-center gap-2">
            {canWriteDock && (
            <button
              type="button"
              data-testid="create-dock-btn"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Create Dock
            </button>
            )}
            <button
              type="button"
              onClick={() => loadDocks(true)}
              className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        }
      />
      <CreateDockDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={() => loadDocks(true)} />
      <EditDockDialog
        open={editOpen}
        dock={editDock}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditDock(null);
        }}
        onUpdated={() => loadDocks(true)}
      />
      <PageContent className="space-y-5">
        {error && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{error}</div>
        )}

        {rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-md p-12 text-center text-sm text-slate-500">
            <p>No docks configured yet.</p>
            {canWriteDock && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Create Dock
            </button>
            )}
          </div>
        ) : (
          <>
            <SectionCard
              testId="card-awaiting-dock-assignment"
              title="Vehicles Awaiting Dock Assignment"
              subtitle={`${awaiting.length} in staging after call-in`}
              padding="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                      {[
                        "Appointment",
                        "Queue",
                        "Vehicle",
                        "Material",
                        "Vehicle Type",
                        "Priority",
                        "Rec. Dock",
                        "Waiting",
                        "Status",
                        "",
                      ].map((h) => (
                        <th key={h || "action"} className="text-left font-semibold px-3 py-2.5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {awaiting.map((a) => (
                      <tr key={a.queueEntryId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono-yms font-semibold">{a.appointmentRef}</td>
                        <td className="px-2 py-2 font-mono-yms">{a.queueNumber}</td>
                        <td className="px-2 py-2 font-mono-yms">{a.vehicleNumber}</td>
                        <td className="px-2 py-2">{a.material}</td>
                        <td className="px-2 py-2">{a.vehicleType}</td>
                        <td className="px-2 py-2 font-mono-yms">{a.priority}</td>
                        <td className="px-2 py-2 font-mono-yms text-slate-700">
                          {a.recommendedDock?.dockCode || "—"}
                          {a.recommendedDock?.score != null && (
                            <span className="text-[10px] text-slate-400 ml-1">({a.recommendedDock.score})</span>
                          )}
                        </td>
                        <td className="px-2 py-2 font-mono-yms">{a.waitingLabel}</td>
                        <td className="px-2 py-2">
                          <StatusPill status={a.status} />
                        </td>
                        <td className="px-2 py-2">
                          {canAssignDock ? (
                          <button
                            type="button"
                            data-testid={`assign-dock-${a.queueEntryId}`}
                            onClick={() => {
                              setAssignRow(a);
                              setAssignOpen(true);
                            }}
                            className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white px-2 py-1 rounded-sm"
                          >
                            Assign Dock
                          </button>
                          ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {awaiting.length === 0 && (
                  <div className="px-4 py-8 text-center text-[12px] text-slate-500">
                    No vehicles in staging awaiting dock assignment.
                  </div>
                )}
              </div>
            </SectionCard>

            <DockAssignDialog
              open={assignOpen}
              onOpenChange={setAssignOpen}
              row={assignRow}
              dockRows={rows}
              onAssigned={() => loadDocks(true)}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <KpiCard testId="dock-kpi-total" label="Total Docks" value={stats.total} hint="registered bays" icon={Warehouse} />
              <KpiCard testId="dock-kpi-available" label="Available Docks" value={stats.available} hint="ready for next" icon={CheckCircle2} accent="success" />
              <KpiCard testId="dock-kpi-occupied" label="Occupied Docks" value={stats.occupied} hint="active assignment" icon={Truck} accent="danger" />
              <KpiCard testId="dock-kpi-delayed" label="Delayed Docks" value={stats.delayed} hint="over target (est.)" icon={AlertTriangle} accent="warning" />
              <KpiCard testId="dock-kpi-maint" label="Maintenance Docks" value={stats.maint} hint="offline" icon={Wrench} />
              <KpiCard testId="dock-kpi-util" label="Average Utilization" value={stats.avgUtil} suffix="%" hint="estimated" icon={Gauge} accent="info" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <SectionCard
                testId="card-bay-view"
                title="Bay Visualization"
                subtitle="Top-down view · click a bay for details"
                className="xl:col-span-3"
                padding="p-0"
              >
                <div className="relative bg-slate-900 px-4 pt-4 pb-2">
                  <div className="absolute top-1 left-4 text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Warehouse Yard</div>
                  <div className="absolute top-1 right-4 text-[9px] uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-3">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Free</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500" /> Loading</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Delayed</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-400" /> Maint</span>
                  </div>

                  <div className="mt-5 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                    {rows.map((d) => {
                      const meta = STATUS_META[d.status] || STATUS_META.AVAILABLE;
                      const isHover = hoverDock === d.id;
                      return (
                        <button
                          key={d.id}
                          type="button"
                          data-testid={`bay-${d.code}`}
                          onMouseEnter={() => setHoverDock(d.id)}
                          onMouseLeave={() => setHoverDock(null)}
                          onClick={() => openDockDetail(d)}
                          className={`relative min-w-0 overflow-hidden bg-slate-800 border-2 ${isHover ? "border-amber-400" : "border-slate-700"} rounded-md p-2 hover:border-amber-400 transition`}
                        >
                          <div className={`absolute top-0 left-2 right-2 h-1 ${meta.bar} rounded-b-sm`} />
                          <div className="flex flex-col items-center min-w-0 w-full">
                            <div className="font-display font-black text-sm sm:text-lg text-white mt-1 truncate max-w-full w-full text-center leading-tight">
                              {d.code}
                            </div>
                            <div className={`mt-1 w-2 h-2 rounded-full ${d.status === "AVAILABLE" ? "bg-emerald-400" : d.status === "OCCUPIED" ? "bg-red-400 pulse-dot" : d.status === "DELAYED" ? "bg-amber-400 pulse-dot" : "bg-slate-500"}`} />
                            {(d.status === "OCCUPIED" || d.status === "DELAYED") && (
                              <Truck className="w-4 h-4 text-amber-400 mt-1.5" />
                            )}
                            {d.status === "MAINTENANCE" && <Wrench className="w-3.5 h-3.5 text-slate-500 mt-1.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 h-2 bg-slate-700 rounded-sm relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center gap-1.5 px-2">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className="w-3 h-0.5 bg-amber-400/50 rounded-sm" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 text-center text-[9px] uppercase tracking-widest text-slate-500 font-semibold">Driveway · Yard side</div>
                </div>

                {hoverDock && (() => {
                  const d = rows.find((x) => x.id === hoverDock);
                  if (!d) return null;
                  const meta = STATUS_META[d.status] || STATUS_META.AVAILABLE;
                  return (
                    <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-4 text-[12px] flex-wrap min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`w-8 h-8 shrink-0 rounded-md ${meta.soft} ${meta.text} font-display font-black flex items-center justify-center text-xs`}>{d.code}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{d.name}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{d.type}</div>
                        </div>
                      </div>
                      <StatusPill status={d.status} />
                      {d.currentVehicle && (
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase tracking-wider">Vehicle</span>
                          <span className="ml-2 font-mono-yms font-semibold text-slate-900">{d.currentVehicle}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Wrench className="w-3 h-3" /> {d.equipment}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Users className="w-3 h-3" /> {d.laborTeam}
                      </div>
                      <div className="ml-auto font-mono-yms font-bold text-slate-900">{d.utilizationPct}% util</div>
                    </div>
                  );
                })()}
              </SectionCard>

              <SectionCard testId="card-type-mix" title="Dock Mix" subtitle="By cargo specialization (from dock_type)">
                {typeBreakdown.length === 0 ? (
                  <div className="h-44 flex items-center justify-center text-sm text-slate-500">No data</div>
                ) : (
                  <>
                    <ChartBox height={176}>
                        <PieChart>
                          <Pie data={typeBreakdown} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
                            {typeBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                    </ChartBox>
                    <div className="space-y-1 mt-2">
                      {typeBreakdown.map((t) => (
                        <div key={t.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-sm" style={{ background: t.fill }} />
                            <span className="text-slate-700">{t.name}</span>
                          </div>
                          <span className="font-mono-yms font-bold text-slate-900">{t.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </SectionCard>
            </div>

            <SectionCard
              testId="card-heatmap"
              title="Today's Schedule Heatmap"
              subtitle="Docks × hours · derived from appointments & live status"
              action={
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
                  <span className="inline-flex items-center gap-1 text-emerald-700"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-200" /> Free</span>
                  <span className="inline-flex items-center gap-1 text-blue-700"><span className="w-2.5 h-2.5 rounded-sm bg-blue-200" /> Booked</span>
                  <span className="inline-flex items-center gap-1 text-red-700"><span className="w-2.5 h-2.5 rounded-sm bg-red-300" /> Busy</span>
                  <span className="inline-flex items-center gap-1 text-amber-700"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Delayed</span>
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] uppercase tracking-widest font-semibold text-slate-500 px-2 py-1 w-12">Dock</th>
                      {HOURS.map((h) => (
                        <th key={h} className="font-mono-yms font-bold text-slate-500 px-1 py-1 text-center">{String(h).padStart(2, "0")}</th>
                      ))}
                      <th className="px-2 text-right text-[10px] uppercase tracking-widest font-semibold text-slate-500 w-16">Util</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((d, i) => (
                      <tr key={d.id}>
                        <td className="px-2 py-1 font-mono-yms font-bold text-slate-900">{d.code}</td>
                        {(heatmap[i] || []).map((cell, j) => (
                          <td key={j} className="p-0.5">
                            <div
                              title={`${d.code} · ${String(HOURS[j]).padStart(2, "0")}:00 · ${cell}`}
                              className={`h-6 ${cellColor(cell)} border border-white rounded-sm transition cursor-pointer`}
                              onClick={() => openDockDetail(d)}
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1 text-right">
                          <span className={`font-mono-yms font-bold ${d.utilizationPct > 85 ? "text-red-600" : d.utilizationPct > 65 ? "text-amber-600" : "text-emerald-600"}`}>
                            {d.utilizationPct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden">
                {[
                  ["All", stats.total],
                  ["AVAILABLE", stats.available],
                  ["OCCUPIED", stats.occupied],
                  ["DELAYED", stats.delayed],
                  ["MAINTENANCE", stats.maint],
                ].map(([f, count]) => (
                  <button
                    key={f}
                    data-testid={`dock-filter-${String(f).toLowerCase()}`}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                      filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {String(f).toLowerCase()} <span className="ml-1 font-mono-yms opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-stretch">
              {filtered.map((d) => {
                const meta = STATUS_META[d.status] || STATUS_META.AVAILABLE;
                const nexts = nextAppointmentsForDock(appointments, d.code);
                return (
                  <div
                    key={d.id}
                    data-testid={`dock-card-${d.code}`}
                    className="bg-white border border-slate-200 rounded-md overflow-hidden hover:shadow-md transition text-left w-full min-w-0 h-full flex flex-col"
                  >
                    <button type="button" onClick={() => openDockDetail(d)} className="flex flex-col flex-1 min-w-0 text-left">
                    <div className={`h-1 shrink-0 ${meta.bar}`} />
                    <div className="p-4 flex flex-col flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-12 h-12 shrink-0 rounded-md ${meta.soft} flex items-center justify-center overflow-hidden`}>
                          <span className={`font-display font-black text-lg ${meta.text} truncate max-w-[2.75rem]`}>{d.code}</span>
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="font-display font-bold text-slate-900 text-base leading-tight line-clamp-2 break-words">{d.name}</div>
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5 truncate">{d.type}</div>
                          <div className="mt-1.5"><StatusPill status={d.status} /></div>
                        </div>
                      </div>

                      {(d.status === "OCCUPIED" || d.status === "DELAYED") && d.currentVehicle ? (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                            <span>Active</span>
                            <span className="font-mono-yms text-slate-900 text-[11px] normal-case truncate max-w-[8rem]">{d.currentVehicle}</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                            <div className={`h-full ${d.status === "DELAYED" ? "bg-amber-500" : "bg-slate-900"}`} style={{ width: `${d.progressPct}%` }} />
                          </div>
                          <div className="flex justify-between mt-1 text-[10px] font-mono-yms text-slate-500">
                            <span>{d.progressPct}% {d.progressEstimated ? "(est.)" : ""}</span>
                            <span className="text-slate-700">ETA {d.etaCloseMin}m</span>
                          </div>
                          {(d.tareWeightKg != null || d.grossWeightKg != null || d.netWeightKg != null) && (
                            <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] font-mono-yms">
                              <span>TW {d.tareWeightKg != null ? `${Number(d.tareWeightKg).toLocaleString("en-IN")}` : "—"}</span>
                              <span>GW {d.grossWeightKg != null ? `${Number(d.grossWeightKg).toLocaleString("en-IN")}` : "—"}</span>
                              <span className="text-emerald-700 font-bold">NW {d.netWeightKg != null ? `${Number(d.netWeightKg).toLocaleString("en-IN")}` : "—"}</span>
                            </div>
                          )}
                        </div>
                      ) : d.status === "MAINTENANCE" ? (
                        <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50 -mx-4 px-4 py-3 flex items-center gap-2 text-[11px] text-slate-600">
                          <Wrench className="w-3.5 h-3.5" /> Maintenance — offline
                        </div>
                      ) : (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready for next
                          </div>
                          {nexts.length > 0 ? (
                            <div className="space-y-1">
                              {nexts.map((n) => (
                                <div key={n.id} className="flex items-center justify-between text-[10px]">
                                  <span className="font-mono-yms text-slate-700">{n.ref}</span>
                                  <span className="font-mono-yms text-slate-500">{n.slot}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500">No scheduled slots today</div>
                          )}
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold flex items-center gap-1"><Wrench className="w-3 h-3" /> Equipment</div>
                          <div className="text-slate-900 font-semibold mt-0.5 truncate">{d.equipment}</div>
                        </div>
                        <div>
                          <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold flex items-center gap-1"><Users className="w-3 h-3" /> Labor</div>
                          <div className="text-slate-900 font-semibold mt-0.5 truncate">{d.laborTeam}</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Today</span>
                          <span className="font-mono-yms font-bold text-slate-900">{d.utilizationPct}%</span>
                        </div>
                        <div className="mt-1 h-1 bg-slate-100 rounded-sm overflow-hidden">
                          <div className={`h-full ${d.utilizationPct > 85 ? "bg-red-500" : d.utilizationPct > 65 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${d.utilizationPct}%` }} />
                        </div>
                      </div>
                    </div>
                    </button>
                    <div className="flex items-center justify-end gap-1 px-4 pb-3 border-t border-slate-100">
                      <button type="button" title="View" onClick={() => openDockDetail(d)} className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canWriteDock && (
                      <button type="button" title="Edit" onClick={(ev) => handleEdit(ev, d)} className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      )}
                      {canWriteDock && (
                      <button type="button" title="Delete" onClick={(ev) => handleDelete(ev, d)} className="p-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-md">
                <EmptyState query={search} label="docks" />
              </div>
            )}
          </>
        )}
      </PageContent>
    </>
  );
};

export default Docks;
