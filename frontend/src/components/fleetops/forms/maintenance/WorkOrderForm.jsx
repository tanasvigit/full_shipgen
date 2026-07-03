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
  WORK_ORDER_STATUSES,
  formatChecklist,
  parseChecklist,
  resolvePolymorphicUuid,
  toMorphType,
} from "@/lib/fleetops/maintenancePayloads";

const defaults = {
  subject: "",
  status: "open",
  priority: "normal",
  targetType: "vehicle",
  targetUuid: "",
  assigneeUuid: "",
  dueAt: "",
  instructions: "",
  checklist: "",
  estimatedCost: "",
  approvedBudget: "",
};

export function workOrderValuesFromApi(raw) {
  if (!raw) return { ...defaults };
  const { type, uuid } = resolvePolymorphicUuid(raw, "target_type", "target_uuid");
  return {
    subject: raw.subject || raw.name || "",
    status: raw.status || "open",
    priority: raw.priority || "normal",
    targetType: type,
    targetUuid: uuid,
    assigneeUuid: String(raw.assignee_uuid || raw.assignee?.uuid || ""),
    dueAt: raw.due_at ? String(raw.due_at).slice(0, 16) : "",
    instructions: raw.instructions || "",
    checklist: formatChecklist(raw.checklist),
    estimatedCost: raw.estimated_cost?.amount ?? raw.estimated_cost ?? "",
    approvedBudget: raw.approved_budget?.amount ?? raw.approved_budget ?? "",
  };
}

export function workOrderPayload(values) {
  const payload = {
    subject: values.subject,
    status: values.status || "open",
    priority: values.priority || "normal",
    target_type: toMorphType(values.targetType),
    target_uuid: values.targetUuid || undefined,
    instructions: values.instructions || undefined,
    due_at: values.dueAt || undefined,
    checklist: parseChecklist(values.checklist),
  };
  if (values.assigneeUuid) {
    payload.assignee_type = toMorphType("vendor");
    payload.assignee_uuid = values.assigneeUuid;
  }
  if (values.estimatedCost !== "") payload.estimated_cost = Number(values.estimatedCost);
  if (values.approvedBudget !== "") payload.approved_budget = Number(values.approvedBudget);
  return payload;
}

const WorkOrderForm = forwardRef(function WorkOrderForm({ formId, initialValues, mode = "create" }, ref) {
  const { vehicles, equipment, vendors } = useMaintenanceLookups();
  const methods = useForm({ defaultValues: { ...defaults, ...initialValues } });
  const { register, watch, setValue } = methods;
  const targetType = watch("targetType");

  useFormHandle(ref, methods, () => workOrderPayload(methods.getValues()));

  const assetOptions = targetType === "equipment" ? equipment : vehicles;

  return (
    <div id={formId} className="space-y-4" data-testid="work-order-form">
      <FormSection title="Work order" testId="wo-form-basic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Title *</Label>
            <Input {...register("subject", { required: true })} data-testid="field-subject" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger data-testid="field-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORK_ORDER_STATUSES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
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
          <div className="space-y-1.5">
            <Label>Due at</Label>
            <Input type="datetime-local" {...register("dueAt")} data-testid="field-due-at" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Asset & assignee" testId="wo-form-asset">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Asset type</Label>
            <Select
              value={watch("targetType")}
              onValueChange={(v) => {
                setValue("targetType", v);
                setValue("targetUuid", "");
              }}
            >
              <SelectTrigger data-testid="field-target-type">
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
            value={watch("targetUuid")}
            onChange={(v) => setValue("targetUuid", v)}
            options={assetOptions}
            testId="field-target-uuid"
          />
          <EntityAsyncSelect
            label="Assignee (vendor)"
            value={watch("assigneeUuid")}
            onChange={(v) => setValue("assigneeUuid", v)}
            options={vendors}
            allowClear
            testId="field-assignee"
          />
        </div>
      </FormSection>

      <FormSection title="Costs" testId="wo-form-costs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Estimated cost</Label>
            <Input type="number" min="0" step="0.01" {...register("estimatedCost")} data-testid="field-estimated-cost" />
          </div>
          <div className="space-y-1.5">
            <Label>Approved budget</Label>
            <Input type="number" min="0" step="0.01" {...register("approvedBudget")} data-testid="field-approved-budget" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Checklist & instructions" testId="wo-form-checklist">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Checklist (one item per line)</Label>
            <Textarea {...register("checklist")} rows={4} data-testid="field-checklist" />
          </div>
          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Textarea {...register("instructions")} rows={3} data-testid="field-instructions" />
          </div>
        </div>
      </FormSection>
      {mode === "edit" && <p className="text-xs text-[#4B5563]">Closing a work order creates a maintenance record on the backend.</p>}
    </div>
  );
});

export default WorkOrderForm;
