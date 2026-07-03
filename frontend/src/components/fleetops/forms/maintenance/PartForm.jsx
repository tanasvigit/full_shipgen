import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormHandle } from "@/components/fleetops/forms/formUtils";
import { useMaintenanceLookups } from "@/hooks/fleetops/useMaintenanceLookups";
import { SUBJECT_TYPES, shortMorphType, toMorphType } from "@/lib/fleetops/maintenancePayloads";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaults = {
  name: "",
  sku: "",
  status: "active",
  manufacturer: "",
  model: "",
  barcode: "",
  description: "",
  quantityOnHand: "",
  unitCost: "",
  msrp: "",
  vendorUuid: "",
  warrantyUuid: "",
  assetType: "vehicle",
  assetUuid: "",
};

export function partValuesFromApi(raw) {
  if (!raw) return { ...defaults };
  const assetType = raw.asset_type || "vehicle";
  const shortType = shortMorphType(assetType);
  return {
    name: raw.name || "",
    sku: raw.sku || "",
    status: raw.status || "active",
    manufacturer: raw.manufacturer || "",
    model: raw.model || "",
    barcode: raw.barcode || "",
    description: raw.description || "",
    quantityOnHand: raw.quantity_on_hand ?? raw.quantity ?? "",
    unitCost: raw.unit_cost?.amount ?? raw.unit_cost ?? "",
    msrp: raw.msrp?.amount ?? raw.msrp ?? "",
    vendorUuid: String(raw.vendor_uuid || raw.vendor?.uuid || ""),
    warrantyUuid: String(raw.warranty_uuid || raw.warranty?.uuid || ""),
    assetType: shortType,
    assetUuid: String(raw.asset_uuid || ""),
  };
}

export function partPayload(values) {
  return {
    name: values.name,
    sku: values.sku || undefined,
    status: values.status || "active",
    manufacturer: values.manufacturer || undefined,
    model: values.model || undefined,
    barcode: values.barcode || undefined,
    description: values.description || undefined,
    quantity_on_hand: values.quantityOnHand !== "" ? Number(values.quantityOnHand) : undefined,
    unit_cost: values.unitCost !== "" ? Number(values.unitCost) : undefined,
    msrp: values.msrp !== "" ? Number(values.msrp) : undefined,
    vendor_uuid: values.vendorUuid || undefined,
    warranty_uuid: values.warrantyUuid || undefined,
    asset_type: values.assetUuid ? toMorphType(values.assetType) : undefined,
    asset_uuid: values.assetUuid || undefined,
  };
}

const PartForm = forwardRef(function PartForm({ formId, initialValues }, ref) {
  const { vehicles, equipment, vendors, warranties } = useMaintenanceLookups();
  const methods = useForm({ defaultValues: { ...defaults, ...initialValues } });
  const { register, watch, setValue } = methods;
  const assetType = watch("assetType");

  useFormHandle(ref, methods, (data) => partPayload(data));

  const assetOptions = assetType === "equipment" ? equipment : vehicles;

  return (
    <div id={formId} className="space-y-4" data-testid="part-form">
      <FormSection title="Part" testId="part-form-basic">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Name *</Label>
            <Input {...register("name", { required: true })} data-testid="field-name" />
          </div>
          <div className="space-y-1.5">
            <Label>SKU</Label>
            <Input {...register("sku")} data-testid="field-sku" />
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
          <div className="space-y-1.5">
            <Label>Barcode</Label>
            <Input {...register("barcode")} data-testid="field-barcode" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} data-testid="field-description" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Inventory & costs" testId="part-form-inventory">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quantity on hand</Label>
            <Input type="number" min="0" {...register("quantityOnHand")} data-testid="field-quantity" />
          </div>
          <div className="space-y-1.5">
            <Label>Unit cost</Label>
            <Input type="number" min="0" step="0.01" {...register("unitCost")} data-testid="field-unit-cost" />
          </div>
          <div className="space-y-1.5">
            <Label>MSRP</Label>
            <Input type="number" min="0" step="0.01" {...register("msrp")} data-testid="field-msrp" />
          </div>
          <EntityAsyncSelect
            label="Vendor"
            value={watch("vendorUuid")}
            onChange={(v) => setValue("vendorUuid", v)}
            options={vendors}
            allowClear
            testId="field-vendor"
          />
          <EntityAsyncSelect
            label="Warranty"
            value={watch("warrantyUuid")}
            onChange={(v) => setValue("warrantyUuid", v)}
            options={warranties}
            allowClear
            testId="field-warranty"
          />
        </div>
      </FormSection>

      <FormSection title="Linked asset" testId="part-form-asset">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Asset type</Label>
            <Select
              value={watch("assetType")}
              onValueChange={(v) => {
                setValue("assetType", v);
                setValue("assetUuid", "");
              }}
            >
              <SelectTrigger data-testid="field-asset-type">
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
            value={watch("assetUuid")}
            onChange={(v) => setValue("assetUuid", v)}
            options={assetOptions}
            allowClear
            testId="field-asset-uuid"
          />
        </div>
      </FormSection>
    </div>
  );
});

export default PartForm;
