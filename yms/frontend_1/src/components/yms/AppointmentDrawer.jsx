import React, { useCallback, useEffect, useState } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  CalendarClock, MapPin, Ban, RefreshCw, CheckCircle2, LogIn, Loader2, History,
} from "lucide-react";
import appointmentsApi, {
  slotFromReportingTime,
  dateFromReportingTime,
  GATES,
  VEHICLE_CATEGORIES,
  fetchAppointmentHistory,
  buildLifecycleTimeline,
  filterAuditHistory,
  appointmentCardLabel,
} from "../../services/appointmentsApi";
import { fetchResourceReadiness } from "../../services/docksApi";
import { safeDisplayValue } from "../../utils/display";
import ymsApi from "../../services/ymsApi";
import ResourceReadinessPanel from "./ResourceReadinessPanel";
import YmsDrawerTopBar from "./YmsDrawerTopBar";
import YmsDrawerBody, { YMS_DRAWER_LOADING_CLASS } from "./YmsDrawerBody";
import usePermissions from "../../hooks/usePermissions";

const SLOTS = Array.from({ length: 24 }, (_, i) => `${String(7 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`).filter((s) => parseInt(s) < 20);

const Section = ({ title, children }) => (
  <div className="border border-slate-200 rounded-md overflow-hidden">
    <div className="bg-slate-50 px-3 py-2 text-[10px] uppercase tracking-widest font-bold text-slate-500 border-b border-slate-200">
      {title}
    </div>
    <div className="p-3 text-[12px] space-y-1.5">{children}</div>
  </div>
);

const Row = ({ label, value, mono }) => (
  <div className="flex gap-2">
    <span className="text-slate-500 w-28 shrink-0">{label}</span>
    <span className={`font-semibold text-slate-900 ${mono ? "font-mono-yms" : ""}`}>{value}</span>
  </div>
);

const formatTs = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const categoryLabel = (v) => VEHICLE_CATEGORIES.find((c) => c.value === v)?.label || safeDisplayValue(v, "—");

export const AppointmentDrawer = () => {
  const { appointment, closeAppointment } = useUI();
  const { canWriteAppointment, canStartLoading, canCompleteLoading } = usePermissions();
  const open = !!appointment;
  const [row, setRow] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reschedule, setReschedule] = useState({ date: "", slot: "09:00", gate: "G1" });
  const [lifecycle, setLifecycle] = useState([]);
  const [auditHistory, setAuditHistory] = useState([]);

  const refresh = useCallback(async () => {
    if (!appointment?.appointmentId) return;
    setLoading(true);
    try {
      const appt = await ymsApi.getAppointment(appointment.appointmentId);
      const vehicle = appt.vehicle_id ? await ymsApi.getVehicle(appt.vehicle_id) : null;
      let queue = null;
      let dock = null;
      let allDocks = [];
      try {
        const [queues, docks] = await Promise.all([ymsApi.listQueueEntries(), ymsApi.listDocks()]);
        allDocks = docks;
        queue = queues.find((q) => q.appointment_id === appt.id) || null;
        if (queue?.dock_id) dock = await ymsApi.getDock(queue.dock_id);
      } catch {
        /* optional */
      }
      const mapped = appointmentsApi.mapAppointmentRow(appt, vehicle, queue, dock, allDocks);
      setRow(mapped);

      const events = await fetchAppointmentHistory(appt.id, appt.vehicle_id);
      setLifecycle(
        buildLifecycleTimeline(
          appt,
          events,
          appointmentsApi.resolveOperationalStatus(appt, vehicle)
        )
      );
      setAuditHistory(filterAuditHistory(events));

      if (
        mapped.vehicleId &&
        ["DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING"].includes(mapped.backendStatus)
      ) {
        setReadiness(await fetchResourceReadiness(mapped.vehicleId));
      } else {
        setReadiness(null);
      }
      setReschedule({
        date: appt.booking_date || dateFromReportingTime(appt.reporting_time),
        slot: appt.scheduled_slot || slotFromReportingTime(appt.reporting_time),
        gate: appt.gate_number || "G1",
      });
    } catch (e) {
      toast.error(e.message || "Failed to load appointment");
    } finally {
      setLoading(false);
    }
  }, [appointment?.appointmentId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useYmsSyncRefresh(refresh, open);

  const afterAction = async () => {
    await refresh();
    await appointment?.onUpdated?.();
  };

  const run = async (fn, successMsg) => {
    setWorking(true);
    try {
      await fn();
      toast.success(successMsg);
      await afterAction();
    } catch (e) {
      toast.error(e.message || "Action failed");
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  const canCancel = row && !["CANCELLED", "EXITED", "COMPLETED"].includes(row.backendStatus);
  const canArrive = row?.backendStatus === "SCHEDULED";
  const showInProgress =
    row &&
    row.vehicleId &&
    ["DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING"].includes(row.backendStatus);
  const canInProgress = showInProgress && readiness?.ready === true;
  const canComplete = row?.backendStatus === "LOADING";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
      <SheetContent data-testid="appointment-drawer" hideClose className="w-full sm:max-w-md overflow-y-auto max-h-[100dvh] flex flex-col p-0">
        <YmsDrawerTopBar>
          <SheetHeader className="p-0 text-left space-y-1">
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              {row?.bookingRef || "Appointment"}
            </SheetTitle>
          </SheetHeader>
        </YmsDrawerTopBar>

        {loading && !row ? (
          <div className={YMS_DRAWER_LOADING_CLASS}>Loading…</div>
        ) : row ? (
          <YmsDrawerBody>
            <div className="flex items-center justify-between">
              <StatusPill status={row.status} />
              <span className="font-mono-yms text-[11px] text-slate-500">{row.type}</span>
            </div>

            <Section title="Appointment Information">
              <Row label="Appointment" value={row.bookingRef} mono />
              <Row label="Status" value={row.backendStatus || row.status} />
              <Row label="Request Type" value={row.type} />
              <Row label="Priority" value={row.priorityLabel} />
              <Row label="Created By" value={safeDisplayValue(row.createdBy, "—")} />
              <Row label="Created At" value={formatTs(row.createdAt) || "—"} />
            </Section>

            <Section title="Cargo Information">
              <Row label="Material" value={safeDisplayValue(row.material, "—")} />
              <Row label="Vehicle Type" value={safeDisplayValue(row.vehicleType, "—")} />
              <Row label="Quantity" value={safeDisplayValue(row.quantity, "—")} />
              <Row label="Weight" value={row.weight !== "—" ? `${row.weight} kg` : "—"} />
              <Row label="Volume" value={row.volume !== "—" ? `${row.volume} m³` : "—"} />
              <Row label="Category" value={categoryLabel(row.ownershipType)} />
              <Row label="Transporter" value={safeDisplayValue(row.transporter, "—")} />
              <Row label="Vehicle Plate" value={appointmentCardLabel(row)} mono />
            </Section>

            <Section title="Schedule Information">
              <Row label="Date" value={row.date} mono />
              <Row label="Time Slot" value={row.slot} mono />
              <Row label="Duration" value={`${row.durationMin} min`} />
              <Row label="Expected Completion" value={row.expectedCompletion} mono />
              <Row label="Rec. Dock" value={safeDisplayValue(row.recommendedDock, "—")} mono />
              <Row label="Rec. Gate" value={row.recommendedGate || row.gate} mono />
              <Row label="Rec. Zone" value={safeDisplayValue(row.recommendedZone, "—")} />
              {row.dock !== "—" && <Row label="Assigned Dock" value={safeDisplayValue(row.dock)} mono />}
            </Section>

            <Section title="Lifecycle Timeline">
              <div className="space-y-2">
                {lifecycle.map((step) => (
                  <div key={step.step} className="flex items-start gap-2">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        step.state === "current"
                          ? "bg-amber-500 ring-2 ring-amber-200"
                          : step.state === "done"
                            ? "bg-emerald-500"
                            : "bg-slate-200"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[11px] font-semibold ${
                          step.state === "current" ? "text-amber-700" : step.state === "done" ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {step.step}
                      </div>
                      {step.timestamp && (
                        <div className="text-[10px] font-mono-yms text-slate-500">{formatTs(step.timestamp)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {auditHistory.length > 0 && (
              <Section title="Audit History">
                <div className="space-y-2">
                  {auditHistory.map((ev) => (
                    <div key={ev.id || `${ev.event_type}-${ev.event_time}`} className="border-b border-slate-100 pb-2 last:border-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
                        <History className="w-3 h-3 text-slate-400" />
                        {ev.event_type}
                      </div>
                      {ev.event_note && <div className="text-[10px] text-slate-600 mt-0.5">{ev.event_note}</div>}
                      <div className="text-[10px] font-mono-yms text-slate-400 mt-0.5">{formatTs(ev.event_time)}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {showInProgress && <ResourceReadinessPanel readiness={readiness} />}

            {rescheduleOpen ? (
              <div className="border border-slate-200 rounded-md p-3 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-500">Reschedule</div>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  value={reschedule.date}
                  onChange={(e) => setReschedule((r) => ({ ...r, date: e.target.value }))}
                />
                <select
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm font-mono-yms"
                  value={reschedule.slot}
                  onChange={(e) => setReschedule((r) => ({ ...r, slot: e.target.value }))}
                >
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm"
                  value={reschedule.gate}
                  onChange={(e) => setReschedule((r) => ({ ...r, gate: e.target.value }))}
                >
                  {GATES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={working}
                    onClick={() =>
                      run(
                        () => appointmentsApi.rescheduleAppointment(row.id, reschedule),
                        "Appointment rescheduled"
                      )
                    }
                    className="flex-1 bg-slate-900 text-white text-xs font-semibold py-2 rounded-md"
                  >
                    Save
                  </button>
                  <button type="button" onClick={() => setRescheduleOpen(false)} className="px-3 text-xs text-slate-600">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {canArrive && (
                  <button
                    type="button"
                    disabled={working}
                    data-testid="appt-mark-arrived"
                    onClick={() =>
                      run(
                        () =>
                          appointmentsApi.markAppointmentArrived(row.id, row.vehicleId, {
                            reqType: row.type,
                          }),
                        "Marked as arrived — vehicle checked in to queue"
                      )
                    }
                    className="inline-flex items-center justify-center gap-1 border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-semibold py-2 rounded-md"
                  >
                    <LogIn className="w-3 h-3" /> Arrived
                  </button>
                )}
                {showInProgress && canStartLoading && (
                  <button
                    type="button"
                    disabled={working || !canInProgress}
                    title={
                      !canInProgress && readiness?.missing?.length
                        ? `Cannot start — missing: ${readiness.missing.join(", ")}`
                        : undefined
                    }
                    onClick={() => run(() => appointmentsApi.markAppointmentInProgress(row.vehicleId), "Loading started")}
                    className={`inline-flex items-center justify-center gap-1 border text-[11px] font-semibold py-2 rounded-md ${
                      canInProgress
                        ? "border-violet-300 bg-violet-50 text-violet-800"
                        : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    <Loader2 className="w-3 h-3" /> Start Loading
                  </button>
                )}
                {canComplete && canCompleteLoading && (
                  <button
                    type="button"
                    disabled={working}
                    onClick={() => run(() => appointmentsApi.markAppointmentCompleted(row.vehicleId), "Completed")}
                    className="inline-flex items-center justify-center gap-1 border border-slate-300 bg-slate-50 text-slate-800 text-[11px] font-semibold py-2 rounded-md"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Complete
                  </button>
                )}
                <button
                  type="button"
                  disabled={working || !canCancel || !canWriteAppointment}
                  onClick={() => setRescheduleOpen(true)}
                  className="inline-flex items-center justify-center gap-1 border border-slate-300 text-slate-700 text-[11px] font-semibold py-2 rounded-md"
                >
                  <RefreshCw className="w-3 h-3" /> Reschedule
                </button>
                {canCancel && canWriteAppointment && (
                  <button
                    type="button"
                    disabled={working}
                    data-testid="appt-cancel"
                    onClick={() =>
                      run(() => appointmentsApi.cancelAppointment(row.id, row.vehicleId), "Appointment cancelled")
                    }
                    className="inline-flex items-center justify-center gap-1 border border-red-300 bg-red-50 text-red-700 text-[11px] font-semibold py-2 rounded-md col-span-2"
                  >
                    <Ban className="w-3 h-3" /> Cancel Appointment
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              className="w-full text-[11px] text-slate-500 flex items-center justify-center gap-1"
              onClick={() => {
                closeAppointment();
                appointment?.openVehicle?.({
                  appointmentId: row.id,
                  vehicleId: row.vehicleId,
                  onQueueUpdated: appointment?.onUpdated,
                });
              }}
            >
              <MapPin className="w-3 h-3" /> Open vehicle / queue view
            </button>
          </YmsDrawerBody>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

export default AppointmentDrawer;
