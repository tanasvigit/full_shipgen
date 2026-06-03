import { forwardRef, useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormSection from "@/components/fleetops/FormSection";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderFormSchema } from "@/lib/fleetops/schemas";
import { DRIVER_SKILLS, ORDER_PRIORITIES, POD_METHODS } from "@/lib/fleetops/constants";
import { Plus, Trash2 } from "lucide-react";
import { useFormHandle } from "./formUtils";
import EntityCustomFieldsBlock from "@/components/fleetops/custom-fields/EntityCustomFieldsBlock";

const emptyWaypoint = () => ({ id: `wp-${Date.now()}-${Math.random()}`, placeId: "", customerId: "", type: "dropoff" });
const emptyEntity = () => ({ id: `ent-${Date.now()}-${Math.random()}`, name: "", sku: "", destinationId: "", quantity: 1, weight: "" });

const defaultValues = {
  orderConfigId: "",
  type: "",
  internalId: "",
  scheduledAt: "",
  customerId: "",
  facilitatorId: "",
  driverId: "",
  vehicleId: "",
  serviceType: "",
  status: "created",
  priority: "medium",
  pickupId: "",
  dropoffId: "",
  returnId: "",
  multiWaypoint: false,
  waypoints: [emptyWaypoint()],
  entities: [emptyEntity()],
  adhoc: false,
  adhocDistance: "",
  dispatched: true,
  podRequired: false,
  podMethod: "scan",
  timeWindowStart: "",
  timeWindowEnd: "",
  requiredSkills: [],
  orchestratorPriority: 50,
  notes: "",
  dispatchNotes: "",
  instructions: "",
  metadataPairs: [{ id: "meta-0", key: "", value: "" }],
};

export function orderValuesFromApi(raw, lookups = {}) {
  if (!raw) return { ...defaultValues, orderConfigId: lookups.defaultConfigId || "" };
  const payload = raw.payload || {};
  return {
    ...defaultValues,
    orderConfigId: raw.order_config_uuid || raw.order_config?.uuid || lookups.defaultConfigId || "",
    type: raw.type || "",
    internalId: raw.internal_id || "",
    scheduledAt: raw.scheduled_at ? String(raw.scheduled_at).slice(0, 16) : "",
    customerId: String(raw.customer_uuid || raw.customer?.uuid || ""),
    facilitatorId: String(raw.facilitator_uuid || raw.facilitator?.uuid || ""),
    driverId: String(raw.driver_uuid || raw.driver_assigned_uuid || raw.driver?.uuid || ""),
    vehicleId: String(raw.vehicle_uuid || raw.vehicle_assigned_uuid || ""),
    serviceType: raw.service_type || "",
    status: raw.status || "created",
    priority: raw.priority || "medium",
    pickupId: String(payload.pickup_uuid || raw.pickup_uuid || ""),
    dropoffId: String(payload.dropoff_uuid || raw.dropoff_uuid || ""),
    returnId: String(payload.return_uuid || ""),
    multiWaypoint: Boolean(payload.waypoints?.length),
    waypoints: (payload.waypoints || []).map((w, i) => ({
      id: `wp-${i}`,
      placeId: w.place_uuid || w.place?.uuid || "",
      customerId: w.customer || "",
      type: w.type || "dropoff",
    })),
    entities: (payload.entities || []).map((e, i) => ({
      id: `ent-${i}`,
      name: e.name || "",
      sku: e.sku || "",
      destinationId: e.destination_uuid || "",
      quantity: e.quantity ?? 1,
      weight: e.weight ?? "",
    })),
    adhoc: Boolean(raw.adhoc),
    adhocDistance: raw.adhoc_distance ?? "",
    dispatched: raw.dispatched !== false,
    podRequired: Boolean(raw.pod_required),
    podMethod: raw.pod_method || "scan",
    timeWindowStart: raw.time_window_start || "",
    timeWindowEnd: raw.time_window_end || "",
    requiredSkills: raw.required_skills || [],
    orchestratorPriority: raw.orchestrator_priority ?? 50,
    notes: raw.notes || "",
    dispatchNotes: raw.dispatch_notes || "",
    instructions: raw.instructions || "",
    metadataPairs: Object.entries(raw.meta || {}).map(([key, value], i) => ({
      id: `meta-${i}`,
      key,
      value: String(value),
    })),
  };
}

const OrderForm = forwardRef(function OrderForm(
  {
    formId,
    initialValues,
    orderConfigOptions = [],
    customerOptions = [],
    facilitatorOptions = [],
    driverOptions = [],
    vehicleOptions = [],
    placeOptions = [],
    mode = "create",
  },
  ref,
) {
  const methods = useForm({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { ...defaultValues, ...initialValues },
  });
  const { register, watch, setValue, control, formState: { errors } } = methods;
  const [customFieldValues, setCustomFieldValues] = useState(initialValues?.customFieldValues || {});
  useFormHandle(ref, methods, () => ({ customFieldValues }));

  const { fields: waypointFields, append: appendWp, remove: removeWp } = useFieldArray({
    control,
    name: "waypoints",
  });
  const { fields: entityFields, append: appendEnt, remove: removeEnt } = useFieldArray({
    control,
    name: "entities",
  });

  const multiWaypoint = watch("multiWaypoint");
  const podRequired = watch("podRequired");
  const requiredSkills = watch("requiredSkills") || [];
  const orderConfigId = watch("orderConfigId");

  useEffect(() => {
    if (!orderConfigId && orderConfigOptions[0]?.id) {
      setValue("orderConfigId", orderConfigOptions[0].id);
    }
  }, [orderConfigId, orderConfigOptions, setValue]);

  const destinationPlaces = placeOptions.filter((p) => {
    const ids = [watch("pickupId"), watch("dropoffId"), watch("returnId"), ...waypointFields.map((_, i) => watch(`waypoints.${i}.placeId`))].filter(Boolean);
    return ids.includes(p.id);
  });

  return (
    <div id={formId} className="space-y-4" data-testid="order-form">
      <FormSection title="Order type & schedule" testId="order-form-type">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityAsyncSelect
            label="Order type"
            value={orderConfigId}
            onChange={(v) => setValue("orderConfigId", v)}
            options={orderConfigOptions}
            required
            testId="order-field-config"
          />
          {errors.orderConfigId && <p className="text-xs text-[#B91C1C] md:col-span-2">{errors.orderConfigId.message}</p>}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Internal reference</Label>
            <Input {...register("internalId")} className="bg-[#F5F6F8] border-black/[0.08] font-mono" data-testid="order-field-internal-id" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Scheduled at</Label>
            <Input type="datetime-local" {...register("scheduledAt")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="order-field-scheduled" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Priority</Label>
            <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v)}>
              <SelectTrigger className="bg-[#F5F6F8] border-black/[0.08]" data-testid="order-field-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase text-[#374151]">Service type</Label>
            <Input {...register("serviceType")} className="bg-[#F5F6F8] border-black/[0.08]" data-testid="order-field-service-type" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Customer & parties" testId="order-form-customer">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityAsyncSelect label="Customer" value={watch("customerId")} onChange={(v) => setValue("customerId", v)} options={customerOptions} allowClear testId="order-field-customer" />
          <EntityAsyncSelect label="Facilitator / vendor" value={watch("facilitatorId")} onChange={(v) => setValue("facilitatorId", v)} options={facilitatorOptions} allowClear testId="order-field-facilitator" />
        </div>
      </FormSection>

      <FormSection title="Route & stops" description="Pickup/drop-off UUIDs map to FleetOps places" testId="order-form-route">
        <label className="flex items-center gap-2 text-sm mb-2">
          <Checkbox checked={multiWaypoint} onCheckedChange={(c) => setValue("multiWaypoint", Boolean(c))} data-testid="order-field-multi-waypoint" />
          Multi-stop route (waypoints array)
        </label>
        {!multiWaypoint ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EntityAsyncSelect label="Pickup *" value={watch("pickupId")} onChange={(v) => setValue("pickupId", v)} options={placeOptions} testId="order-field-pickup" />
            <EntityAsyncSelect label="Drop-off *" value={watch("dropoffId")} onChange={(v) => setValue("dropoffId", v)} options={placeOptions} testId="order-field-dropoff" />
            <EntityAsyncSelect label="Return" value={watch("returnId")} onChange={(v) => setValue("returnId", v)} options={placeOptions} allowClear testId="order-field-return" />
          </div>
        ) : (
          <div className="space-y-3">
            {waypointFields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap gap-2 items-end border border-black/[0.06] rounded-md p-3">
                <EntityAsyncSelect
                  label={`Stop ${index + 1}`}
                  value={watch(`waypoints.${index}.placeId`)}
                  onChange={(v) => setValue(`waypoints.${index}.placeId`, v)}
                  options={placeOptions}
                  testId={`order-waypoint-place-${index}`}
                />
                <div className="space-y-1.5 w-32">
                  <Label className="text-xs font-mono uppercase">Type</Label>
                  <Select value={watch(`waypoints.${index}.type`)} onValueChange={(v) => setValue(`waypoints.${index}.type`, v)}>
                    <SelectTrigger className="h-9 bg-[#F5F6F8]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup</SelectItem>
                      <SelectItem value="dropoff">Drop-off</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeWp(index)} disabled={waypointFields.length <= 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendWp(emptyWaypoint())} data-testid="order-add-waypoint">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add stop
            </Button>
          </div>
        )}
        {errors.pickupId && <p className="text-xs text-[#B91C1C]">{errors.pickupId.message}</p>}
      </FormSection>

      <FormSection title="Cargo / entities" collapsible testId="order-form-entities">
        {entityFields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end border-b border-black/[0.04] pb-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase">Name</Label>
              <Input {...register(`entities.${index}.name`)} className="h-9 bg-[#F5F6F8] text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase">SKU</Label>
              <Input {...register(`entities.${index}.sku`)} className="h-9 bg-[#F5F6F8] text-sm font-mono" />
            </div>
            <EntityAsyncSelect
              label="Destination"
              value={watch(`entities.${index}.destinationId`)}
              onChange={(v) => setValue(`entities.${index}.destinationId`, v)}
              options={destinationPlaces}
              allowClear
            />
            <div className="space-y-1">
              <Label className="text-[10px] font-mono uppercase">Qty</Label>
              <Input type="number" {...register(`entities.${index}.quantity`)} className="h-9 bg-[#F5F6F8] text-sm" />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => removeEnt(index)} disabled={entityFields.length <= 1}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => appendEnt(emptyEntity())} data-testid="order-add-entity">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add line item
        </Button>
      </FormSection>

      <FormSection title="Assignments" testId="order-form-assignments">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EntityAsyncSelect label="Driver" value={watch("driverId")} onChange={(v) => setValue("driverId", v)} options={driverOptions} allowClear testId="order-field-driver" />
          <EntityAsyncSelect label="Vehicle" value={watch("vehicleId")} onChange={(v) => setValue("vehicleId", v)} options={vehicleOptions} allowClear testId="order-field-vehicle" />
        </div>
        <label className="flex items-center gap-2 text-sm mt-2">
          <Checkbox checked={watch("dispatched")} onCheckedChange={(c) => setValue("dispatched", Boolean(c))} data-testid="order-field-dispatched" />
          Dispatch immediately after create
        </label>
      </FormSection>

      <FormSection title="Proof & time windows" collapsible testId="order-form-pod">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox checked={podRequired} onCheckedChange={(c) => setValue("podRequired", Boolean(c))} data-testid="order-field-pod-required" />
            Proof of delivery required
          </label>
          {podRequired && (
            <div className="space-y-1.5">
              <Label className="text-xs font-mono uppercase">POD method</Label>
              <Select value={watch("podMethod")} onValueChange={(v) => setValue("podMethod", v)}>
                <SelectTrigger data-testid="order-field-pod-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POD_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Window start</Label>
            <Input type="time" {...register("timeWindowStart")} className="bg-[#F5F6F8]" data-testid="order-field-tw-start" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Window end</Label>
            <Input type="time" {...register("timeWindowEnd")} className="bg-[#F5F6F8]" data-testid="order-field-tw-end" />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {DRIVER_SKILLS.map((skill) => (
            <label key={skill.value} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={requiredSkills.includes(skill.value)}
                onCheckedChange={(c) => {
                  const next = c ? [...requiredSkills, skill.value] : requiredSkills.filter((s) => s !== skill.value);
                  setValue("requiredSkills", next);
                }}
              />
              {skill.label}
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection title="Notes" testId="order-form-notes">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Customer / delivery notes</Label>
            <Textarea {...register("notes")} rows={2} className="bg-[#F5F6F8]" data-testid="order-field-notes" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Dispatch notes</Label>
            <Textarea {...register("dispatchNotes")} rows={2} className="bg-[#F5F6F8]" data-testid="order-field-dispatch-notes" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-mono uppercase">Driver instructions</Label>
            <Textarea {...register("instructions")} rows={2} className="bg-[#F5F6F8]" data-testid="order-field-instructions" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Advanced" collapsible defaultOpen={false} testId="order-form-advanced">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={watch("adhoc")} onCheckedChange={(c) => setValue("adhoc", Boolean(c))} data-testid="order-field-adhoc" />
          Ad-hoc order
        </label>
        {watch("adhoc") && (
          <div className="space-y-1.5 mt-2 max-w-xs">
            <Label className="text-xs font-mono uppercase">Ad-hoc distance (km)</Label>
            <Input type="number" {...register("adhocDistance")} className="bg-[#F5F6F8]" data-testid="order-field-adhoc-distance" />
          </div>
        )}
        <div className="space-y-1.5 mt-3 max-w-xs">
          <Label className="text-xs font-mono uppercase">Orchestrator priority</Label>
          <Input type="number" {...register("orchestratorPriority")} className="bg-[#F5F6F8]" data-testid="order-field-orchestrator-priority" />
        </div>
      </FormSection>
      <EntityCustomFieldsBlock entityType="order" values={customFieldValues} onChange={setCustomFieldValues} />
    </div>
  );
});

export default OrderForm;
