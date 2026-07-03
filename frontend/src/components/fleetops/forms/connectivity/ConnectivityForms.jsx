import { forwardRef } from "react";
import { useForm } from "react-hook-form";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormHandle } from "@/components/fleetops/forms/formUtils";
import { useConnectivityLookups } from "@/hooks/fleetops/useConnectivityLookups";
import {
  buildDeviceApiPayload,
  buildSensorApiPayload,
  deviceValuesFromApi,
  sensorValuesFromApi,
} from "@/lib/fleetops/connectivityResourcePayloads";

export { deviceValuesFromApi, sensorValuesFromApi };

export const DeviceForm = forwardRef(function DeviceForm({ formId, initialValues }, ref) {
  const { telematics, loading: lookupsLoading } = useConnectivityLookups();
  const methods = useForm({ defaultValues: { ...deviceValuesFromApi(null), ...initialValues } });
  const { register, watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildDeviceApiPayload(methods.getValues()));

  const telematicUuid = watch("telematic_uuid") || "";

  return (
    <div id={formId} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Name *</Label>
          <Input {...register("name", { required: true })} data-testid="field-name" />
        </div>
        <div>
          <Label>IMEI</Label>
          <Input {...register("imei")} data-testid="field-imei" />
        </div>
        <div>
          <Label>Serial number</Label>
          <Input {...register("serial_number")} data-testid="field-serial-number" />
        </div>
        <div>
          <Label>Provider</Label>
          <Input {...register("provider")} data-testid="field-provider" />
        </div>
        <div>
          <Label>Type</Label>
          <Input {...register("type")} data-testid="field-type" />
        </div>
        <div>
          <Label>Status</Label>
          <Input {...register("status")} data-testid="field-status" placeholder="active" />
        </div>
        <div className="md:col-span-2">
          <EntityAsyncSelect
            label="Telematic"
            value={telematicUuid}
            onChange={(value) => {
              if (!value) {
                setValue("telematic_uuid", null);
                setValue("telematic", "");
                return;
              }
              setValue("telematic_uuid", value);
              setValue("telematic", value);
            }}
            options={telematics}
            allowClear
            loading={lookupsLoading}
            placeholder="Select telematic…"
            searchPlaceholder="Filter telematics…"
            testId="field-telematic"
          />
          <p className="text-xs text-[#6B7280] mt-1">Clear to unlink this device from telematics.</p>
        </div>
      </div>
    </div>
  );
});

export const SensorForm = forwardRef(function SensorForm({ formId, initialValues }, ref) {
  const { devices, loading: lookupsLoading } = useConnectivityLookups();
  const methods = useForm({ defaultValues: { ...sensorValuesFromApi(null), ...initialValues } });
  const { register, watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildSensorApiPayload(methods.getValues()));

  const deviceUuid = watch("device_uuid") || watch("device") || "";

  return (
    <div id={formId} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Name *</Label>
          <Input {...register("name", { required: true })} data-testid="field-name" />
        </div>
        <div>
          <Label>Type</Label>
          <Input {...register("type")} data-testid="field-type" placeholder="temperature, door…" />
        </div>
        <div>
          <EntityAsyncSelect
            label="Device"
            value={deviceUuid}
            onChange={(value) => {
              setValue("device_uuid", value);
              setValue("device", value);
            }}
            options={devices}
            allowClear
            loading={lookupsLoading}
            placeholder="Select device…"
            searchPlaceholder="Filter devices…"
            testId="field-device"
          />
        </div>
        <div>
          <Label>Unit</Label>
          <Input {...register("unit")} data-testid="field-unit" placeholder="°C, %, psi…" />
        </div>
        <div>
          <Label>Min threshold</Label>
          <Input {...register("min_threshold")} data-testid="field-min-threshold" />
        </div>
        <div>
          <Label>Max threshold</Label>
          <Input {...register("max_threshold")} data-testid="field-max-threshold" />
        </div>
        <div>
          <Label>Status</Label>
          <Input {...register("status")} data-testid="field-status" placeholder="active" />
        </div>
      </div>
    </div>
  );
});
