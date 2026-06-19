import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import queueApi from "../../services/queueApi";

const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

export const QueueOverrideDialog = ({ open, onOpenChange, row, maxRank, onApplied }) => {
  const [targetRank, setTargetRank] = useState("1");
  const [reason, setReason] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!row?.queueEntryId) return;
    if (!supervisor.trim()) return toast.error("Supervisor name is required");
    if (!reason.trim() || reason.trim().length < 3) return toast.error("Reason is required (min 3 chars)");
    const rank = parseInt(targetRank, 10);
    if (!rank || rank < 1) return toast.error("Enter a valid target rank");
    setSubmitting(true);
    try {
      await queueApi.overrideQueueEntry(row.queueEntryId, {
        targetRank: rank,
        reason: reason.trim(),
        supervisor: supervisor.trim(),
      });
      toast.success(`${row.plate} moved to rank ${rank}`, { description: "Supervisor override logged" });
      onOpenChange(false);
      setReason("");
      await onApplied?.();
    } catch (err) {
      toast.error(err.message || "Override failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="queue-override-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Shield className="w-5 h-5" /> Supervisor Override
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {row ? `${row.plate} · current rank ${row.queueRank}` : "Reorder queue with audit trail"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1">
              Target Rank <span className="text-red-500">*</span>
            </div>
            <input
              type="number"
              min={1}
              max={maxRank || 99}
              className={`${inputCls} font-mono-yms`}
              value={targetRank}
              onChange={(e) => setTargetRank(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1">
              Supervisor <span className="text-red-500">*</span>
            </div>
            <input className={inputCls} value={supervisor} onChange={(e) => setSupervisor(e.target.value)} placeholder="Supervisor name" />
          </label>
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1">
              Reason <span className="text-red-500">*</span>
            </div>
            <textarea
              rows={3}
              className={`${inputCls} resize-none`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detention risk, VIP customer, cold chain priority…"
            />
          </label>
          <DialogFooter className="pt-2">
            <button type="button" className="px-4 py-2 text-xs font-semibold border rounded-md" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Apply Override
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QueueOverrideDialog;
