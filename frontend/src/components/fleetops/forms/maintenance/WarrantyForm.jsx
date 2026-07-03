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
import { SUBJECT_TYPES, warrantyPayload, warrantyValuesFromApi } from "@/lib/fleetops/maintenancePayloads";

const defaults = {
  provider: "",
  policyNumber: "",
  startDate: "",
  endDate: "",
  coverage: "",
  terms: "",
  subjectType: "vehicle",
  subjectUuid: "",
  vendorUuid: "",
};

export { warrantyValuesFromApi, warrantyPayload };

const WarrantyForm = forwardRef(function WarrantyForm({ formId, initialValues }, ref) {
  const { vehicles, equipment, vendors } = useMaintenanceLookups();
  const methods = useForm({ defaultValues: { ...defaults, ...initialValues } });
  const { register, watch, setValue } = methods;
  const subjectType = watch("subjectType");

  useFormHandle(ref, methods, () => warrantyPayload(methods.getValues()));

  const assetOptions = subjectType === "equipment" ? equipment : vehicles;

  return (
    <div id={formId} className="space-y-4" data-testid="warranty-form">
      <FormSection title="Warranty" testId="warranty-form-basic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Provider *</Label>
            <Input {...register("provider", { required: true })} data-testid="field-provider" />
          </div>
          <div className="space-y-1.5">
            <Label>Policy number</Label>
            <Input {...register("policyNumber")} data-testid="field-policy-number" />
          </div>
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" {...register("startDate")} data-testid="field-start-date" />
          </div>
          <div className="space-y-1.5">
            <Label>End date</Label>
            <Input type="date" {...register("endDate")} data-testid="field-end-date" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Coverage</Label>
            <Textarea {...register("coverage")} rows={2} data-testid="field-coverage" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Terms</Label>
            <Textarea {...register("terms")} rows={2} data-testid="field-terms" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Linked asset" testId="warranty-form-asset">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Asset type</Label>
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
            label="Asset"
            value={watch("subjectUuid")}
            onChange={(v) => setValue("subjectUuid", v)}
            options={assetOptions}
            allowClear
            testId="field-subject-uuid"
          />
          <EntityAsyncSelect
            label="Vendor"
            value={watch("vendorUuid")}
            onChange={(v) => setValue("vendorUuid", v)}
            options={vendors}
            allowClear
            testId="field-vendor"
          />
        </div>
      </FormSection>
    </div>
  );
});

export default WarrantyForm;
