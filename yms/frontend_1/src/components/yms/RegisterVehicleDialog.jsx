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
import { Truck, Loader2 } from "lucide-react";
import vehiclesApi, {
  VEHICLE_TYPES,
  VEHICLE_TYPE_LABELS,
  OPERATION_TYPES,
  MATERIAL_TYPES,
  OWNERSHIP_CATEGORIES,
} from "../../services/vehiclesApi";

const initialForm = {
  vehicle_number: "",
  display_name: "",
  vehicle_type: "TRUCK",
  ownership_type: "outside",
  operation_type: "Loading",
  material_type: "GENERAL",
  transporter_name: "",
  driver_name: "",
  driver_phone: "",
  expected_arrival: "",
  remarks: "",
};

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

export const RegisterVehicleDialog = ({ open, onOpenChange, onRegistered }) => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const reset = () => setForm(initialForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicle_number.trim()) {
      toast.error("Vehicle number (plate) is required");
      return;
    }
    if (!form.transporter_name.trim()) {
      toast.error("Transporter is required");
      return;
    }
    setSubmitting(true);
    try {
      const created = await vehiclesApi.registerVehicle(form);
      toast.success(`${created.reference} registered — ${created.plate}`);
      reset();
      onOpenChange(false);
      await onRegistered?.(created);
    } catch (err) {
      toast.error(err.message || "Failed to register vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent data-testid="register-vehicle-dialog" className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-4 h-4" /> Register Vehicle
          </DialogTitle>
          <DialogDescription>
            Walk-in, emergency, or fleet records. Reference is auto-generated (VEH-YYYYMMDD-XXX).
            Appointment bookings create vehicles automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle Number (Plate)" required>
              <input
                data-testid="reg-vehicle-plate"
                className={inputCls}
                value={form.vehicle_number}
                onChange={(e) => set("vehicle_number", e.target.value.toUpperCase())}
                placeholder="MH12AB1234"
              />
            </Field>
            <Field label="Display Name" required hint="Shown in lists and drawer">
              <input
                className={inputCls}
                value={form.display_name}
                onChange={(e) => set("display_name", e.target.value)}
                placeholder="Defaults to plate"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Vehicle Type" required>
              <select className={inputCls} value={form.vehicle_type} onChange={(e) => set("vehicle_type", e.target.value)}>
                {VEHICLE_TYPES.map((t) => (
                  <option key={t} value={t}>{VEHICLE_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </Field>
            <Field label="Vehicle Category" required>
              <select className={inputCls} value={form.ownership_type} onChange={(e) => set("ownership_type", e.target.value)}>
                {OWNERSHIP_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Operation Type" required>
              <select className={inputCls} value={form.operation_type} onChange={(e) => set("operation_type", e.target.value)}>
                {OPERATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Material Type" required>
              <select className={inputCls} value={form.material_type} onChange={(e) => set("material_type", e.target.value)}>
                {MATERIAL_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Transporter" required>
            <input
              className={inputCls}
              value={form.transporter_name}
              onChange={(e) => set("transporter_name", e.target.value)}
              placeholder="Transporter / carrier name"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Driver Name">
              <input className={inputCls} value={form.driver_name} onChange={(e) => set("driver_name", e.target.value)} />
            </Field>
            <Field label="Driver Mobile">
              <input className={inputCls} value={form.driver_phone} onChange={(e) => set("driver_phone", e.target.value)} />
            </Field>
          </div>

          <Field label="Expected Arrival" hint="Optional — used for En Route / Approaching stage">
            <input
              type="datetime-local"
              className={inputCls}
              value={form.expected_arrival}
              onChange={(e) => set("expected_arrival", e.target.value)}
            />
          </Field>

          <Field label="Remarks">
            <textarea
              className={`${inputCls} min-h-[60px]`}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Walk-in reason, fleet notes…"
            />
          </Field>

          <DialogFooter>
            <button
              type="button"
              className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-md"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="reg-vehicle-submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
              Register Vehicle
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterVehicleDialog;
