import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import StatusPill from "../components/yms/StatusPill";
import KpiCard from "../components/yms/KpiCard";
import ExportMenu from "../components/yms/ExportMenu";
import EmptyState from "../components/yms/EmptyState";
import appointmentsApi, {
  ACTIVE_APPOINTMENT_STATUSES,
  HOURS,
  GATES,
  appointmentCardLabel,
  displayVehiclePlate,
} from "../services/appointmentsApi";
import {
  CalendarClock, Plus, ChevronLeft, ChevronRight, Calendar, Clock,
  Sparkles, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Zap,
} from "lucide-react";
import { useUI } from "../contexts/UIContext";
import { matchesSearch } from "../utils/search";
import { safeDisplayValue } from "../utils/display";
import { BarChart, Bar, XAxis, Cell } from "recharts";
import ChartBox from "../components/common/ChartBox";
import usePermissions from "../hooks/usePermissions";
import { MOD } from "../constants/permissions";

const APPT_FIELDS = [
  "bookingRef", "plate", "transporter", "type", "material", "vehicleType", "priorityLabel",
  "date", "slot", "gate", "dock", "recommendedDock", "status", "backendStatus", "createdBy",
];

const slotToOffset = (slot) => {
  const [h, m] = String(slot).split(":").map(Number);
  return ((h - 7) + m / 60) / HOURS.length;
};
const DURATION = 0.75 / HOURS.length;

const formatDisplayDate = (isoDate) => {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const shiftDate = (isoDate, days) => {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const nowSlotOffset = () => {
  const now = new Date();
  const slot = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return slotToOffset(slot) * 100;
};

const SkeletonKpis = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-md p-4 animate-pulse h-24" />
    ))}
  </div>
);

const Appointments = () => {
  const { openBookSlot, search, openAppointment, openVehicle } = useUI();
  const { canWriteAppointment, can } = usePermissions();
  const includeQueue = can(MOD.QUEUE);
  const includeDocks = can(MOD.DOCKS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hoveredId, setHoveredId] = useState(null);
  const [sortKey, setSortKey] = useState("slot");
  const [sortDir, setSortDir] = useState("asc");

  const loadAppointments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const { rows: loaded } = await appointmentsApi.fetchAppointmentsBundle({
        includeQueue,
        includeDocks,
      });
      setRows(loaded);
    } catch (e) {
      setError(e.message || "Failed to load appointments");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [includeQueue, includeDocks]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    const onYmsChange = () => loadAppointments(true);
    window.addEventListener("yms-data-changed", onYmsChange);
    return () => window.removeEventListener("yms-data-changed", onYmsChange);
  }, [loadAppointments]);

  const onBooked = useCallback(() => loadAppointments(true), [loadAppointments]);

  const openDetail = (row) => {
    openAppointment({
      appointmentId: row.id,
      onUpdated: () => loadAppointments(true),
      openVehicle: (v) => openVehicle(v),
    });
  };

  const filtered = useMemo(() => {
    let list = rows.filter((a) => a.date === selectedDate);
    if (filter === "Loading") list = list.filter((a) => a.type === "Loading");
    if (filter === "Unloading") list = list.filter((a) => a.type === "Unloading");
    if (statusFilter === "delayed") list = list.filter((a) => a.delayed);
    if (statusFilter === "scheduled") list = list.filter((a) => a.backendStatus === "SCHEDULED");
    const activeStatuses = ACTIVE_APPOINTMENT_STATUSES;
    const completedStatuses = ["COMPLETED", "EXITED"];
    if (statusFilter === "active") list = list.filter((a) => activeStatuses.includes(a.backendStatus ?? ""));
    if (statusFilter === "completed") list = list.filter((a) => completedStatuses.includes(a.backendStatus ?? ""));
    if (statusFilter === "cancelled") list = list.filter((a) => a.backendStatus === "CANCELLED");
    list = list.filter((a) => matchesSearch(a, search, APPT_FIELDS));
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      if (sortKey === "slot") return dir * String(av).localeCompare(String(bv));
      return dir * String(av).localeCompare(String(bv));
    });
  }, [rows, filter, statusFilter, search, selectedDate, sortKey, sortDir]);

  const stats = useMemo(() => appointmentsApi.computeKpis(rows, selectedDate), [rows, selectedDate]);
  const hourBuckets = useMemo(() => appointmentsApi.computeHourBuckets(rows, selectedDate), [rows, selectedDate]);
  const slotRecs = useMemo(() => appointmentsApi.buildSlotRecommendations(rows, selectedDate), [rows, selectedDate]);
  const peakHour = hourBuckets.reduce((max, h) => (h.count > max.count ? h : max), { count: 0, hour: "—" });

  const exportRows = filtered.map((a) => ({
    id: a.bookingRef,
    plate: appointmentCardLabel(a),
    transporter: a.transporter,
    type: a.type,
    material: a.material,
    slot: a.slot,
    date: a.date,
    gate: a.gate,
    dock: safeDisplayValue(a.dock, "—"),
    createdBy: a.createdBy,
    status: a.status,
  }));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const typeColor = (type, status) => {
    const dim = status === "COMPLETED" || status === "EXITED" || status === "CANCELLED";
    if (dim) return { bg: "bg-slate-100", text: "text-slate-500", border: "border-slate-300" };
    if (type === "Loading") return { bg: "bg-violet-100", text: "text-violet-900", border: "border-violet-400" };
    return { bg: "bg-cyan-100", text: "text-cyan-900", border: "border-cyan-400" };
  };

  if (loading && rows.length === 0) {
    return (
      <>
        <TopBar title="Appointments" subtitle="Loading schedule…" />
        <div className="p-6 space-y-5">
          <SkeletonKpis />
        </div>
      </>
    );
  }

  if (error && rows.length === 0) {
    return (
      <>
        <TopBar title="Appointments" subtitle="Slot orchestration" />
        <div className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600">{error}</p>
          <button type="button" onClick={() => loadAppointments()} className="mt-3 text-xs font-semibold bg-slate-900 text-white px-3 py-2 rounded-md">
            Retry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Appointments"
        subtitle="Slot orchestration · Live YMS scheduling"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAppointments(true)}
              className="inline-flex items-center gap-1 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <ExportMenu
              testId="appt-export"
              filename={`YARDOS_Appointments_${selectedDate}`}
              title="Appointment Schedule"
              subtitle={`${filter} · ${filtered.length} appointments`}
              columns={["Appointment", "Vehicle", "Transporter", "Type", "Material", "Slot", "Date", "Gate", "Dock", "Created By", "Status"]}
              keys={["id", "plate", "transporter", "type", "material", "slot", "date", "gate", "dock", "createdBy", "status"]}
              rows={exportRows}
              meta={[
                { label: "Date", value: selectedDate },
                { label: "Scheduled", value: String(stats.scheduled) },
                { label: "Loading", value: String(stats.loading) },
                { label: "Filter", value: filter },
              ]}
            />
            {canWriteAppointment && (
            <button
              data-testid="book-appointment-btn"
              onClick={() => openBookSlot({ onBooked, date: selectedDate })}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Book Appointment
            </button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {error && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">{error}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard testId="appt-kpi-total" label="Scheduled" value={stats.scheduled} hint={`${stats.total} on ${selectedDate}`} icon={CalendarClock} />
          <KpiCard testId="appt-kpi-loading" label="Loading" value={stats.loading} hint="loading type" icon={ArrowRight} accent="info" />
          <KpiCard testId="appt-kpi-unloading" label="Unloading" value={stats.unloading} hint="unloading type" icon={ArrowRight} accent="info" />
          <KpiCard testId="appt-kpi-arrived" label="In Progress" value={stats.inProgress} hint="active in yard" icon={Clock} accent="warning" />
          <KpiCard testId="appt-kpi-completed" label="Completed" value={stats.completed} hint="cleared" icon={CheckCircle2} accent="success" />
          <KpiCard testId="appt-kpi-delayed" label="Delayed" value={stats.delayed} hint={peakHour.count > 0 ? `peak ${peakHour.hour}:00` : "—"} icon={AlertTriangle} accent="danger" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-white border border-slate-200 rounded-md overflow-hidden">
            {["All", "Loading", "Unloading"].map((f) => (
              <button
                key={f}
                data-testid={`filter-${f.toLowerCase()}`}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                  filter === f ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[11px] font-semibold border border-slate-200 rounded-md px-2 py-1.5 bg-white"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="active">In progress</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-3 py-1.5">
            <button type="button" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} className="p-0.5 hover:bg-slate-100 rounded">
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[12px] font-semibold text-slate-900 font-mono-yms border-0 outline-none bg-transparent w-36"
            />
            <button type="button" onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} className="p-0.5 hover:bg-slate-100 rounded">
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">{formatDisplayDate(selectedDate)}</span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <SectionCard
            testId="card-gantt"
            title="Gate × Hour Timeline"
            subtitle="Click block to inspect · reschedule in drawer"
            className="xl:col-span-3"
            padding="p-0"
          >
            <div className="relative pl-16 pr-4 pt-3 border-b border-slate-200 bg-slate-50">
              <div className="grid relative" style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(0,1fr))` }}>
                {HOURS.map((h) => (
                  <div key={h} className="text-[10px] font-mono-yms font-bold text-slate-500 px-1">
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>
            </div>

            <div className="pl-0 pr-4 pt-2 pb-3 grid-bg">
              {GATES.map((gate, gIdx) => {
                const gateAppts = filtered.filter((a) => a.gate === gate);
                return (
                  <div key={gate} className="flex items-stretch border-b border-slate-100 last:border-0">
                    <div className="w-16 shrink-0 flex items-center px-3 py-3 border-r border-slate-200">
                      <div>
                        <div className="font-display font-bold text-base text-slate-900 leading-none">{gate}</div>
                        <div className="font-mono-yms text-[10px] text-slate-500 mt-1">{gateAppts.length} appt</div>
                      </div>
                    </div>
                    <div className="flex-1 relative h-16 pr-2">
                      <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(0,1fr))` }}>
                        {HOURS.map((h) => (
                          <div key={h} className="border-r border-slate-100" />
                        ))}
                      </div>
                      {gIdx === 0 && selectedDate === new Date().toISOString().slice(0, 10) && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-500/70 z-20 pointer-events-none"
                          style={{ left: `${nowSlotOffset()}%` }}
                        >
                          <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
                        </div>
                      )}
                      {gateAppts.map((a) => {
                        const left = slotToOffset(a.slot) * 100;
                        const width = DURATION * 100;
                        const c = typeColor(a.type, a.backendStatus);
                        const isHovered = hoveredId === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            data-testid={`gantt-${a.bookingRef}`}
                            onMouseEnter={() => setHoveredId(a.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => openDetail(a)}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            className={`absolute top-2 bottom-2 ${c.bg} ${c.text} border ${c.border} rounded-md px-2 py-1 text-left overflow-hidden hover:shadow-md transition-all z-10 ${
                              isHovered ? "ring-2 ring-slate-900 z-30" : ""
                            } ${a.delayed ? "ring-2 ring-red-500" : ""}`}
                          >
                            <div className="font-mono-yms font-bold text-[11px] leading-none truncate">{appointmentCardLabel(a)}</div>
                            <div className="font-mono-yms text-[9px] opacity-70 mt-1">{a.slot} · {safeDisplayValue(a.dock, "—")}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {hoveredId && (() => {
              const a = filtered.find((x) => x.id === hoveredId);
              if (!a) return null;
              return (
                <div className="px-4 py-2.5 bg-slate-900 text-white text-[11px] flex items-center gap-3 flex-wrap">
                  <span className="font-mono-yms font-bold text-amber-400">{a.bookingRef}</span>
                  <span className="font-mono-yms">{appointmentCardLabel(a)}</span>
                  <span className="text-slate-300">{a.transporter}</span>
                  <span>·</span>
                  <span>{a.type}</span>
                  <span>·</span>
                  <span className="font-mono-yms">{a.slot} @ {a.gate}/{safeDisplayValue(a.dock, "—")}</span>
                  <span className="ml-auto"><StatusPill status={a.status} /></span>
                </div>
              );
            })()}
          </SectionCard>

          <div className="xl:col-span-1 space-y-4">
            <SectionCard
              testId="card-ai-slots"
              title={<span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-500" /> Rule-Based Slot Recommendations</span>}
              subtitle="Live heuristics · not AI"
            >
              <div className="space-y-2.5">
                {slotRecs.map((t, i) => (
                  <div key={i} className={`border-l-2 ${t.sev === "success" ? "border-l-emerald-500 bg-emerald-50/40" : t.sev === "danger" ? "border-l-red-500 bg-red-50/40" : "border-l-amber-500 bg-amber-50/40"} pl-2.5 py-1.5`}>
                    <div className="text-[12px] font-semibold text-slate-900 leading-snug">{t.msg}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      {t.saved > 0 && (
                        <span className="font-mono-yms font-bold text-emerald-700 inline-flex items-center gap-0.5">
                          <Zap className="w-3 h-3" /> ₹{(t.saved / 1000).toFixed(1)}K est.
                        </span>
                      )}
                      <span className="font-mono-yms text-slate-500">{t.conf}% conf</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard testId="card-hour-dist" title="Hour Distribution" subtitle="Bookings per hour">
              {hourBuckets.every((b) => b.count === 0) ? (
                  <div className="h-32 flex items-center justify-center text-sm text-slate-500">No bookings this day</div>
                ) : (
                  <ChartBox height={128}>
                    <BarChart data={hourBuckets}>
                      <XAxis dataKey="hour" stroke="#64748B" fontSize={9} tickLine={false} axisLine={false} />
                      <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                        {hourBuckets.map((b, i) => (
                          <Cell key={i} fill={b.count >= 4 ? "#DC2626" : b.count >= 2 ? "#D97706" : "#0F172A"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartBox>
                )}
              <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
                <span>Peak: <span className="font-mono-yms font-bold text-red-600">{peakHour.hour}:00</span></span>
              </div>
            </SectionCard>
          </div>
        </div>

        <SectionCard testId="card-appointment-list" title="All Appointments" subtitle={`${filtered.length} on ${selectedDate}`} padding="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                  {[
                    ["bookingRef", "Appointment"],
                    ["plate", "Vehicle"],
                    ["vehicleType", "Vehicle Type"],
                    ["priorityLabel", "Priority"],
                    ["date", "Date"],
                    ["slot", "Time Slot"],
                    ["type", "Type"],
                    ["material", "Material"],
                    ["recommendedDock", "Rec. Dock"],
                    ["status", "Status"],
                  ].map(([key, label]) => (
                    <th key={key} className="text-left font-semibold px-4 py-2.5 cursor-pointer hover:text-slate-900" onClick={() => toggleSort(key)}>
                      {label} {sortKey === key ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    data-testid={`appt-row-${a.bookingRef}`}
                    onClick={() => openDetail(a)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-mono-yms font-semibold text-slate-900">{a.bookingRef}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-700">{displayVehiclePlate(a)}</td>
                    <td className="px-2 py-2.5 text-slate-700">{a.vehicleType}</td>
                    <td className="px-2 py-2.5">
                      <span className={`text-[10px] font-bold uppercase ${a.priorityLabel === "Urgent" ? "text-red-600" : a.priorityLabel === "High" ? "text-amber-600" : "text-slate-600"}`}>
                        {a.priorityLabel}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-700">{a.date}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-900 font-semibold">{a.slot}</td>
                    <td className="px-2 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold uppercase ${a.type === "Loading" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-cyan-50 text-cyan-700 border border-cyan-200"}`}>{a.type}</span>
                    </td>
                    <td className="px-2 py-2.5 text-slate-700">{a.material}</td>
                    <td className="px-2 py-2.5 font-mono-yms text-slate-600">{safeDisplayValue(a.recommendedDock, "—")}</td>
                    <td className="px-2 py-2.5"><StatusPill status={a.backendStatus || a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState query={search || selectedDate} label="appointments" />}
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default Appointments;
