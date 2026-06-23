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

export const WeighGrossDialog = ({ open, onOpenChange, row, onRecorded }) => {
  const [weight, setWeight] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const tare = row?.tareWeightKg;
  const previewNet =
    tare != null && weight && Number.isFinite(parseFloat(weight)) && parseFloat(weight) > tare
      ? parseFloat(weight) - tare
      : null;

  useEffect(() => {
    if (!open) return;
    setWeight(row?.grossWeightKg != null ? String(row.grossWeightKg) : "");
  }, [open, row]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!row?.queueEntryId) return;
    const value = parseFloat(weight);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid gross weight in kg");
      return;
    }
    if (tare == null) {
      toast.error("Tare weight must be recorded in the virtual queue first");
      return;
    }
    if (value <= tare) {
      toast.error("Gross weight must be greater than tare weight");
      return;
    }
    setSubmitting(true);
    try {
      const result = await queueApi.recordGrossWeight(row.queueEntryId, value);
      toast.success(`Gross weight recorded for ${row.plate || row.currentVehicle}`, {
        description: `Net ${Number(result.netWeightKg).toLocaleString("en-IN")} kg`,
      });
      onOpenChange(false);
      await onRecorded?.();
    } catch (err) {
      toast.error(err.message || "Failed to record gross weight");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="weigh-gross-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Scale className="w-5 h-5" /> Gross Weight
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {row
              ? `${row.plate || row.currentVehicle} · loaded truck weight before dock release`
              : "Record gross weight (GW)"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="border border-slate-200 rounded-md px-3 py-2 bg-slate-50">
              <div className="text-[9px] uppercase font-bold text-slate-500">Tare (TW)</div>
              <div className="font-mono-yms font-semibold text-slate-800">
                {tare != null ? `${Number(tare).toLocaleString("en-IN")} kg` : "Not recorded"}
              </div>
            </div>
            <div className="border border-emerald-200 rounded-md px-3 py-2 bg-emerald-50">
              <div className="text-[9px] uppercase font-bold text-emerald-700">Net (NW)</div>
              <div className="font-mono-yms font-semibold text-emerald-900">
                {previewNet != null ? `${previewNet.toLocaleString("en-IN")} kg` : "—"}
              </div>
            </div>
          </div>
          <label className="block">
            <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
              Gross weight (kg) <span className="text-red-500">*</span>
            </div>
            <input
              data-testid="gross-weight-input"
              type="number"
              min={1}
              step="0.01"
              className={inputCls}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 12000"
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
              data-testid="gross-weight-submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Gross
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WeighGrossDialog;
