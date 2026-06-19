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
import { HardHat, Loader2 } from "lucide-react";
import laborApi, { LABOR_MATERIAL_TYPES, LABOR_STATUSES } from "../../services/laborApi";

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

export const EditTeamDialog = ({ open, team, onOpenChange, onUpdated }) => {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && team) {
      setForm({
        team_name: team.name || "",
        supervisor_name: team.supervisor === "—" ? "" : team.supervisor || "",
        supervisor_phone: team.supervisorPhone === "—" ? "" : team.supervisorPhone || "",
        shift_start: team.shiftStart || "06:00",
        shift_end: team.shiftEnd || "14:00",
        members_count: String(team.members || 1),
        material_type: team.materialType || "GENERAL",
        status: team.status || "ON_DUTY",
        remarks: team.remarks || "",
      });
    }
  }, [open, team]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!team?.laborId || !form) return;
    if (!form.team_name.trim() || !form.supervisor_name.trim() || !form.supervisor_phone.trim()) {
      toast.error("Team name, supervisor name, and phone are required");
      return;
    }
    const members = parseInt(form.members_count, 10);
    if (!members || members < 1) {
      toast.error("Member count must be at least 1");
      return;
    }
    setSubmitting(true);
    try {
      await laborApi.updateTeam(team.laborId, {
        team_name: form.team_name.trim(),
        supervisor_name: form.supervisor_name.trim(),
        supervisor_phone: form.supervisor_phone.trim(),
        shift_start: form.shift_start,
        shift_end: form.shift_end,
        members_count: members,
        material_type: form.material_type,
        status: form.status,
        notes: form.remarks.trim() || null,
      });
      toast.success(`Team ${form.team_name.trim()} updated`);
      onOpenChange(false);
      await onUpdated?.();
    } catch (err) {
      toast.error(err.message || "Failed to update team");
    } finally {
      setSubmitting(false);
    }
  };

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="edit-team-dialog" className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <HardHat className="w-5 h-5" /> Edit Team
          </DialogTitle>
          <DialogDescription className="text-[12px] text-slate-500">
            {team?.code && (
              <span className="font-mono-yms">{team.code}</span>
            )}{" "}
            · Update roster details and material handling type.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Team Name" required>
            <input
              data-testid="edit-team-name-input"
              className={inputCls}
              value={form.team_name}
              onChange={(e) => set("team_name", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Supervisor Name" required>
              <input
                data-testid="edit-supervisor-name-input"
                className={inputCls}
                value={form.supervisor_name}
                onChange={(e) => set("supervisor_name", e.target.value)}
              />
            </Field>
            <Field label="Supervisor Phone" required>
              <input
                data-testid="edit-supervisor-phone-input"
                className={inputCls}
                value={form.supervisor_phone}
                onChange={(e) => set("supervisor_phone", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Shift Start" required>
              <input
                type="time"
                className={`${inputCls} font-mono-yms`}
                value={form.shift_start}
                onChange={(e) => set("shift_start", e.target.value)}
              />
            </Field>
            <Field label="Shift End" required>
              <input
                type="time"
                className={`${inputCls} font-mono-yms`}
                value={form.shift_end}
                onChange={(e) => set("shift_end", e.target.value)}
              />
            </Field>
            <Field label="Member Count" required>
              <input
                type="number"
                min={1}
                className={`${inputCls} font-mono-yms`}
                value={form.members_count}
                onChange={(e) => set("members_count", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Material Type" required>
              <select
                className={inputCls}
                value={form.material_type}
                onChange={(e) => set("material_type", e.target.value)}
              >
                {LABOR_MATERIAL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status" required>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {LABOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Remarks">
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              value={form.remarks}
              onChange={(e) => set("remarks", e.target.value)}
              placeholder="Shift notes, certifications, restrictions…"
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
              data-testid="edit-team-submit"
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

export default EditTeamDialog;
