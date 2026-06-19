import React, { useCallback, useEffect, useMemo, useState } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import ResourceReadinessPanel from "./ResourceReadinessPanel";
import { toast } from "sonner";
import {
  Truck, MapPin, Package, DoorOpen, Warehouse,
  Radio, CheckCircle2, Circle, AlertTriangle, History, Users, Wrench,
  ClipboardList, Gauge, CalendarClock,
} from "lucide-react";
import ymsApi from "../../services/ymsApi";
import queueApi from "../../services/queueApi";
import vehiclesApi, {
  JOURNEY_STEPS,
  buildTimelineTimes,
  formatVehicleType,
  formatCategory,
  deriveStageKey,
  resolveJourneyZoneLabel,
} from "../../services/vehiclesApi";
import { lifecycleDisplayLabel } from "../../constants/lifecycleStatuses";

const InfoRow = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />} {label}
    </span>
    <span className={`text-[12.5px] font-semibold text-slate-900 text-right max-w-[55%] truncate ${mono ? "font-mono-yms" : ""}`}>
      {value ?? "—"}
    </span>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-3 border-b border-slate-200">
    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2 flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />} {title}
    </div>
    {children}
  </div>
);

const ReadyBadge = ({ ready }) => (
  <span
    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
      ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
    }`}
  >
    {ready ? "READY" : "NOT READY"}
  </span>
);

const OptionalBadge = ({ assigned }) => (
  <span
    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
      assigned ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
    }`}
  >
    {assigned ? "ASSIGNED" : "OPTIONAL"}
  </span>
);

const formatDateTime = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const VehicleDrawer = () => {
  const { vehicle, closeVehicle } = useUI();
  const open = !!vehicle;

  const [journey, setJourney] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const vehicleId = vehicle?.vehicleId || vehicle?.id || journey?.vehicle?.id;

  const loadDetails = useCallback(async () => {
    if (!vehicleId && !vehicle?.queueEntryId && !vehicle?.appointmentId) return;
    setLoading(true);
    setMetrics(null);
    try {
      let data = null;
      let resolvedVehicleId = vehicleId;

      if (!resolvedVehicleId && vehicle?.appointmentId) {
        try {
          const appt = await ymsApi.getAppointment(vehicle.appointmentId);
          resolvedVehicleId = appt?.vehicle_id || null;
        } catch {
          resolvedVehicleId = null;
        }
      }

      if (resolvedVehicleId) {
        try {
          data = await vehiclesApi.getVehicleJourney(resolvedVehicleId);
        } catch {
          data = null;
        }
      }

      if (vehicle?.queueEntryId) {
        try {
          const bundle = await queueApi.getQueueEntryDetail(vehicle.queueEntryId);
          setMetrics(bundle?.metrics || null);
          if (!data && bundle?.vehicle?.id) {
            data = await vehiclesApi.getVehicleJourney(bundle.vehicle.id);
          } else if (!data) {
            data = {
              vehicle: bundle?.vehicle,
              appointment: bundle?.appointment,
              queue_entry: bundle?.entry,
              dock: bundle?.dock,
              labor: bundle?.labor,
              equipment: bundle?.equipment,
              readiness: bundle?.readiness,
              events: [],
              current_stage: bundle?.metrics?.displayStatus,
              queue_status: bundle?.entry?.status,
            };
          }
        } catch {
          /* bundle optional */
        }
      }

      setJourney(data);
    } catch (e) {
      toast.error(e.message || "Failed to load vehicle journey");
    } finally {
      setLoading(false);
    }
  }, [vehicleId, vehicle?.queueEntryId, vehicle?.appointmentId]);

  useEffect(() => {
    if (open) {
      setShowAudit(false);
      setJourney(null);
      setMetrics(null);
      loadDetails();
    }
  }, [open, loadDetails]);

  useYmsSyncRefresh(loadDetails, open);

  const v = journey?.vehicle || vehicle?.rowSnapshot?.raw || vehicle;
  const appt = journey?.appointment;
  const queue = journey?.queue_entry;
  const dock = journey?.dock;
  const labor = journey?.labor;
  const equipment = journey?.equipment;
  const readiness = journey?.readiness;
  const events = useMemo(() => journey?.events || [], [journey?.events]);
  const loadingInfo = journey?.loading;
  const loadingOp = journey?.loadingOp;

  const plate = v?.vehicle_number || v?.plate || "—";
  const reference = v?.vehicle_reference || vehicle?.rowSnapshot?.reference || "—";
  const statusKey = v?.status || metrics?.vehicleStatus || "SCHEDULED";
  const stageKey = journey?.stageKey || deriveStageKey(v, appt) ||
    (statusKey === "SCHEDULED" ? "SCHEDULED" : statusKey);
  const currentStage = journey?.current_stage || lifecycleDisplayLabel(stageKey) || stageKey;

  const lifecycleIndexMap = Object.fromEntries(JOURNEY_STEPS.map((s, i) => [s.key, i]));
  lifecycleIndexMap.CANCELLED = JOURNEY_STEPS.length - 1;
  const currentIdx = lifecycleIndexMap[stageKey] ?? lifecycleIndexMap[statusKey] ?? 0;

  const timelineTimes = useMemo(() => buildTimelineTimes(events, statusKey), [events, statusKey]);

  const auditEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.event_time) - new Date(a.event_time)),
    [events]
  );

  const dockCode = dock?.dock_code || readiness?.dockCode || "—";
  const queueNo = queue?.queue_number || metrics?.queueNumber || "—";
  const laborLabel = labor?.team_name || readiness?.teamName || "—";
  const equipLabel = equipment?.equipment_name || readiness?.equipmentName || "—";
  const zoneLabel = resolveJourneyZoneLabel(journey);

  const dockReady = readiness?.dockAssigned ?? !!dock?.id;
  const laborReady = readiness?.laborAssigned ?? !!labor?.id;
  const equipAssigned = readiness?.equipmentAssigned ?? !!equipment?.id;
  const opsReady = readiness?.ready ?? (dockReady && laborReady);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeVehicle()}>
      <SheetContent
        data-testid="vehicle-drawer"
        side="right"
        className="w-full sm:max-w-md p-0 overflow-y-auto thin-scroll bg-white border-l border-slate-200 max-h-[100dvh] flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Vehicle {plate}</SheetTitle>
        </SheetHeader>

        <div className="bg-slate-900 text-white px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-400 rounded-md flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono-yms text-[20px] font-bold leading-none tracking-tight">{plate}</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-400 mt-1">
                {reference} · {formatVehicleType(v?.vehicle_type)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <StatusPill status={currentStage} />
            <StatusPill status={statusKey} />
            {zoneLabel !== "—" && (
              <span className="text-[10px] font-semibold text-slate-300">{zoneLabel}</span>
            )}
            {vehicleId && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-slate-400">
                <Radio className="w-3 h-3 text-emerald-400 pulse-dot" /> Monitor
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="px-5 py-2 text-[11px] text-slate-500 border-b border-slate-100">Loading journey…</div>
        )}

        {/* 1 — Operational Summary */}
        <Section title="Operational Summary" icon={Gauge}>
          <InfoRow label="Current Status" value={lifecycleDisplayLabel(statusKey)} />
          <InfoRow label="Current Stage" value={currentStage} />
          <InfoRow icon={MapPin} label="Current Zone" value={zoneLabel} mono />
          <InfoRow icon={Warehouse} label="Assigned Dock" value={dockCode} mono />
          <InfoRow icon={CalendarClock} label="Appointment" value={appt?.booking_reference} mono />
          <InfoRow label="Queue Entry" value={queueNo !== "—" ? `#${queueNo}` : "—"} mono />
          <InfoRow label="Queue Status" value={journey?.queue_status || queue?.status || "—"} />
        </Section>

        {/* Vehicle identity (external source readiness) */}
        <Section title="Vehicle Details" icon={ClipboardList}>
          <InfoRow label="Vehicle Reference" value={reference} mono />
          <InfoRow label="Vehicle Type" value={formatVehicleType(v?.vehicle_type)} />
          <InfoRow label="Category" value={formatCategory(v?.ownership_type)} />
          <InfoRow label="Transporter" value={v?.transporter_name || v?.transporter} />
          <InfoRow label="Material" value={v?.material_type || appt?.shipment_reference?.split("|")?.[1]} />
          <InfoRow label="Driver" value={v?.driver_name || v?.driver} />
          <InfoRow label="Mobile" value={v?.driver_phone || v?.driverPhone} mono />
          {appt && (
            <>
              <InfoRow label="Customer" value={appt.customer_name} />
              <InfoRow label="Scheduled Slot" value={appt.scheduled_slot} mono />
              <InfoRow label="Gate" value={appt.gate_number} mono />
              <InfoRow label="Reporting Time" value={formatDateTime(appt.reporting_time)} mono />
            </>
          )}
        </Section>

        {/* 2 — Resource Assignment */}
        <Section title="Resource Assignment" icon={DoorOpen}>
          <InfoRow icon={Warehouse} label="Dock" value={dockCode} mono />
          <InfoRow icon={Users} label="Labor Team" value={laborLabel} />
          <InfoRow icon={Wrench} label="Equipment" value={equipLabel} />
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-600">Dock Assigned</span>
              <ReadyBadge ready={dockReady} />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-600">Labor Assigned</span>
              <ReadyBadge ready={laborReady} />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-600">Equipment Assigned (Optional)</span>
              <OptionalBadge assigned={equipAssigned} />
            </div>
            <div className="flex items-center justify-between text-[12px] pt-1 border-t border-slate-100">
              <span className="text-slate-700 font-semibold">Overall Readiness</span>
              <ReadyBadge ready={opsReady} />
            </div>
          </div>
          {readiness && (
            <div className="mt-3">
              <ResourceReadinessPanel readiness={readiness} />
            </div>
          )}
          {metrics?.queueRank != null && (
            <div className="mt-3 pt-2 border-t border-slate-100">
              <InfoRow label="Queue Rank" value={`#${metrics.queueRank}`} mono />
              <InfoRow label="Priority Score" value={metrics.priorityScore ?? "—"} mono />
              <InfoRow label="Waiting Time" value={`${metrics.waitingMin ?? 0} min`} mono />
            </div>
          )}
        </Section>

        {/* Loading visibility (read-only) */}
        {(loadingInfo || loadingOp || statusKey === "LOADING" || statusKey === "READY_FOR_LOADING") && (
          <Section title="Loading Status" icon={Package}>
            <InfoRow label="Loading Job" value={loadingInfo?.jobRef || queueNo} mono />
            <InfoRow label="Operation" value={loadingInfo?.operationType || loadingOp?.operationType} />
            <InfoRow
              label="Progress"
              value={loadingOp ? `${loadingOp.progressPct}%` : loadingInfo?.progressPct != null ? `${loadingInfo.progressPct}%` : "—"}
              mono
            />
            <InfoRow label="Started" value={formatDateTime(loadingInfo?.startedAt || loadingOp?.startedAt)} mono />
            <InfoRow label="Completed" value={formatDateTime(loadingInfo?.completedAt)} mono />
            {loadingOp?.paused && (
              <>
                <InfoRow label="Pause Reason" value={loadingOp.pauseReason} />
                <InfoRow label="Paused Duration" value={`${loadingOp.pausedDurationMin ?? 0} min`} mono />
              </>
            )}
            {loadingOp?.exceptions?.length > 0 && (
              <div className="mt-2 text-[11px] space-y-1">
                <div className="font-semibold text-amber-800">Active Exceptions</div>
                {loadingOp.exceptions.map((ex) => (
                  <div key={ex.id} className="text-slate-700">
                    {ex.typeLabel} · {ex.status}{ex.assignedTo ? ` · ${ex.assignedTo}` : ""}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* 3 — Journey Timeline */}
        <Section title="Journey Timeline" icon={MapPin}>
          <div className="relative max-h-[240px] overflow-y-auto thin-scroll">
            {JOURNEY_STEPS.map((step, i, arr) => {
              const isCurrent = step.key === stageKey || (step.key === statusKey && stageKey === "SCHEDULED");
              const isPast = currentIdx >= 0 && i < currentIdx;
              const isFuture = currentIdx >= 0 && i > currentIdx;
              const Icon = isCurrent ? AlertTriangle : isPast ? CheckCircle2 : Circle;
              const color = isCurrent ? "text-amber-600" : isPast ? "text-emerald-600" : "text-slate-300";
              return (
                <div key={step.key} className="flex gap-3 pb-2 last:pb-0 relative">
                  {i < arr.length - 1 && (
                    <div className={`absolute left-[7px] top-4 bottom-0 w-px ${isPast ? "bg-emerald-300" : "bg-slate-200"}`} />
                  )}
                  <div className={`relative z-10 shrink-0 ${color}`}>
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? "fill-amber-100" : isPast ? "fill-emerald-50" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <div className={`text-[12px] font-semibold ${isCurrent ? "text-slate-900" : isFuture ? "text-slate-400" : "text-slate-700"}`}>
                      {step.label}
                      {isCurrent && (
                        <span className="ml-1 px-1 py-0.5 text-[8px] uppercase font-bold bg-amber-100 text-amber-800 rounded-sm">Now</span>
                      )}
                    </div>
                    <div className={`font-mono-yms text-[10px] mt-0.5 ${isFuture ? "text-slate-300" : "text-slate-500"}`}>
                      {timelineTimes[step.key]
                        ? formatDateTime(timelineTimes[step.key])
                        : isFuture ? "Pending" : "—"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 4 — Audit History */}
        <Section title="Audit History" icon={History}>
          <button
            type="button"
            onClick={() => setShowAudit((s) => !s)}
            className="w-full text-[10px] font-bold uppercase tracking-wider border border-slate-200 rounded-md py-1.5 hover:bg-slate-50 mb-2"
          >
            {showAudit ? "Hide Events" : `Show Events (${auditEvents.length})`}
          </button>
          {showAudit && (
            <div className="max-h-[180px] overflow-y-auto thin-scroll border border-slate-100 rounded-md">
              {auditEvents.length === 0 && (
                <div className="px-2 py-3 text-[11px] text-slate-400 text-center">No yard events yet</div>
              )}
              {auditEvents.map((ev) => {
                const isOpsAudit =
                  (ev.event_type || "").startsWith("EXCEPTION_") ||
                  ev.event_type === "LOADING_PAUSED" ||
                  ev.event_type === "LOADING_RESUMED";
                return (
                  <div
                    key={ev.id}
                    className={`px-2 py-1.5 border-b border-slate-50 text-[10px] ${isOpsAudit ? "bg-amber-50/50" : ""}`}
                  >
                    <span className="font-mono-yms font-semibold">{(ev.event_type || "").replace(/_/g, " ")}</span>
                    <span className="text-slate-500 ml-1">{formatDateTime(ev.event_time)}</span>
                    {ev.event_note && <div className="text-slate-500 truncate">{ev.event_note}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </SheetContent>
    </Sheet>
  );
};

export default VehicleDrawer;
