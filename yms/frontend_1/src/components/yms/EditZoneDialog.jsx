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
import { MapPin, Loader2 } from "lucide-react";
import yardZonesApi, { YARD_ZONE_TYPES, YARD_ZONE_STATUSES } from "../../services/yardZonesApi";

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

export const EditZoneDialog = ({ open, onOpenChange, zone, onUpdated }) => {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (zone && open) {
      setForm({
        zone_name: zone.name || zone.zone_name || "",
        zone_type: zone.zoneType || zone.zone_type || "LOADING",
        max_capacity: String(zone.capacity ?? zone.max_capacity ?? 1),
        status: zone.status || "ACTIVE",
        description: zone.description || "",
        remarks: zone.remarks || "",
      });
    }
  }, [zone, open]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zone?.id || !form) return;
    if (!form.zone_name.trim()) {
      toast.error("Zone name is required");
      return;
    }
    const capacity = parseInt(form.max_capacity, 10);
    if (!capacity || capacity < 1) {
      toast.error("Maximum capacity must be at least 1");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await yardZonesApi.updateZone(zone.id, {
        zone_name: form.zone_name.trim(),
        zone_type: form.zone_type,
        max_capacity: capacity,
        status: form.status,
        description: form.description.trim() || null,
        remarks: form.remarks.trim() || null,
        created_by: "yard-ui",
      });
      toast.success(`${updated.name} updated`);
      onOpenChange(false);
      await onUpdated?.(updated);
    } catch (err) {
      toast.error(err.message || "Failed to update zone");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-zone-dialog" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Edit Zone
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {zone?.zoneCode || zone?.zone_code} · {zone?.isMandatory ? "Mandatory system zone" : "Custom zone"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Zone Name" required>
            <input className={inputCls} value={form.zone_name} onChange={(e) => set("zone_name", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Zone Code">
              <input className={`${inputCls} bg-slate-50 font-mono-yms`} disabled value={zone?.zoneCode || ""} />
            </Field>
            <Field label="Zone Type" required>
              <select
                className={inputCls}
                value={form.zone_type}
                onChange={(e) => set("zone_type", e.target.value)}
                disabled={zone?.isMandatory}
              >
                {YARD_ZONE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Maximum Capacity" required>
              <input
                type="number"
                min={1}
                max={500}
                className={`${inputCls} font-mono-yms`}
                value={form.max_capacity}
                onChange={(e) => set("max_capacity", e.target.value)}
              />
            </Field>
            <Field label="Status" required>
              <select className={inputCls} value={form.status} onChange={(e) => set("status", e.target.value)}>
                {YARD_ZONE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Description">
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          <Field label="Remarks">
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </Field>

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
              data-testid="edit-zone-submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md disabled:opacity-50 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditZoneDialog;
