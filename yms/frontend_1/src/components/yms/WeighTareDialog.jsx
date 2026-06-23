import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner";
import { Scale, Loader2 } from "lucide-react";
import queueApi from "../../services/queueApi";

const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono-yms outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

export const WeighTareDialog = ({ open, onOpenChange, row, onRecorded }) => {
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWeight(row?.tareWeightKg != null ? String(row.tareWeightKg) : "");
  }, [open, row]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!row?.queueEntryId) return;
    const value = parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid tare weight in kg");
      return;
    }
    setSubmitting(true);
    try {
      await queueApi.recordTareWeight(row.queueEntryId, value);
      toast.success(`Tare weight recorded for ${row.plate}`, {
        description: `${value.toLocaleString("en-IN")} kg`,
      });
      onOpenChange(false);
      await onRecorded?.();
    } catch (err) {
      toast.error(err.message || "Failed to record tare weight");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="weigh-tare-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Scale className="w-5 h-5" /> Tare Weight
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {row ? `${row.plate} · empty truck weight before loading` : "Record tare weight (TW)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
              Tare weight (kg) <span className="text-red-500">*</span>
            </div>
            <input
              data-testid="tare-weight-input"
              type="number"
              min={1}
              step="0.01"
              className={inputCls}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 4000"
            />
          </label>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-md"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="tare-weight-submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Tare
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WeighTareDialog;
