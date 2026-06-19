import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import useYmsSyncRefresh from "../../hooks/useYmsSyncRefresh";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  Truck, ClipboardCheck, History, Loader2, CheckCircle2, LogOut, ShieldCheck,
} from "lucide-react";
import gateManagementApi, { canApproveExit, GATE_ID } from "../../services/gateManagementApi";
import { parseRequestType, slotFromReportingTime } from "../../services/appointmentsApi";
import { safeDisplayValue } from "../../utils/display";
import usePermissions from "../../hooks/usePermissions";

const ExitChecklist = memo(function ExitChecklist({
  exitChecks,
  status,
  working,
  remarks,
  verification,
  onToggle,
  onRemarksChange,
}) {
  return (
    <section>
      <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center gap-1">
        <ClipboardCheck className="w-3.5 h-3.5" /> Exit Checklist
      </h3>
      <div className="border border-slate-200 rounded-md divide-y">
        {exitChecks.map((check) => (
          <label
            key={check.id}
            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50"
          >
            <input
              type="checkbox"
              className="rounded border-slate-300"
              checked={!!check.passed}
              disabled={working || status !== "EXIT_HOLDING"}
              onChange={(e) => onToggle(check.field, e.target.checked)}
            />
            <span className="flex-1 font-semibold text-slate-800">{check.label}</span>
            {check.passed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </label>
        ))}
      </div>
      {status === "EXIT_HOLDING" && (
        <textarea
          className="mt-2 w-full border border-slate-200 rounded-md px-2 py-1.5 text-[12px]"
          rows={2}
          placeholder="Remarks (optional)"
          value={remarks}
          onChange={(e) => onRemarksChange(e.target.value)}
        />
      )}
      {verification?.verified_by && (
        <div className="mt-2 text-[10px] text-slate-500">
          Verified by {verification.verified_by}
          {verification.verified_at ? ` · ${verification.verified_at}` : ""}
        </div>
      )}
    </section>
  );
});

export const ExitVerificationDrawer = () => {
  const { exitVerification, closeExitVerification } = useUI();
  const { canTransitionVehicle, canVerifyExit, canGateOut } = usePermissions();
  const open = !!exitVerification?.vehicleId;
  const vehicleId = exitVerification?.vehicleId;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [showAudit, setShowAudit] = useState(true);
  const workingRef = useRef(false);

  useEffect(() => {
    workingRef.current = working;
  }, [working]);

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!vehicleId) return;
    if (!silent) setLoading(true);
    try {
      const data = await gateManagementApi.fetchExitVerification(vehicleId, GATE_ID);
      setDetail(data);
    } catch (e) {
      if (!silent) toast.error(e.message || "Failed to load exit verification");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [vehicleId]);

  const syncRefresh = useCallback(() => {
    if (workingRef.current) return;
    refresh({ silent: true });
  }, [refresh]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  useYmsSyncRefresh(syncRefresh, open);

  const toggleCheck = useCallback(async (field, value) => {
    if (!vehicleId || detail?.vehicle?.status === "EXIT_VERIFIED") return;
    setWorking(true);
    try {
      const updated = await gateManagementApi.updateExitChecklist(vehicleId, { [field]: value });
      setDetail(updated);
    } catch (e) {
      toast.error(e.message || "Failed to update checklist");
    } finally {
      setWorking(false);
    }
  }, [vehicleId, detail?.vehicle?.status]);

  const handleRemarksChange = useCallback((value) => {
    setRemarks(value);
  }, []);

  const handleVerifyExit = async () => {
    if (!vehicleId) return;
    setWorking(true);
    try {
      const updated = await gateManagementApi.verifyExit(vehicleId, { remarks: remarks.trim() || null });
      setDetail(updated);
      toast.success("Exit verified — ready for gate out");
      await exitVerification?.onUpdated?.();
    } catch (e) {
      toast.error(e.message || "Exit verification failed");
    } finally {
      setWorking(false);
    }
  };

  const handleGateOut = async () => {
    if (!vehicleId) return;
    setWorking(true);
    try {
      const updated = await gateManagementApi.gateOut(vehicleId);
      setDetail(updated);
      toast.success("Gate out approved — vehicle exited");
      await exitVerification?.onUpdated?.();
      closeExitVerification();
    } catch (e) {
      toast.error(e.message || "Gate out failed");
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  const vehicle = detail?.vehicle;
  const appointment = detail?.appointment;
  const journey = detail?.journey || {};
  const verification = detail?.verification || {};
  const exitChecks = detail?.exitChecks || [];
  const checklistReady = canApproveExit(exitChecks);
  const status = vehicle?.status;
  const materialParts = (appointment?.shipment_reference || "").split("|");
  const material = materialParts.length >= 2 ? materialParts[1] : appointment?.shipment_reference || "—";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && closeExitVerification()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto thin-scroll max-h-[100dvh] flex flex-col p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Exit Verification
          </SheetTitle>
        </SheetHeader>

        {loading && !detail ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="mt-4 space-y-5 text-[12px]">
            <div className="flex items-start gap-3 border border-slate-200 rounded-md p-3">
              <Truck className="w-5 h-5 text-slate-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-mono-yms font-bold text-base">{vehicle?.vehicle_number || "—"}</div>
                <div className="text-[10px] text-slate-500">{vehicle?.vehicle_reference}</div>
              </div>
              <StatusPill status={status} />
            </div>

            <section>
              <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Appointment</h3>
              <div className="space-y-1 border border-slate-100 rounded-md p-3">
                {[
                  ["Reference", appointment?.booking_reference],
                  ["Slot", appointment?.scheduled_slot || slotFromReportingTime(appointment?.reporting_time)],
                  ["Material", material],
                  ["Type", parseRequestType(appointment?.shipment_reference, appointment?.remarks)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono-yms font-semibold text-right truncate">{safeDisplayValue(v, "—")}</span>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Loading Summary</h3>
              <div className="border border-slate-100 rounded-md p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Completed</span>
                  <span className="font-mono-yms">{safeDisplayValue(detail?.completedAt, "—")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waiting</span>
                  <span className="font-mono-yms">{detail?.waitingMinutes ?? 0} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Queue</span>
                  <span className="font-mono-yms">{detail?.queueEntry?.queue_number || "—"}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] uppercase font-bold text-slate-500 mb-2">Dock · Labor · Equipment</h3>
              <div className="border border-slate-100 rounded-md p-3 space-y-1">
                {[
                  ["Dock", journey?.dock?.dock_code],
                  ["Labor", journey?.labor?.team_name],
                  ["Equipment", journey?.equipment?.equipment_name],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-mono-yms font-semibold">{safeDisplayValue(v, "—")}</span>
                  </div>
                ))}
              </div>
            </section>

            <ExitChecklist
              exitChecks={exitChecks}
              status={status}
              working={working}
              remarks={remarks}
              verification={verification}
              onToggle={toggleCheck}
              onRemarksChange={handleRemarksChange}
            />

            <section>
              <button
                type="button"
                onClick={() => setShowAudit((s) => !s)}
                className="text-[11px] font-semibold text-slate-600 flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" /> {showAudit ? "Hide" : "Show"} exit audit
              </button>
              {showAudit && (
                <div className="mt-2 max-h-36 overflow-y-auto thin-scroll border border-slate-100 rounded-md p-2 space-y-1 text-[10px]">
                  {(detail?.exitAudit || []).map((e) => (
                    <div key={e.id} className="border-b border-slate-50 pb-1">
                      <span className="font-semibold">{e.event_type}</span>
                      <span className="text-slate-500"> — {e.event_note}</span>
                    </div>
                  ))}
                  {(detail?.exitAudit || []).length === 0 && (
                    <div className="text-slate-400 text-center py-2">No exit events yet</div>
                  )}
                </div>
              )}
            </section>

            {canTransitionVehicle && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              {status === "EXIT_HOLDING" && canVerifyExit && (
                <button
                  type="button"
                  disabled={!checklistReady || working}
                  onClick={handleVerifyExit}
                  className="col-span-2 bg-violet-600 text-white text-xs font-semibold py-2.5 rounded-md disabled:bg-slate-300"
                >
                  Approve Exit
                </button>
              )}
              {status === "EXIT_VERIFIED" && canGateOut && (
                <button
                  type="button"
                  disabled={working}
                  onClick={handleGateOut}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-md"
                >
                  <LogOut className="w-4 h-4" /> Gate Out
                </button>
              )}
            </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ExitVerificationDrawer;
