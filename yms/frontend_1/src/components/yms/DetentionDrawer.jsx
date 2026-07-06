import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { useUI } from "../../contexts/UIContext";
import StatusPill from "./StatusPill";
import { toast } from "sonner";
import {
  IndianRupee, Truck, Loader2, FileText, CheckCircle2, AlertTriangle,   Activity,
} from "lucide-react";
import detentionApi, { buildInvoicePayload, formatINR } from "../../services/detentionApi";
import usePermissions from "../../hooks/usePermissions";
import YmsDrawerTopBar from "./YmsDrawerTopBar";
import YmsDrawerBody, { YMS_DRAWER_LOADING_CLASS } from "./YmsDrawerBody";

export const DetentionDrawer = () => {
  const { detention, closeDetention } = useUI();
  const { canWriteDetention } = usePermissions();
  const open = !!detention;
  const [row, setRow] = useState(null);
  const [events, setEvents] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const refresh = async () => {
    if (!detention?.detentionId) return;
    setLoading(true);
    try {
      const detail = await detentionApi.fetchDetentionDetail(detention.detentionId);
      setRow(detail);
      setEvents(detail.events || []);
      if (detention.config) setConfig(detention.config);
    } catch (e) {
      toast.error(e.message || "Failed to load detention record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setRow(detention.record || null);
      setConfig(detention.config || null);
      setRemarks(detention.record?.remarks || "");
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detention?.detentionId]);

  const afterAction = async () => {
    await refresh();
    await detention?.onUpdated?.();
  };

  const run = async (fn, msg) => {
    setWorking(true);
    try {
      await fn();
      if (msg) toast.success(msg);
      await afterAction();
    } catch (e) {
      toast.error(e.message || "Action failed");
    } finally {
      setWorking(false);
    }
  };

  if (!open) return null;

  const billableHours = row ? Math.max(0, row.actualHours - row.freeHours).toFixed(2) : "0";
  const invoice = row ? buildInvoicePayload(row) : null;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeDetention()}>
      <SheetContent data-testid="detention-drawer" hideClose className="w-full sm:max-w-md overflow-y-auto max-h-[100dvh] flex flex-col p-0">
        <YmsDrawerTopBar>
          <SheetHeader className="p-0 text-left space-y-1">
            <SheetTitle className="font-display text-lg flex items-center gap-2">
              <IndianRupee className="w-5 h-5" />
              {row?.id || "Detention"}
            </SheetTitle>
          </SheetHeader>
        </YmsDrawerTopBar>

        {loading && !row ? (
          <div className={`${YMS_DRAWER_LOADING_CLASS} flex justify-center gap-2`}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : row ? (
          <YmsDrawerBody>
            <div className="flex items-center justify-between">
              <StatusPill status={row.status} />
              {row.isEstimated && (
                <span className="text-[10px] text-amber-700 font-semibold uppercase">Estimated</span>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px] space-y-2">
              <div className="flex items-center gap-2 font-mono-yms font-bold">
                <Truck className="w-4 h-4" /> {row.plate}
              </div>
              <div>{row.transporter}</div>
              <div>
                Category: <StatusPill status={row.category} className="inline-flex ml-1" />
              </div>
              <div className="font-mono-yms text-2xl font-bold text-red-600">{formatINR(row.cost)}</div>
            </div>

            <div className="font-mono-yms text-[11px] bg-slate-900 text-amber-300 p-3 rounded-md">
              ({row.actualHours}h − {row.freeHours}h) × ₹{row.rate} = ₹{row.cost.toLocaleString("en-IN")}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="border border-slate-200 rounded-md p-2">
                <div className="text-slate-500 uppercase text-[9px]">Free wait</div>
                <div className="font-mono-yms font-bold">{row.freeHours}h</div>
              </div>
              <div className="border border-slate-200 rounded-md p-2">
                <div className="text-slate-500 uppercase text-[9px]">Actual wait</div>
                <div className="font-mono-yms font-bold">{row.actualHours}h</div>
              </div>
              <div className="border border-slate-200 rounded-md p-2 col-span-2">
                <div className="text-slate-500 uppercase text-[9px]">Billable</div>
                <div className="font-mono-yms font-bold">{billableHours}h @ ₹{row.rate}/hr</div>
              </div>
            </div>

            {config && (
              <p className="text-[10px] text-slate-500">
                Rates: standard ₹{config.standard_rate}/hr · hazmat ₹{config.hazmat_rate}/hr · outside +{config.outside_surcharge_pct}%
              </p>
            )}

            <textarea
              className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm min-h-[60px]"
              placeholder="Remarks for approve/dispute…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              {canWriteDetention && row.status === "Pending" && (
                <>
                  <button
                    type="button"
                    disabled={working}
                    className="py-2 bg-emerald-700 text-white text-xs font-semibold rounded-md"
                    onClick={() => run(() => detentionApi.approveRecord(row.detentionId, remarks), "Approved")}
                  >
                    <CheckCircle2 className="w-3 h-3 inline mr-1" /> Approve
                  </button>
                  <button
                    type="button"
                    disabled={working}
                    className="py-2 bg-amber-600 text-white text-xs font-semibold rounded-md"
                    onClick={() => run(() => detentionApi.disputeRecord(row.detentionId, remarks), "Disputed")}
                  >
                    <AlertTriangle className="w-3 h-3 inline mr-1" /> Dispute
                  </button>
                </>
              )}
              {canWriteDetention && row.status === "Disputed" && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md col-span-2"
                  onClick={() => run(() => detentionApi.markReviewed(row.detentionId, remarks), "Reviewed")}
                >
                  Mark reviewed
                </button>
              )}
              {canWriteDetention && ["Approved", "Reviewed"].includes(row.status) && (
                <button
                  type="button"
                  disabled={working}
                  className="py-2 border border-slate-300 text-xs font-semibold rounded-md col-span-2"
                  onClick={() => run(() => detentionApi.markPaid(row.detentionId, remarks), "Marked paid")}
                >
                  Mark paid
                </button>
              )}
              {!canWriteDetention && ["Pending", "Disputed", "Approved", "Reviewed"].includes(row.status) && (
                <p className="col-span-2 text-[11px] text-slate-500 border border-slate-200 rounded-md px-2 py-2 bg-slate-50">
                  Status changes require Supervisor or Administrator access.
                </p>
              )}
              <button
                type="button"
                className="py-2 border border-slate-300 text-xs font-semibold rounded-md col-span-2"
                onClick={() => setInvoiceOpen((v) => !v)}
              >
                <FileText className="w-3 h-3 inline mr-1" /> {invoiceOpen ? "Hide" : "View"} invoice payload
              </button>
            </div>

            {invoiceOpen && invoice && (
              <pre className="text-[10px] bg-slate-50 border border-slate-200 p-2 rounded-md overflow-x-auto">
                {JSON.stringify(invoice, null, 2)}
              </pre>
            )}

            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Linked yard events
              </div>
              {events.length === 0 ? (
                <p className="text-[11px] text-slate-500">No linked events</p>
              ) : (
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {events.map((ev) => (
                    <li key={ev.id} className="text-[11px] border-l-2 border-slate-200 pl-2">
                      <span className="font-mono-yms">{ev.event_type}</span>
                      <span className="text-slate-400 ml-1">
                        {new Date(ev.event_time).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {ev.event_note && <div className="text-slate-500">{ev.event_note}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </YmsDrawerBody>
        ) : (
          <p className={YMS_DRAWER_LOADING_CLASS}>Record not found</p>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default DetentionDrawer;
