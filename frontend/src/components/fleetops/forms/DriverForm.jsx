import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { useFormHandle } from "./formUtils";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { driverFormSchema } from "@/lib/fleetops/schemas";
import { DRIVER_SKILLS, DRIVER_STATUSES } from "@/lib/fleetops/constants";

const defaultValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  licenseNumber: "",
  internalId: "",
  country: "",
  city: "",
  status: "active",
  vehicleId: "",
  vendorId: "",
  latitude: "",
  longitude: "",
  skills: [],
  maxTravelTime: "",
  maxDistance: "",
  timeWindowStart: "",
  timeWindowEnd: "",
};

export function driverValuesFromApi(raw) {
  if (!raw) return { ...defaultValues };
  return {
    name: raw.name || "",
    email: raw.email || raw.user?.email || "",
    phone: raw.phone || raw.user?.phone || "",
    password: "",
    licenseNumber: raw.drivers_license_number || "",
    internalId: raw.internal_id || "",
    country: raw.country || "",
    city: raw.city || "",
    status: raw.status || "active",
    vehicleId: String(raw.vehicle_uuid || raw.vehicle_id || raw.vehicle?.uuid || ""),
    vendorId: String(raw.vendor_uuid || raw.vendor?.public_id || ""),
    latitude: raw.location?.latitude ?? raw.latitude ?? "",
    longitude: raw.location?.longitude ?? raw.longitude ?? "",
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    maxTravelTime: raw.max_travel_time ?? "",
    maxDistance: raw.max_distance ?? "",
    timeWindowStart: raw.time_window_start || "",
    timeWindowEnd: raw.time_window_end || "",
  };
}

const DriverForm = forwardRef(function DriverForm(
  { formId, initialValues, vehicleOptions = [], vendorOptions = [], mode = "create" },
  ref,
) {
  const methods = useForm({
    resolver: zodResolver(driverFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = methods;
  useFormHandle(ref, methods);

  const skills = watch("skills") || [];

  return (
    <div id={formId} className="space-y-4" data-testid="driver-form">
      <FormSection title="Identity" description="Driver profile and contact details" testId="driver-form-identity">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Full name *</Label>
            <Input {...register("name")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-name" />
            {errors.name && <p className="text-xs text-[#B91C1C]">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Internal ID</Label>
            <Input {...register("internalId")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-internal-id" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Email *</Label>
            <Input type="email" {...register("email")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-email" />
            {errors.email && <p className="text-xs text-[#B91C1C]">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Phone *</Label>
            <Input {...register("phone")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-phone" />
            {errors.phone && <p className="text-xs text-[#B91C1C]">{errors.phone.message}</p>}
          </div>
          {mode === "create" && (
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-mono uppercase text-[#374151]">Password (optional)</Label>
              <Input type="password" {...register("password")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-password" />
            </div>
          )}
        </div>
      </FormSection>

      <FormSection title="Compliance & license" collapsible defaultOpen testId="driver-form-compliance">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">License number</Label>
            <Input {...register("licenseNumber")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-license" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Country (ISO2)</Label>
            <Input {...register("country")} maxLength={2} className="bg-[#F5F6F8] border-black/[0.08] uppercase" data-testid="driver-field-country" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">City</Label>
            <Input {...register("city")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-city" />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-mono uppercase text-[#374151]">Skills</Label>
          <div className="flex flex-wrap gap-3">
            {DRIVER_SKILLS.map((skill) => {
              const checked = skills.includes(skill.value);
              return (
                <label key={skill.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      const next = c
                        ? [...skills, skill.value]
                        : skills.filter((s) => s !== skill.value);
                      setValue("skills", next);
                    }}
                    data-testid={`driver-skill-${skill.value}`}
                  />
                  {skill.label}
                </label>
              );
            })}
          </div>
        </div>
      </FormSection>

      <FormSection title="Assignments" collapsible testId="driver-form-assignments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityAsyncSelect
            label="Assigned vehicle"
            value={watch("vehicleId")}
            onChange={(v) => setValue("vehicleId", v)}
            options={vehicleOptions}
            allowClear
            testId="driver-field-vehicle"
          />
          <EntityAsyncSelect
            label="Vendor"
            value={watch("vendorId")}
            onChange={(v) => setValue("vendorId", v)}
            options={vendorOptions}
            allowClear
            testId="driver-field-vendor"
          />
        </div>
      </FormSection>

      <FormSection title="Availability & location" collapsible defaultOpen={false} testId="driver-form-availability">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Max travel time (min)</Label>
            <Input type="number" {...register("maxTravelTime")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-max-travel" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Max distance (km)</Label>
            <Input type="number" {...register("maxDistance")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-max-distance" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Time window start</Label>
            <Input type="time" {...register("timeWindowStart")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-tw-start" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Time window end</Label>
            <Input type="time" {...register("timeWindowEnd")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="driver-field-tw-end" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Latitude</Label>
            <Input {...register("latitude")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="driver-field-lat" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Longitude</Label>
            <Input {...register("longitude")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="driver-field-lng" />
          </div>
        </div>
      </FormSection>
    </div>
  );
});

export default DriverForm;
