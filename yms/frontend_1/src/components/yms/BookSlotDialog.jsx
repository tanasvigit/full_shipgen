import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { useUI } from "../../contexts/UIContext";
import { toast } from "sonner";
import {
  Calendar, MapPin, Package, Truck, Zap, ChevronRight, Check, Loader2, AlertTriangle, Warehouse, Clock,
} from "lucide-react";
import appointmentsApi, {
  GATES,
  REQUEST_TYPES,
  VEHICLE_TYPE_OPTIONS,
  VEHICLE_CATEGORIES,
  PRIORITY_OPTIONS,
  MATERIALS,
  validateBookingForm,
  computeBookingRecommendations,
  slotCapacityWarning,
  generatePreviewBookingRef,
  estimateOperationDuration,
  computeExpectedCompletion,
  computeGateSlotCapacity,
} from "../../services/appointmentsApi";
import useBundlePermissionFlags from "../../hooks/useBundlePermissionFlags";

const SLOTS = Array.from({ length: 24 }, (_, i) =>
  `${String(7 + Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`
).filter((s) => parseInt(s, 10) < 20);

const PRIORITIES = [
  { v: "Normal", color: "border-slate-300 text-slate-700" },
  { v: "High", color: "border-amber-400 text-amber-700 bg-amber-50" },
  { v: "Urgent", color: "border-red-500 text-red-700 bg-red-50" },
];

const CREATORS = ["Production", "Warehouse", "Procurement", "Export Team", "Import Team"];

const today = () => new Date().toISOString().slice(0, 10);

const initial = {
  reqType: "Loading",
  pickup: "Bhiwandi Mega Hub — Mumbai",
  delivery: "",
  material: MATERIALS[0],
  priority: "Normal",
  vehicleType: VEHICLE_TYPE_OPTIONS[0],
  quantity: "",
  weight: "",
  volume: "",
  ownershipType: "company",
  plate: "",
  transporter: "",
  driverName: "",
  driverPhone: "",
  gate: "G1",
  date: today(),
  slot: "09:00",
  createdBy: "Warehouse",
  createdByUser: "appointments-ui",
  notes: "",
};

const STEPS = [
  { n: 1, label: "Request" },
  { n: 2, label: "Cargo" },
  { n: 3, label: "Schedule" },
  { n: 4, label: "Confirm" },
];

const CAPACITY_STYLES = {
  green: "bg-emerald-50 border-emerald-200 text-emerald-800",
  yellow: "bg-amber-50 border-amber-200 text-amber-800",
  red: "bg-red-50 border-red-200 text-red-800",
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
  "w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-[13px] text-slate-900 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition";

const categoryLabel = (v) => VEHICLE_CATEGORIES.find((c) => c.value === v)?.label || v;

const ReasonList = ({ reasons }) =>
  reasons?.length ? (
    <ul className="mt-1 space-y-0.5 text-[10px] text-slate-600 list-disc list-inside">
      {reasons.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  ) : null;

export const BookSlotDialog = () => {
  const { bookOpen, closeBookSlot, bookPrefill } = useUI();
  const { appointmentBundleOptions } = useBundlePermissionFlags();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [recs, setRecs] = useState(null);
  const [bundleRows, setBundleRows] = useState([]);
  const [bundleDocks, setBundleDocks] = useState([]);

  useEffect(() => {
    if (bookOpen) {
      setStep(1);
      setErrors({});
      setRecs(null);
      setForm({
        ...initial,
        date: bookPrefill?.date || today(),
        ...(bookPrefill || {}),
      });
      appointmentsApi
        .fetchAppointmentsBundle(appointmentBundleOptions)
        .then((b) => {
          setBundleRows(b.rows);
          setBundleDocks(b.docks);
        })
        .catch(() => {
          setBundleRows([]);
          setBundleDocks([]);
        });
    }
  }, [bookOpen, bookPrefill, appointmentBundleOptions]);

  useEffect(() => {
    if (!bookOpen || step < 3 || !form.date || !form.slot) return;
    computeBookingRecommendations(form, bundleRows, bundleDocks).then(setRecs);
  }, [bookOpen, step, form, bundleRows, bundleDocks]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const slotWarn = useMemo(
    () => (form.date && form.slot ? slotCapacityWarning(bundleRows, form.date, form.slot) : null),
    [bundleRows, form.date, form.slot]
  );

  const durationMin = useMemo(() => estimateOperationDuration(form.reqType), [form.reqType]);
  const expectedCompletion = useMemo(
    () => (form.date && form.slot ? computeExpectedCompletion(form.date, form.slot, durationMin) : null),
    [form.date, form.slot, durationMin]
  );

  const previewRef = useMemo(
    () => (step >= 4 && form.date ? generatePreviewBookingRef(form.date, bundleRows) : null),
    [step, form.date, bundleRows]
  );

  const gateCapacity = useMemo(() => {
    const gate = form.gate || recs?.gate?.gate || "G1";
    if (!form.date || !form.slot) return null;
    return computeGateSlotCapacity(bundleRows, form.date, form.slot, gate);
  }, [bundleRows, form.date, form.slot, form.gate, recs]);

  const validateStep = (s) => {
    const nextErrors = validateBookingForm(form, s);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error("Please complete all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const { bookingRef } = await appointmentsApi.createBookingFromForm(
        {
          ...form,
          previewBookingRef: previewRef,
        },
        appointmentBundleOptions
      );
      toast.success(`Appointment confirmed: ${bookingRef}`, {
        description: `${form.reqType} · ${form.date} at ${form.slot}`,
      });
      await bookPrefill?.onBooked?.();
      closeBookSlot();
    } catch (e) {
      toast.error(e.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (!validateStep(step)) {
      toast.error("Please complete required fields");
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Dialog open={bookOpen} onOpenChange={(o) => !o && closeBookSlot()}>
      <DialogContent data-testid="book-slot-dialog" className="max-w-[calc(100vw-1rem)] sm:max-w-2xl p-0 gap-0 sm:rounded-md overflow-hidden max-h-[95dvh] flex flex-col">
        <div className="bg-slate-900 text-white px-5 py-4">
          <DialogHeader>
            <DialogTitle className="font-display text-lg tracking-tight flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-amber-400" /> Book Appointment
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[12px]">
              Single workflow — transport request and appointment creation together.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {STEPS.map((s, i, arr) => (
              <React.Fragment key={s.n}>
                <div
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-sm ${
                    step >= s.n ? "bg-amber-400 text-slate-900" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <span className="font-mono-yms text-[10px] font-bold">{s.n}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold">{s.label}</span>
                </div>
                {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-slate-600" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="px-5 py-5 max-h-[60vh] overflow-y-auto thin-scroll">
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Request Type" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REQUEST_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-testid={`req-type-${t.toLowerCase().replace(/\s/g, "-")}`}
                      onClick={() => set("reqType", t)}
                      className={`px-2 py-2 border rounded-md text-[12px] font-semibold transition ${
                        form.reqType === t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pickup Location" required>
                  <input
                    data-testid="pickup-input"
                    className={inputCls}
                    value={form.pickup}
                    onChange={(e) => set("pickup", e.target.value)}
                  />
                  {errors.pickup && <div className="text-[10px] text-red-600 mt-1">{errors.pickup}</div>}
                </Field>
                <Field label="Delivery Location" required>
                  <input
                    data-testid="delivery-input"
                    className={inputCls}
                    value={form.delivery}
                    onChange={(e) => set("delivery", e.target.value)}
                    placeholder="e.g. Surat — Hazira Port"
                  />
                  {errors.delivery && <div className="text-[10px] text-red-600 mt-1">{errors.delivery}</div>}
                </Field>
              </div>
              <Field label="Material Type" required>
                <select data-testid="material-select" className={inputCls} value={form.material} onChange={(e) => set("material", e.target.value)}>
                  {MATERIALS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" required>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.v}
                      type="button"
                      onClick={() => set("priority", p.v)}
                      className={`px-3 py-2 border-2 rounded-md text-[12px] font-bold uppercase tracking-wider ${
                        form.priority === p.v ? p.color : "border-slate-200 text-slate-500"
                      }`}
                    >
                      {p.v === "Urgent" && <Zap className="w-3 h-3 inline mr-1" />}
                      {p.v}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Required Vehicle Type" required>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VEHICLE_TYPE_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set("vehicleType", v)}
                      className={`px-2 py-2 border rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 ${
                        form.vehicleType === v ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300"
                      }`}
                    >
                      <Truck className="w-3 h-3" /> {v}
                    </button>
                  ))}
                </div>
                {errors.vehicleType && <div className="text-[10px] text-red-600 mt-1">{errors.vehicleType}</div>}
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Quantity">
                  <input type="number" className={`${inputCls} font-mono-yms`} value={form.quantity} onChange={(e) => set("quantity", e.target.value)} />
                </Field>
                <Field label="Weight (kg)">
                  <input type="number" className={`${inputCls} font-mono-yms`} value={form.weight} onChange={(e) => set("weight", e.target.value)} />
                </Field>
                <Field label="Volume (m³)">
                  <input type="number" className={`${inputCls} font-mono-yms`} value={form.volume} onChange={(e) => set("volume", e.target.value)} />
                </Field>
              </div>
              <Field label="Vehicle Category">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VEHICLE_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set("ownershipType", c.value)}
                      className={`px-2 py-2 border rounded-md text-[11px] font-semibold ${
                        form.ownershipType === c.value ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Vehicle Plate" hint="Optional — assigned at gate if blank">
                  <input className={`${inputCls} font-mono-yms uppercase`} value={form.plate} onChange={(e) => set("plate", e.target.value)} />
                </Field>
                <Field label="Transporter" hint="Optional">
                  <input className={inputCls} value={form.transporter} onChange={(e) => set("transporter", e.target.value)} />
                </Field>
              </div>
              <Field label="Remarks">
                <textarea rows={2} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Preferred Date" required>
                  <input type="date" data-testid="date-input" className={`${inputCls} font-mono-yms`} value={form.date} onChange={(e) => set("date", e.target.value)} />
                </Field>
                <Field label="Gate">
                  <select className={inputCls} value={form.gate} onChange={(e) => set("gate", e.target.value)}>
                    {GATES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Created By">
                  <select className={inputCls} value={form.createdBy} onChange={(e) => set("createdBy", e.target.value)}>
                    {CREATORS.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Estimated Duration">
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-[12px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono-yms font-semibold">{durationMin} min</span>
                    {expectedCompletion && (
                      <span className="text-slate-500">→ {expectedCompletion}</span>
                    )}
                  </div>
                </Field>
              </div>
              <Field label="Preferred Time Slot" required>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {SLOTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("slot", s)}
                      className={`px-2 py-2 border rounded-md text-[11px] font-mono-yms font-semibold ${
                        form.slot === s ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>

              {gateCapacity && (
                <div
                  data-testid="gate-slot-capacity"
                  className={`rounded-md border p-3 text-[11px] ${CAPACITY_STYLES[gateCapacity.level]}`}
                >
                  <div className="text-[10px] uppercase tracking-widest font-bold mb-2">
                    Current Slot Capacity — {gateCapacity.gate}
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono-yms">
                    <div>
                      <div className="text-[10px] opacity-70">Current</div>
                      <div className="font-bold">{gateCapacity.current} / {gateCapacity.max}</div>
                    </div>
                    <div>
                      <div className="text-[10px] opacity-70">After Booking</div>
                      <div className="font-bold">{gateCapacity.afterBooking} / {gateCapacity.max}</div>
                    </div>
                    <div>
                      <div className="text-[10px] opacity-70">Available</div>
                      <div className="font-bold">{gateCapacity.available}</div>
                    </div>
                  </div>
                  {gateCapacity.message && (
                    <div className="flex items-start gap-1.5 mt-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{gateCapacity.message}</span>
                    </div>
                  )}
                </div>
              )}

              {slotWarn && (
                <div
                  className={`flex items-start gap-2 text-[11px] rounded-md p-2 border ${
                    slotWarn.level === "critical" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  {slotWarn.message}
                </div>
              )}
              {recs && (
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-3 text-[11px]">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Recommendations (informational)</div>
                  <div>
                    <div className="flex gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><b>Gate:</b> {recs.gate?.gate}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <span><b>Dock:</b> {recs.dock?.dockCode || "—"}</span>
                        <ReasonList reasons={recs.dock?.reasons} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div>
                        <span><b>Zone:</b> {recs.zone?.zone}</span>
                        <ReasonList reasons={recs.zone?.reasons} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Review & Confirm</div>
              {previewRef && (
                <div className="bg-slate-900 text-white rounded-md px-4 py-3">
                  <div className="text-[10px] uppercase tracking-widest text-slate-400">Appointment Reference (preview)</div>
                  <div data-testid="preview-booking-ref" className="font-mono-yms text-lg font-bold text-amber-400 mt-1">{previewRef}</div>
                </div>
              )}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 grid grid-cols-2 gap-y-2 text-[12px]">
                {[
                  ["Request Type", form.reqType],
                  ["Material", form.material],
                  ["Vehicle Type", form.vehicleType],
                  ["Vehicle Category", categoryLabel(form.ownershipType)],
                  ["Date", form.date],
                  ["Time Slot", form.slot],
                  ["Priority", form.priority],
                  ["Estimated Duration", `${durationMin} min`],
                  ["Expected Completion", expectedCompletion || "—"],
                  ["Recommended Gate", recs?.gate?.gate || form.gate],
                  ["Recommended Dock", recs?.dock?.dockCode || "—"],
                  ["Recommended Zone", recs?.zone?.zone || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 w-36 shrink-0">{k}</span>
                    <span className="font-semibold text-slate-900 truncate">{v}</span>
                  </div>
                ))}
              </div>
              {recs?.dock?.reasons?.length > 0 && (
                <div className="border border-slate-200 rounded-md p-3 text-[11px]">
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Why this dock?</div>
                  <ReasonList reasons={recs.dock.reasons} />
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                Confirming creates the vehicle record (if needed) and schedules the appointment. Resources are not auto-assigned.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex !flex-row !justify-between !space-x-0">
          <button
            type="button"
            onClick={step === 1 ? closeBookSlot : back}
            className="px-3 py-2 text-[12px] font-semibold text-slate-700 hover:text-slate-900"
          >
            {step === 1 ? "Cancel" : "← Back"}
          </button>
          {step < 4 ? (
            <button
              type="button"
              data-testid="dialog-next-btn"
              onClick={next}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-semibold px-4 py-2 rounded-md"
            >
              Continue <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="dialog-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-[12px] font-bold uppercase tracking-wider px-4 py-2 rounded-md"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {submitting ? "Confirming…" : "Confirm Appointment"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookSlotDialog;
