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
import { Warehouse, Loader2 } from "lucide-react";
import docksApi, {
  DOCK_TYPES,
  DOCK_ZONES,
  DOCK_STATUSES,
} from "../../services/docksApi";
import DockSupportedTypesField from "./DockSupportedTypesField";
import {
  STANDARD_DOCK_MATERIAL_TYPES,
  STANDARD_DOCK_VEHICLE_TYPES,
} from "../../utils/dockTypeSelectors";

const Field = ({ label, required, children, hint }) => (
  <label className="block">
    <div className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </div>
    {children}
    {hint && <div className="text-[10px] text-slate-400 mt-1">{hint}</div>}
  </label>
);

const inputCls =
  "w-full border border-slate-200 rounded-md px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

export const EditDockDialog = ({ open, dock, onOpenChange, onUpdated }) => {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && dock) {
      setForm({
        dock_name: dock.name || "",
        dock_type: dock.rawType || dock.dock?.dock_type || "GENERAL",
        zone: dock.zone || dock.dock?.zone || "Zone A",
        supported_vehicle_types: dock.supportedVehicles?.length
          ? dock.supportedVehicles
          : dock.dock?.supported_vehicle_types || ["TRUCK"],
        supported_cargo_types: dock.supportedCargo?.length
          ? dock.supportedCargo
          : dock.dock?.supported_cargo_types || ["GENERAL"],
        max_capacity: String(dock.maxCapacity || dock.dock?.max_capacity || 1),
        status: dock.backendStatus || dock.dock?.status || "AVAILABLE",
        estimated_service_time_min: String(
          dock.estimatedServiceTimeMin || dock.dock?.estimated_service_time_min || 90
        ),
        remarks: dock.dock?.notes || "",
      });
    }
  }, [open, dock]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dock?.id || !form) return;
    if (!form.dock_name.trim()) {
      toast.error("Dock name is required");
      return;
    }
    if (!form.dock_type || !form.zone) {
      toast.error("Dock type and zone are required");
      return;
    }
    if (!form.supported_vehicle_types.length || !form.supported_cargo_types.length) {
      toast.error("Select at least one vehicle type and material type");
      return;
    }
    const capacity = parseInt(form.max_capacity, 10);
    if (!capacity || capacity < 1) {
      toast.error("Maximum capacity must be at least 1");
      return;
    }
    setSubmitting(true);
    try {
      await docksApi.updateDock(dock.id, {
        dock_name: form.dock_name.trim(),
        dock_type: form.dock_type,
        zone: form.zone,
        supported_vehicle_types: form.supported_vehicle_types,
        supported_cargo_types: form.supported_cargo_types,
        max_capacity: capacity,
        status: form.status,
        estimated_service_time_min: parseInt(form.estimated_service_time_min, 10) || 90,
        notes: form.remarks.trim() || null,
      });
      toast.success(`${form.dock_name.trim()} updated`);
      onOpenChange(false);
      await onUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to update dock");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-dock-dialog" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Warehouse className="w-5 h-5" /> Edit Dock
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            <span className="font-mono-yms">{dock?.code}</span> · code cannot be changed
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Dock Name" required>
            <input className={inputCls} value={form.dock_name} onChange={(e) => set("dock_name", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Dock Type" required>
              <select className={inputCls} value={form.dock_type} onChange={(e) => set("dock_type", e.target.value)}>
                {DOCK_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
            <Field label="Zone" required>
              <select className={inputCls} value={form.zone} onChange={(e) => set("zone", e.target.value)}>
                {DOCK_ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </Field>
          </div>

          <DockSupportedTypesField
            label="Supported Vehicle Types"
            required
            standardOptions={STANDARD_DOCK_VEHICLE_TYPES}
            value={form.supported_vehicle_types}
            onChange={(v) => set("supported_vehicle_types", v)}
            customInputLabel="Custom Vehicle Type"
            testIdPrefix="edit-dock-vehicle-type"
          />

          <DockSupportedTypesField
            label="Supported Material Types"
            required
            standardOptions={STANDARD_DOCK_MATERIAL_TYPES}
            value={form.supported_cargo_types}
            onChange={(v) => set("supported_cargo_types", v)}
            customInputLabel="Custom Material Type"
            testIdPrefix="edit-dock-material-type"
          />

          <Field label="Estimated Service Time (min)" hint="Typical operation duration at this dock">
            <input
              type="number"
              min={15}
              max={480}
              className={`${inputCls} font-mono-yms`}
              value={form.estimated_service_time_min}
              onChange={(e) => set("estimated_service_time_min", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Maximum Capacity" required>
              <input
                type="number"
                min={1}
                className={`${inputCls} font-mono-yms`}
                value={form.max_capacity}
                onChange={(e) => set("max_capacity", e.target.value)}
              />
            </Field>
            <Field label="Status" required>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {DOCK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Remarks">
            <textarea rows={2} className={`${inputCls} resize-none`} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
          </Field>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <button type="button" className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-md" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" data-testid="edit-dock-submit" disabled={submitting} className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md disabled:opacity-50 inline-flex items-center gap-2">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDockDialog;
