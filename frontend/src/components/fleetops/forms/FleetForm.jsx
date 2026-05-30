import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fleetFormSchema } from "@/lib/fleetops/schemas";
import { FLEET_STATUSES } from "@/lib/fleetops/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormHandle } from "./formUtils";

const defaultValues = {
  name: "",
  description: "",
  serviceAreaId: "",
  region: "",
  territory: "",
  status: "active",
  managerName: "",
};

export function fleetValuesFromApi(raw) {
  if (!raw) return { ...defaultValues };
  return {
    name: raw.name || "",
    description: raw.description || "",
    serviceAreaId: String(raw.service_area_uuid || raw.service_area?.uuid || ""),
    region: raw.meta?.region || raw.region || "",
    territory: raw.meta?.territory || "",
    status: raw.meta?.status || raw.status || "active",
    managerName: raw.meta?.manager_name || "",
  };
}

const FleetForm = forwardRef(function FleetForm({ formId, initialValues, serviceAreaOptions = [] }, ref) {
  const methods = useForm({
    resolver: zodResolver(fleetFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, watch, setValue, formState: { errors } } = methods;
  useFormHandle(ref, methods);

  return (
    <div id={formId} className="space-y-4" data-testid="fleet-form">
      <FormSection title="Fleet profile" testId="fleet-form-profile">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Fleet name *</Label>
            <Input {...register("name")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="fleet-field-name" />
            {errors.name && <p className="text-xs text-[#B91C1C]">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Description</Label>
            <Textarea {...register("description")} rows={2} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="fleet-field-description" />
          </div>
          <EntityAsyncSelect
            label="Service area"
            value={watch("serviceAreaId")}
            onChange={(v) => setValue("serviceAreaId", v)}
            options={serviceAreaOptions}
            allowClear
            testId="fleet-field-service-area"
          />
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Operational status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="fleet-field-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLEET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Region</Label>
            <Input {...register("region")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="fleet-field-region" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Territory</Label>
            <Input {...register("territory")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="fleet-field-territory" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Fleet manager</Label>
            <Input {...register("managerName")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="fleet-field-manager" />
          </div>
        </div>
      </FormSection>
    </div>
  );
});

export default FleetForm;
