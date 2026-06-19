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
import { Wrench, Loader2 } from "lucide-react";
import equipmentApi, { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from "../../services/equipmentApi";

const Field = ({ label, required, children }) => (
  <label className="block">
    <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </div>
    {children}
  </label>
);

const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

export const EditEquipmentDialog = ({ open, item, onOpenChange, onUpdated }) => {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && item) {
      setForm({
        equipment_name: item.name || "",
        equipment_type: item.type || "FORKLIFT",
        model: item.model === "—" ? "" : item.model || "",
        asset_number: item.assetNumber === "—" ? "" : item.assetNumber || "",
        operator_name: item.operator === "—" ? "" : item.operator || "",
        current_location: item.location === "—" ? "" : item.location || "",
        battery_level: item.battery !== null && item.battery !== undefined ? String(item.battery) : "",
        status: item.status || "IDLE",
        remarks: item.remarks || "",
      });
    }
  }, [open, item]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item?.equipmentId || !form) return;
    if (!form.equipment_name.trim()) {
      toast.error("Equipment name is required");
      return;
    }
    let battery = null;
    if (form.battery_level !== "") {
      battery = parseInt(form.battery_level, 10);
      if (Number.isNaN(battery) || battery < 0 || battery > 100) {
        toast.error("Battery level must be 0–100");
        return;
      }
    }
    setSubmitting(true);
    try {
      await equipmentApi.updateEquipment(item.equipmentId, {
        equipment_name: form.equipment_name.trim(),
        equipment_type: form.equipment_type,
        model: form.model.trim() || "—",
        asset_number: form.asset_number.trim() || null,
        operator_name: form.operator_name.trim() || null,
        current_location: form.current_location.trim() || null,
        battery_level: battery,
        status: form.status,
        notes: form.remarks.trim() || null,
      });
      toast.success(`${form.equipment_name.trim()} updated`);
      onOpenChange(false);
      await onUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to update equipment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-equipment-dialog" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5" /> Edit Equipment
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            <span className="font-mono-yms">{item?.code}</span> · code cannot be changed
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Equipment Name" required>
            <input className={inputCls} value={form.equipment_name} onChange={(e) => set("equipment_name", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Equipment Type" required>
              <select className={inputCls} value={form.equipment_type} onChange={(e) => set("equipment_type", e.target.value)}>
                {EQUIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {EQUIPMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Model">
              <input className={inputCls} value={form.model} onChange={(e) => set("model", e.target.value)} />
            </Field>
            <Field label="Asset Number">
              <input className={inputCls} value={form.asset_number} onChange={(e) => set("asset_number", e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Operator Name">
              <input className={inputCls} value={form.operator_name} onChange={(e) => set("operator_name", e.target.value)} />
            </Field>
            <Field label="Battery Level %">
              <input
                type="number"
                min={0}
                max={100}
                className={`${inputCls} font-mono-yms`}
                value={form.battery_level}
                onChange={(e) => set("battery_level", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Location">
            <input className={inputCls} value={form.current_location} onChange={(e) => set("current_location", e.target.value)} />
          </Field>

          <Field label="Remarks">
            <textarea rows={2} className={`${inputCls} resize-none`} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
          </Field>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <button type="button" className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-md" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" data-testid="edit-equipment-submit" disabled={submitting} className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEquipmentDialog;
