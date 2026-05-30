import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vehicleFormSchema } from "@/lib/fleetops/schemas";
import { FUEL_TYPES, VEHICLE_STATUSES, VEHICLE_TYPES } from "@/lib/fleetops/constants";
import { useFormHandle } from "./formUtils";

const defaultValues = {
  name: "",
  plate: "",
  vin: "",
  make: "",
  model: "",
  year: "",
  type: "cargo_van",
  status: "operational",
  driverId: "",
  fuelType: "",
  odometer: "",
  payloadCapacity: "",
  cargoVolume: "",
  length: "",
  width: "",
  height: "",
  ownershipType: "",
  description: "",
  latitude: "",
  longitude: "",
};

export function vehicleValuesFromApi(raw) {
  if (!raw) return { ...defaultValues };
  return {
    name: raw.name || "",
    plate: raw.plate_number || raw.plate || "",
    vin: raw.vin || "",
    make: raw.make || "",
    model: raw.model || "",
    year: raw.year ?? "",
    type: raw.vehicle_type || raw.type || "cargo_van",
    status: raw.status || "operational",
    driverId: String(raw.driver_uuid || raw.driver_id || raw.driver?.uuid || ""),
    fuelType: raw.fuel_type || "",
    odometer: raw.odometer ?? "",
    payloadCapacity: raw.payload_capacity ?? "",
    cargoVolume: raw.cargo_volume ?? "",
    length: raw.length ?? "",
    width: raw.width ?? "",
    height: raw.height ?? "",
    ownershipType: raw.ownership_type || "",
    description: raw.description || "",
    latitude: raw.location?.latitude ?? raw.latitude ?? "",
    longitude: raw.location?.longitude ?? raw.longitude ?? "",
  };
}

const VehicleForm = forwardRef(function VehicleForm({ formId, initialValues, driverOptions = [] }, ref) {
  const methods = useForm({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, watch, setValue, formState: { errors } } = methods;
  useFormHandle(ref, methods);

  return (
    <div id={formId} className="space-y-4" data-testid="vehicle-form">
      <FormSection title="Identification" testId="vehicle-form-id">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-mono uppercase text-[#374151]">Display name *</Label>
            <Input {...register("name")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-name" />
            {errors.name && <p className="text-xs text-[#B91C1C]">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Plate *</Label>
            <Input {...register("plate")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="vehicle-field-plate" />
            {errors.plate && <p className="text-xs text-[#B91C1C]">{errors.plate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">VIN</Label>
            <Input {...register("vin")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="vehicle-field-vin" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Make</Label>
            <Input {...register("make")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-make" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Model</Label>
            <Input {...register("model")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-model" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Year</Label>
            <Input type="number" {...register("year")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-year" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Type</Label>
            <Select value={watch("type")} onValueChange={(v) => setValue("type", v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Status</Label>
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <EntityAsyncSelect
            label="Assigned driver"
            value={watch("driverId")}
            onChange={(v) => setValue("driverId", v)}
            options={driverOptions}
            allowClear
            testId="vehicle-field-driver"
          />
        </div>
      </FormSection>

      <FormSection title="Capacity & fuel" collapsible testId="vehicle-form-capacity">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Fuel type</Label>
            <Select value={watch("fuelType") || "__none__"} onValueChange={(v) => setValue("fuelType", v === "__none__" ? "" : v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-fuel">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {FUEL_TYPES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Odometer</Label>
            <Input type="number" {...register("odometer")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-odometer" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Payload capacity</Label>
            <Input type="number" {...register("payloadCapacity")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-payload" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Cargo volume</Label>
            <Input type="number" {...register("cargoVolume")} className="bg-[#F5F6F8] border-black/[0.08]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Length (m)</Label>
            <Input type="number" {...register("length")} className="bg-[#F5F6F8] border-black/[0.08]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Width (m)</Label>
            <Input type="number" {...register("width")} className="bg-[#F5F6F8] border-black/[0.08]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-mono uppercase text-[#374151]">Description</Label>
          <Textarea {...register("description")} rows={2} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="vehicle-field-description" />
        </div>
      </FormSection>
    </div>
  );
});

export default VehicleForm;
