import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TopBar from "../components/yms/TopBar";
import SectionCard from "../components/yms/SectionCard";
import ReportDateFilters from "../components/yms/ReportDateFilters";
import ReportExportMenu from "../components/yms/ReportExportMenu";
import reportsApi, { formatTimeLabel } from "../services/reportsApi";
import { exportCSV } from "../utils/exporters";
import { Search, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const VehicleJourneyAnalytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicleNumber, setVehicleNumber] = useState(searchParams.get("vehicleNumber") || "");
  const [appointmentRef, setAppointmentRef] = useState(searchParams.get("appointmentRef") || "");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const vehicleId = searchParams.get("vehicleId");
    if (!vehicleId && !vehicleNumber.trim() && !appointmentRef.trim()) {
      setReport(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await reportsApi.fetchVehicleJourneyReport({
        vehicleId: vehicleId || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        appointmentRef: appointmentRef.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReport(data);
    } catch (e) {
      setError(e.message || "Failed to load journey report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams, vehicleNumber, appointmentRef, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    if (vehicleNumber.trim()) next.set("vehicleNumber", vehicleNumber.trim());
    if (appointmentRef.trim()) next.set("appointmentRef", appointmentRef.trim());
    if (dateFrom) next.set("dateFrom", dateFrom);
    if (dateTo) next.set("dateTo", dateTo);
    setSearchParams(next);
  };

  const summary = report?.summary;
  const metrics = report?.metrics;
  const sla = metrics?.sla;

  const timelineExport = () => {
    if (!report?.timeline?.length) return;
    exportCSV(
      "vehicle-journey-timeline",
      ["Event", "Time", "User", "Notes"],
      ["eventType", "timestamp", "user", "notes"],
      report.timeline.map((t) => ({
        ...t,
        timestamp: formatTimeLabel(t.timestamp),
      }))
    );
  };

  return (
    <>
      <TopBar
        title="Vehicle Journey Analytics"
        subtitle="Complete historical visibility for a yard visit"
        actions={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1.5 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      />
      <div className="p-6 space-y-5">
        <SectionCard title="Search" subtitle="Vehicle number, appointment, or date range">
          <form onSubmit={onSearch} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="border border-slate-300 rounded-md px-3 py-2 text-[12px]"
                placeholder="Vehicle number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
              <input
                className="border border-slate-300 rounded-md px-3 py-2 text-[12px]"
                placeholder="Appointment number"
                value={appointmentRef}
                onChange={(e) => setAppointmentRef(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-md"
              >
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </div>
            <ReportDateFilters
              dateFrom={dateFrom}
              dateTo={dateTo}
              onChange={({ dateFrom: f, dateTo: t }) => {
                setDateFrom(f);
                setDateTo(t);
              }}
            />
          </form>
        </SectionCard>

        {error && (
          <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
        )}
        {loading && <div className="text-sm text-slate-500">Loading journey…</div>}

        {report && (
          <>
            <SectionCard title="Vehicle Summary" testId="journey-summary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                <div><span className="text-slate-500">Vehicle</span><div className="font-mono-yms font-bold">{summary?.vehicleNumber}</div></div>
                <div><span className="text-slate-500">Appointment</span><div className="font-mono-yms">{summary?.appointmentRef || "—"}</div></div>
                <div><span className="text-slate-500">Transporter</span><div>{summary?.transporter || "—"}</div></div>
                <div><span className="text-slate-500">Driver</span><div>{summary?.driver || "—"}</div></div>
                <div><span className="text-slate-500">Dock</span><div className="font-mono-yms font-bold">{summary?.dockCode || "—"}</div></div>
                <div><span className="text-slate-500">Operation</span><div>{summary?.operationType || "—"}</div></div>
                <div><span className="text-slate-500">Material</span><div>{summary?.material || "—"}</div></div>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard
                title="Timeline"
                subtitle="Chronological yard events"
                actions={
                  <button type="button" onClick={timelineExport} className="text-[10px] font-semibold border border-slate-200 px-2 py-1 rounded-md">
                    Export CSV
                  </button>
                }
                padding="p-4"
              >
                <div className="space-y-0" data-testid="journey-timeline">
                  {report.timeline.map((item, i) => (
                    <div key={`${item.eventType}-${item.timestamp}-${i}`} className="flex gap-3 pb-4 relative">
                      <div className="w-14 shrink-0 font-mono-yms text-[11px] text-slate-600 pt-0.5">
                        {formatTimeLabel(item.timestamp)}
                      </div>
                      <div className="w-2 shrink-0 flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-900 mt-1" />
                        {i < report.timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 text-[12px]">{item.eventType}</div>
                        {item.notes && <div className="text-[10px] text-slate-500 truncate">{item.notes}</div>}
                        <div className="text-[10px] text-slate-400">{item.user}</div>
                      </div>
                    </div>
                  ))}
                  {report.timeline.length === 0 && (
                    <div className="text-[11px] text-slate-500">No timeline events in range</div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Metrics" subtitle="Durations and SLA" padding="p-4">
                <div className="grid grid-cols-2 gap-3 text-[12px]" data-testid="journey-metrics">
                  {[
                    ["Waiting Time", metrics?.waitingMinutes],
                    ["Called Duration", metrics?.calledMinutes],
                    ["Dock Assignment", metrics?.dockAssignmentMinutes],
                    ["Loading Time", metrics?.loadingMinutes],
                    ["Paused Time", metrics?.pausedMinutes],
                    ["Exit Holding", metrics?.exitHoldingMinutes],
                    ["Turnaround", metrics?.turnaroundMinutes],
                    ["Exceptions", metrics?.exceptionCount],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-slate-50 border border-slate-100 rounded-md p-3">
                      <div className="text-[10px] uppercase text-slate-500 font-semibold">{label}</div>
                      <div className="font-mono-yms font-bold text-lg text-slate-900">
                        {val != null ? `${val} min` : "—"}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="text-[10px] uppercase text-slate-500 font-semibold mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> SLA Result
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Waiting", sla?.waitingSlaMet],
                      ["Loading", sla?.loadingSlaMet],
                      ["Turnaround", sla?.turnaroundSlaMet],
                    ].map(([label, met]) => (
                      <span
                        key={label}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-bold uppercase ${
                          met === true
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : met === false
                              ? "text-red-700 bg-red-50 border-red-200"
                              : "text-slate-500 bg-slate-50 border-slate-200"
                        }`}
                      >
                        {met === true ? <CheckCircle2 className="w-3 h-3" /> : met === false ? <XCircle className="w-3 h-3" /> : null}
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                {report.exceptions?.length > 0 && (
                  <div className="mt-4 text-[11px]">
                    <div className="font-semibold text-amber-800 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Exceptions ({report.exceptions.length})
                    </div>
                    {report.exceptions.slice(0, 5).map((ex) => (
                      <div key={ex.id} className="text-slate-700">
                        {ex.exception_type} · {ex.status}
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default VehicleJourneyAnalytics;
