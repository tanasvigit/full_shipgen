import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormHandle } from "@/components/fleetops/forms/formUtils";
import { useMaintenanceLookups } from "@/hooks/fleetops/useMaintenanceLookups";
import {
  PRIORITIES,
  SUBJECT_TYPES,
  resolvePolymorphicUuid,
  toMorphType,
} from "@/lib/fleetops/maintenancePayloads";

const defaults = {
  summary: "",
  status: "completed",
  priority: "normal",
  maintainableType: "vehicle",
  maintainableUuid: "",
  workOrderUuid: "",
  performerUuid: "",
  scheduledAt: "",
  completedAt: "",
  odometer: "",
  engineHours: "",
  laborCost: "",
  partsCost: "",
  notes: "",
};

export function maintenanceRecordValuesFromApi(raw) {
  if (!raw) return { ...defaults };
  const { type, uuid } = resolvePolymorphicUuid(raw, "maintainable_type", "maintainable_uuid");
  return {
    summary: raw.summary || raw.name || "",
    status: raw.status || "completed",
    priority: raw.priority || "normal",
    maintainableType: type,
    maintainableUuid: uuid,
    workOrderUuid: String(raw.work_order_uuid || raw.workOrder?.uuid || ""),
    performerUuid: String(raw.performed_by_uuid || raw.performedBy?.uuid || ""),
    scheduledAt: raw.scheduled_at ? String(raw.scheduled_at).slice(0, 16) : "",
    completedAt: raw.completed_at ? String(raw.completed_at).slice(0, 16) : "",
    odometer: raw.odometer ?? "",
    engineHours: raw.engine_hours ?? "",
    laborCost: raw.labor_cost?.amount ?? raw.labor_cost ?? "",
    partsCost: raw.parts_cost?.amount ?? raw.parts_cost ?? "",
    notes: raw.notes || "",
  };
}

export function maintenanceRecordPayload(values) {
  const payload = {
    summary: values.summary,
    status: values.status || "completed",
    priority: values.priority || "normal",
    maintainable_type: toMorphType(values.maintainableType),
    maintainable_uuid: values.maintainableUuid || undefined,
    work_order_uuid: values.workOrderUuid || undefined,
    scheduled_at: values.scheduledAt || undefined,
    completed_at: values.completedAt || undefined,
    odometer: values.odometer !== "" ? Number(values.odometer) : undefined,
    engine_hours: values.engineHours !== "" ? Number(values.engineHours) : undefined,
    notes: values.notes || undefined,
  };
  if (values.performerUuid) {
    payload.performed_by_type = toMorphType("vendor");
    payload.performed_by_uuid = values.performerUuid;
  }
  if (values.laborCost !== "") payload.labor_cost = Number(values.laborCost);
  if (values.partsCost !== "") payload.parts_cost = Number(values.partsCost);
  return payload;
}

const MaintenanceRecordForm = forwardRef(function MaintenanceRecordForm({ formId, initialValues, mode = "create" }, ref) {
  const { vehicles, equipment, vendors, workOrders } = useMaintenanceLookups();
  const methods = useForm({ defaultValues: { ...defaults, ...initialValues } });
  const { register, watch, setValue } = methods;
  const maintainableType = watch("maintainableType");

  useFormHandle(ref, methods, () => maintenanceRecordPayload(methods.getValues()));

  const assetOptions = maintainableType === "equipment" ? equipment : vehicles;

  return (
    <div id={formId} className="space-y-4" data-testid="maintenance-record-form">
      <FormSection title="Service record" testId="maint-form-basic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Summary *</Label>
            <Input {...register("summary", { required: true })} data-testid="field-summary" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger data-testid="field-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["scheduled", "in_progress", "completed", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v)}>
              <SelectTrigger data-testid="field-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Asset" testId="maint-form-asset">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Asset type</Label>
            <Select
              value={watch("maintainableType")}
              onValueChange={(v) => {
                setValue("maintainableType", v);
                setValue("maintainableUuid", "");
              }}
            >
              <SelectTrigger data-testid="field-maintainable-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_TYPES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <EntityAsyncSelect
            label="Asset"
            value={watch("maintainableUuid")}
            onChange={(v) => setValue("maintainableUuid", v)}
            options={assetOptions}
            required
            testId="field-maintainable-uuid"
          />
          <EntityAsyncSelect
            label="Work order"
            value={watch("workOrderUuid")}
            onChange={(v) => setValue("workOrderUuid", v)}
            options={workOrders}
            allowClear
            testId="field-work-order"
          />
          <EntityAsyncSelect
            label="Performed by (vendor)"
            value={watch("performerUuid")}
            onChange={(v) => setValue("performerUuid", v)}
            options={vendors}
            allowClear
            testId="field-performer"
          />
        </div>
      </FormSection>

      <FormSection title="Timing & readings" testId="maint-form-timing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Scheduled at</Label>
            <Input type="datetime-local" {...register("scheduledAt")} data-testid="field-scheduled-at" />
          </div>
          <div className="space-y-1.5">
            <Label>Completed at</Label>
            <Input type="datetime-local" {...register("completedAt")} data-testid="field-completed-at" />
          </div>
          <div className="space-y-1.5">
            <Label>Odometer (km)</Label>
            <Input type="number" min="0" {...register("odometer")} data-testid="field-odometer" />
          </div>
          <div className="space-y-1.5">
            <Label>Engine hours</Label>
            <Input type="number" min="0" {...register("engineHours")} data-testid="field-engine-hours" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Costs" testId="maint-form-costs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Labor cost</Label>
            <Input type="number" min="0" step="0.01" {...register("laborCost")} data-testid="field-labor-cost" />
          </div>
          <div className="space-y-1.5">
            <Label>Parts cost</Label>
            <Input type="number" min="0" step="0.01" {...register("partsCost")} data-testid="field-parts-cost" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={3} data-testid="field-notes" />
          </div>
        </div>
      </FormSection>
      {mode === "edit" && <p className="text-xs text-[#4B5563]">Line items can be edited on the detail page.</p>}
    </div>
  );
});

export default MaintenanceRecordForm;
