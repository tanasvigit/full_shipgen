import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormHandle } from "@/components/fleetops/forms/formUtils";
import { useMaintenanceLookups } from "@/hooks/fleetops/useMaintenanceLookups";
import { SUBJECT_TYPES, shortMorphType, toMorphType } from "@/lib/fleetops/maintenancePayloads";

const defaults = {
  name: "",
  code: "",
  type: "",
  status: "active",
  serialNumber: "",
  manufacturer: "",
  model: "",
  equipableType: "vehicle",
  equipableUuid: "",
  warrantyUuid: "",
  purchasedAt: "",
  purchasePrice: "",
};

export function equipmentValuesFromApi(raw) {
  if (!raw) return { ...defaults };
  const equipableType = raw.equipable_type || raw.equipable?.type || "vehicle";
  const shortType = shortMorphType(equipableType);
  return {
    name: raw.name || "",
    code: raw.code || "",
    type: raw.type || "",
    status: raw.status || "active",
    serialNumber: raw.serial_number || raw.serial || "",
    manufacturer: raw.manufacturer || "",
    model: raw.model || "",
    equipableType: shortType,
    equipableUuid: String(raw.equipable_uuid || raw.equipable?.uuid || raw.vehicle_id || ""),
    warrantyUuid: String(raw.warranty_uuid || raw.warranty?.uuid || ""),
    purchasedAt: raw.purchased_at ? String(raw.purchased_at).slice(0, 10) : "",
    purchasePrice: raw.purchase_price?.amount ?? raw.purchase_price ?? "",
  };
}

export function equipmentPayload(values) {
  return {
    name: values.name,
    code: values.code || undefined,
    type: values.type || undefined,
    status: values.status || "active",
    serial_number: values.serialNumber || undefined,
    manufacturer: values.manufacturer || undefined,
    model: values.model || undefined,
    equipable_type: values.equipableUuid ? toMorphType(values.equipableType) : undefined,
    equipable_uuid: values.equipableUuid || undefined,
    warranty_uuid: values.warrantyUuid || undefined,
    purchased_at: values.purchasedAt || undefined,
    purchase_price: values.purchasePrice !== "" ? Number(values.purchasePrice) : undefined,
  };
}

const EquipmentForm = forwardRef(function EquipmentForm({ formId, initialValues }, ref) {
  const { vehicles, equipment, warranties } = useMaintenanceLookups();
  const methods = useForm({ defaultValues: { ...defaults, ...initialValues } });
  const { register, watch, setValue } = methods;
  const equipableType = watch("equipableType");

  useFormHandle(ref, methods, () => equipmentPayload(methods.getValues()));

  const attachOptions = equipableType === "equipment" ? equipment : vehicles;

  return (
    <div id={formId} className="space-y-4" data-testid="equipment-form">
      <FormSection title="Equipment" testId="equipment-form-basic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Name *</Label>
            <Input {...register("name", { required: true })} data-testid="field-name" />
          </div>
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input {...register("code")} data-testid="field-code" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Input {...register("type")} placeholder="e.g. liftgate, reefer" data-testid="field-type" />
          </div>
          <div className="space-y-1.5">
            <Label>Serial number</Label>
            <Input {...register("serialNumber")} data-testid="field-serial" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Input {...register("status")} data-testid="field-status" />
          </div>
          <div className="space-y-1.5">
            <Label>Manufacturer</Label>
            <Input {...register("manufacturer")} data-testid="field-manufacturer" />
          </div>
          <div className="space-y-1.5">
            <Label>Model</Label>
            <Input {...register("model")} data-testid="field-model" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Attachment" testId="equipment-form-attach">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Attached to type</Label>
            <Select
              value={watch("equipableType")}
              onValueChange={(v) => {
                setValue("equipableType", v);
                setValue("equipableUuid", "");
              }}
            >
              <SelectTrigger data-testid="field-equipable-type">
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
            label="Attached to"
            value={watch("equipableUuid")}
            onChange={(v) => setValue("equipableUuid", v)}
            options={attachOptions}
            allowClear
            testId="field-equipable-uuid"
          />
          <EntityAsyncSelect
            label="Warranty"
            value={watch("warrantyUuid")}
            onChange={(v) => setValue("warrantyUuid", v)}
            options={warranties}
            allowClear
            testId="field-warranty"
          />
          <div className="space-y-1.5">
            <Label>Purchased at</Label>
            <Input type="date" {...register("purchasedAt")} data-testid="field-purchased-at" />
          </div>
          <div className="space-y-1.5">
            <Label>Purchase price</Label>
            <Input type="number" min="0" step="0.01" {...register("purchasePrice")} data-testid="field-purchase-price" />
          </div>
        </div>
      </FormSection>
    </div>
  );
});

export default EquipmentForm;
