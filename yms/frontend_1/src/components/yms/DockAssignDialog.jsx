import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner";
import { Warehouse, Loader2, Check } from "lucide-react";
import docksApi, { getAssignableDocks } from "../../services/docksApi";

const ReasonList = ({ reasons }) =>
  reasons?.length ? (
    <ul className="mt-2 space-y-1 text-[11px] text-slate-600">
      {reasons.map((r) => (
        <li key={r} className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
          {r}
        </li>
      ))}
    </ul>
  ) : null;

export const DockAssignDialog = ({ open, onOpenChange, row, dockRows, onAssigned }) => {
  const [selectedDockId, setSelectedDockId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const assignable = useMemo(() => getAssignableDocks(dockRows || []), [dockRows]);
  const rec = row?.recommendedDock;

  const handleAssign = async (dockId) => {
    if (!row?.queueEntryId || !dockId) return;
    setSubmitting(true);
    try {
      await docksApi.assignStagingToDock(row.queueEntryId, dockId);
      toast.success(`Dock assigned — ${assignable.find((d) => d.id === dockId)?.code || "bay"}`);
      onOpenChange(false);
      await onAssigned?.();
    } catch (e) {
      toast.error(e.message || "Dock assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dock-assign-dialog">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Warehouse className="w-5 h-5" /> Assign Dock
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            {row.vehicleNumber} · {row.queueNumber} · {row.appointmentRef}
          </DialogDescription>
        </DialogHeader>

        {rec?.dockCode && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-[12px]">
            <div className="text-[10px] uppercase font-bold text-slate-500">Recommended Dock</div>
            <div className="font-mono-yms font-bold text-slate-900 mt-1">{rec.dockCode}</div>
            {rec.score != null && (
              <div className="text-[10px] text-slate-500 mt-0.5">Score: {rec.score}</div>
            )}
            <ReasonList reasons={rec.reasons || (rec.reason ? rec.reason.split(" · ") : [])} />
            <button
              type="button"
              disabled={submitting || !rec.dockId}
              onClick={() => handleAssign(rec.dockId)}
              className="mt-3 w-full bg-slate-900 text-white text-xs font-semibold py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : "Assign Recommended Dock"}
            </button>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500">Choose Different Dock</div>
          <select
            className="w-full border border-slate-300 rounded-md px-2 py-2 text-[12px]"
            value={selectedDockId}
            onChange={(e) => setSelectedDockId(e.target.value)}
          >
            <option value="">Select dock…</option>
            {assignable.map((d) => (
              <option key={d.id} value={d.id}>
                {d.code} · {d.name} · {d.zone}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!selectedDockId || submitting}
            onClick={() => handleAssign(selectedDockId)}
            className="w-full border border-slate-300 text-slate-800 text-xs font-semibold py-2 rounded-md disabled:opacity-50"
          >
            Assign Selected Dock
          </button>
        </div>

        <DialogFooter>
          <button type="button" className="text-xs text-slate-600" onClick={() => onOpenChange(false)}>
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DockAssignDialog;
