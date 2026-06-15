import { forwardRef, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fleetFormSchema } from "@/lib/fleetops/schemas";
import { FLEET_COLORS, FLEET_STATUSES } from "@/lib/fleetops/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormHandle } from "./formUtils";
import EntityCustomFieldsBlock from "@/components/fleetops/custom-fields/EntityCustomFieldsBlock";
import { customFieldValuesFromApi } from "@/lib/fleetops/customFieldValues";
import { fleetopsService } from "@/services/fleetops";

const defaultValues = {
  name: "",
  task: "",
  color: FLEET_COLORS[0],
  serviceAreaId: "",
  zoneId: "",
  vendorId: "",
  parentFleetId: "",
  status: "active",
};

export function fleetValuesFromApi(raw) {
  if (!raw) return { ...defaultValues, customFieldValues: {} };
  return {
    name: raw.name || "",
    task: raw.task || "",
    color: raw.color || FLEET_COLORS[0],
    serviceAreaId: String(raw.service_area_uuid || raw.service_area?.uuid || raw.service_area?.id || ""),
    zoneId: String(raw.zone_uuid || raw.zone?.uuid || raw.zone?.id || ""),
    vendorId: String(raw.vendor_uuid || raw.vendor?.public_id || raw.vendor?.uuid || ""),
    parentFleetId: String(raw.parent_fleet_uuid || raw.parent_fleet?.uuid || raw.parent_fleet?.id || ""),
    status: raw.status || "active",
    customFieldValues: customFieldValuesFromApi(raw),
  };
}

const FleetForm = forwardRef(function FleetForm(
  {
    formId,
    initialValues,
    serviceAreaOptions = [],
    vendorOptions = [],
    fleetOptions = [],
    excludeFleetId,
  },
  ref,
) {
  const methods = useForm({
    resolver: zodResolver(fleetFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, watch, setValue, formState: { errors } } = methods;
  const [customFieldValues, setCustomFieldValues] = useState(initialValues?.customFieldValues || {});
  useFormHandle(ref, methods, () => ({ customFieldValues }));

  const serviceAreaId = watch("serviceAreaId");
  const color = watch("color");
  const [zoneOptions, setZoneOptions] = useState([]);

  useEffect(() => {
    if (!serviceAreaId) {
      setZoneOptions([]);
      setValue("zoneId", "");
      return;
    }
    let cancelled = false;
    fleetopsService
      .listServiceAreaZones(serviceAreaId)
      .then((rows) => {
        if (cancelled) return;
        setZoneOptions(
          rows
            .map((z) => ({
              id: String(z?.uuid || z?.id || z?.public_id),
              label: z?.name || z?.public_id || String(z?.uuid || z?.id),
            }))
            .filter((z) => z.id),
        );
      })
      .catch(() => {
        if (!cancelled) setZoneOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceAreaId, setValue]);

  const parentFleetChoices = useMemo(
    () => fleetOptions.filter((f) => !excludeFleetId || String(f.id) !== String(excludeFleetId)),
    [fleetOptions, excludeFleetId],
  );

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
            <Label className="text-xs font-mono uppercase text-[#374151]">Task / notes</Label>
            <Textarea
              {...register("task")}
              rows={2}
              className="bg-[#F5F6F8] border-black/[0.08]"
              data-testid="fleet-field-description"
            />
          </div>
          <EntityAsyncSelect
            label="Service area"
            value={serviceAreaId}
            onChange={(v) => setValue("serviceAreaId", v)}
            options={serviceAreaOptions}
            allowClear
            testId="fleet-field-service-area"
          />
          <EntityAsyncSelect
            label="Zone"
            value={watch("zoneId")}
            onChange={(v) => setValue("zoneId", v)}
            options={zoneOptions}
            allowClear
            disabled={!serviceAreaId}
            testId="fleet-field-zone"
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
          <EntityAsyncSelect
            label="Parent fleet"
            value={watch("parentFleetId")}
            onChange={(v) => setValue("parentFleetId", v)}
            options={parentFleetChoices}
            allowClear
            testId="fleet-field-parent-fleet"
          />
          <EntityAsyncSelect
            label="Vendor / facilitator"
            value={watch("vendorId")}
            onChange={(v) => setValue("vendorId", v)}
            options={vendorOptions}
            allowClear
            testId="fleet-field-vendor"
          />
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Fleet color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {FLEET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  className={`h-8 w-8 rounded-md border-2 transition-transform ${color === c ? "border-[#0A0E1A] scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                  onClick={() => setValue("color", c)}
                  data-testid={`fleet-color-${c.replace("#", "")}`}
                />
              ))}
              <Input
                {...register("color")}
                className="w-[120px] bg-[#F5F6F8] border-black/[0.08] font-mono text-xs"
                data-testid="fleet-field-color"
              />
            </div>
          </div>
        </div>
      </FormSection>
      <EntityCustomFieldsBlock entityType="fleet" values={customFieldValues} onChange={setCustomFieldValues} />
    </div>
  );
});

export default FleetForm;
