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
  INTERVAL_UNITS,
  PRIORITIES,
  SCHEDULE_STATUSES,
  SUBJECT_TYPES,
  formatReminderOffsets,
  parseReminderOffsets,
  resolvePolymorphicUuid,
  toMorphType,
} from "@/lib/fleetops/maintenancePayloads";

const defaults = {
  name: "",
  status: "active",
  subjectType: "vehicle",
  subjectUuid: "",
  intervalValue: "",
  intervalUnit: "months",
  intervalDistance: "",
  intervalEngineHours: "",
  nextDueDate: "",
  defaultPriority: "normal",
  assigneeUuid: "",
  instructions: "",
  reminderOffsets: "",
};

export function maintenanceScheduleValuesFromApi(raw) {
  if (!raw) return { ...defaults };
  const { type, uuid } = resolvePolymorphicUuid(raw, "subject_type", "subject_uuid");
  const subject = raw?.subject;
  const resolvedUuid =
    uuid ||
    subject?.uuid ||
    subject?.id ||
    subject?.public_id ||
    "";
  return {
    name: raw.name || "",
    status: raw.status || "active",
    subjectType: type,
    subjectUuid: String(resolvedUuid || ""),
    intervalValue: raw.interval_value ?? "",
    intervalUnit: raw.interval_unit || "months",
    intervalDistance: raw.interval_distance ?? "",
    intervalEngineHours: raw.interval_engine_hours ?? "",
    nextDueDate: raw.next_due_date ? String(raw.next_due_date).slice(0, 10) : "",
    defaultPriority: raw.default_priority || "normal",
    assigneeUuid: String(raw.default_assignee_uuid || raw.defaultAssignee?.uuid || ""),
    instructions: raw.instructions || "",
    reminderOffsets: formatReminderOffsets(raw.reminder_offsets),
  };
}

export function maintenanceSchedulePayload(values) {
  if (!values.subjectUuid) {
    throw new Error("Select a vehicle for this schedule.");
  }
  const payload = {
    name: values.name,
    status: values.status || "active",
    subject_type: toMorphType(values.subjectType),
    subject_uuid: values.subjectUuid,
    interval_value: values.intervalValue ? Number(values.intervalValue) : undefined,
    interval_unit: values.intervalUnit || undefined,
    interval_distance: values.intervalDistance ? Number(values.intervalDistance) : undefined,
    interval_engine_hours: values.intervalEngineHours ? Number(values.intervalEngineHours) : undefined,
    next_due_date: values.nextDueDate || undefined,
    default_priority: values.defaultPriority || "normal",
    instructions: values.instructions || undefined,
    reminder_offsets: parseReminderOffsets(values.reminderOffsets),
  };
  if (values.assigneeUuid) {
    payload.default_assignee_type = toMorphType("vendor");
    payload.default_assignee_uuid = values.assigneeUuid;
  }
  return payload;
}

const MaintenanceScheduleForm = forwardRef(function MaintenanceScheduleForm(
  { formId, initialValues, mode = "create", defaultVehicleId = "" },
  ref,
) {
  const { vehicles, equipment, vendors, loading, error } = useMaintenanceLookups();
  const methods = useForm({
    defaultValues: {
      ...defaults,
      subjectUuid: defaultVehicleId || "",
      ...initialValues,
    },
  });
  const { register, watch, setValue } = methods;
  const subjectType = watch("subjectType");

  useFormHandle(ref, methods, () => maintenanceSchedulePayload(methods.getValues()));

  const assetOptions = subjectType === "equipment" ? equipment : vehicles;
  const vehicleLabel = subjectType === "equipment" ? "Equipment" : "Vehicle";

  return (
    <div id={formId} className="space-y-4" data-testid="maintenance-schedule-form">
      <FormSection title={vehicleLabel} testId="schedule-form-vehicle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Applies to</Label>
            <Select
              value={watch("subjectType")}
              onValueChange={(v) => {
                setValue("subjectType", v);
                setValue("subjectUuid", "");
              }}
            >
              <SelectTrigger data-testid="field-subject-type">
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
            label={vehicleLabel}
            value={watch("subjectUuid")}
            onChange={(v) => setValue("subjectUuid", v, { shouldDirty: true })}
            options={assetOptions}
            required
            loading={loading}
            alwaysShowSearch
            searchPlaceholder={`Search ${vehicleLabel.toLowerCase()}s…`}
            placeholder={loading ? "Loading vehicles…" : `Select ${vehicleLabel.toLowerCase()}`}
            emptyMessage={
              error
                ? "Could not load vehicles"
                : vehicles.length === 0 && subjectType === "vehicle"
                  ? "No vehicles found — register a vehicle first"
                  : "No options available"
            }
            testId="field-vehicle"
          />
        </div>
        {subjectType === "vehicle" && !loading && vehicles.length === 0 && (
          <p className="text-xs text-[#B45309] mt-2">
            Register vehicles under FleetOps → Management → Vehicles, then return here.
          </p>
        )}
      </FormSection>

      <FormSection title="Schedule" testId="schedule-form-basic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Schedule name *</Label>
            <Input {...register("name", { required: true })} placeholder="e.g. Oil change every 3 months" data-testid="field-name" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger data-testid="field-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCHEDULE_STATUSES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={watch("defaultPriority")} onValueChange={(v) => setValue("defaultPriority", v)}>
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
          <EntityAsyncSelect
            label="Default assignee (vendor)"
            value={watch("assigneeUuid")}
            onChange={(v) => setValue("assigneeUuid", v)}
            options={vendors}
            allowClear
            loading={loading}
            testId="field-assignee"
          />
        </div>
      </FormSection>

      <FormSection title="Intervals" testId="schedule-form-intervals">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Time interval</Label>
            <Input type="number" min="0" {...register("intervalValue")} placeholder="e.g. 3" data-testid="field-interval-value" />
          </div>
          <div className="space-y-1.5">
            <Label>Time unit</Label>
            <Select value={watch("intervalUnit")} onValueChange={(v) => setValue("intervalUnit", v)}>
              <SelectTrigger data-testid="field-interval-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_UNITS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Distance interval (km)</Label>
            <Input type="number" min="0" {...register("intervalDistance")} data-testid="field-interval-distance" />
          </div>
          <div className="space-y-1.5">
            <Label>Engine hours interval</Label>
            <Input type="number" min="0" {...register("intervalEngineHours")} data-testid="field-interval-engine-hours" />
          </div>
          <div className="space-y-1.5">
            <Label>Next due date</Label>
            <Input type="date" {...register("nextDueDate")} data-testid="field-next-due-date" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Reminder days before (comma-separated)</Label>
            <Input {...register("reminderOffsets")} placeholder="7, 3, 1" data-testid="field-reminder-offsets" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Instructions" testId="schedule-form-instructions">
        <Textarea {...register("instructions")} rows={3} data-testid="field-instructions" />
      </FormSection>
      {mode === "edit" && <p className="text-xs text-[#4B5563]">Changes sync to the maintenance schedule API.</p>}
    </div>
  );
});

export default MaintenanceScheduleForm;
