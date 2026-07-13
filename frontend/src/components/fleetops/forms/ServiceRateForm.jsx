import { forwardRef, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useFormHandle } from "@/components/fleetops/forms/formUtils";
import { normalizeServiceTypeOptions, serviceRateValuesFromApi } from "@/lib/fleetops/serviceRatePayloads";
import { fleetopsService } from "@/services/fleetops";
import { useTenant } from "@/contexts/TenantContext";
import { getCurrencyOptions, getTenantCurrency } from "@/lib/tenant/locale";

const CALC_METHODS = [
  { value: "fixed_rate", label: "Fixed rate" },
  { value: "per_meter", label: "Per distance" },
  { value: "fixed_meter", label: "Fixed meter tiers" },
  { value: "per_drop", label: "Per drop" },
  { value: "algo", label: "Algorithm" },
];

const defaults = {
  name: "",
  serviceType: "",
  baseFee: "",
  rateCalculationMethod: "fixed_rate",
  perDistanceFee: "",
  perDistanceUnit: "km",
  currency: getTenantCurrency(),
};

export { serviceRateValuesFromApi };

const ServiceRateForm = forwardRef(function ServiceRateForm({ formId, initialValues }, ref) {
  const { preferences } = useTenant();
  const currencyOptions = useMemo(() => getCurrencyOptions(), []);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const isEdit = Boolean(initialValues?.publicId || initialValues?.name || initialValues?.baseFee);
  const methods = useForm({
    defaultValues: {
      ...defaults,
      currency: isEdit ? "" : preferences?.currency || getTenantCurrency(),
      ...initialValues,
    },
  });
  const { register, watch, setValue } = methods;
  const rateCalculationMethod = watch("rateCalculationMethod");
  const serviceType = watch("serviceType");

  useEffect(() => {
    let active = true;
    (async () => {
      setTypesLoading(true);
      try {
        const rows = await fleetopsService.listServiceTypes();
        if (active) setServiceTypes(normalizeServiceTypeOptions(rows));
      } finally {
        if (active) setTypesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const serviceTypeOptions = useMemo(() => {
    const options = [...serviceTypes];
    if (serviceType && !options.some((option) => option.value === serviceType)) {
      options.unshift({ value: serviceType, label: serviceType, description: "Current value" });
    }
    return options;
  }, [serviceTypes, serviceType]);

  useFormHandle(ref, methods, () => {
    const values = methods.getValues();
    return {
      name: values.name,
      service_type: values.serviceType,
      base_fee: values.baseFee,
      rate_calculation_method: values.rateCalculationMethod,
      per_distance_fee: values.rateCalculationMethod === "per_meter" ? values.perDistanceFee : undefined,
      per_distance_unit: values.rateCalculationMethod === "per_meter" ? values.perDistanceUnit : undefined,
      currency: values.currency,
    };
  });

  return (
    <div id={formId} className="space-y-4" data-testid="service-rate-form-page">
      <div>
        <Label>Name *</Label>
        <Input {...register("name", { required: true })} data-testid="service-rate-name" />
      </div>
      <div>
        <Label>Service type *</Label>
        <Select
          value={serviceType || ""}
          onValueChange={(value) => setValue("serviceType", value, { shouldDirty: true, shouldValidate: true })}
          disabled={typesLoading || serviceTypeOptions.length === 0}
        >
          <SelectTrigger data-testid="service-rate-type">
            <SelectValue placeholder={typesLoading ? "Loading service types…" : "Select service type"} />
          </SelectTrigger>
          <SelectContent>
            {serviceTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
                {option.label !== option.value ? ` (${option.value})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!typesLoading && serviceTypeOptions.length === 0 ? (
          <p className="text-xs text-amber-700 mt-1">
            No service types available. Add an order config under FleetOps → Order config, then refresh.
          </p>
        ) : null}
      </div>
      <div>
        <Label>Calculation method</Label>
        <Select value={rateCalculationMethod} onValueChange={(v) => setValue("rateCalculationMethod", v)}>
          <SelectTrigger data-testid="service-rate-calc-method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALC_METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Base fee</Label>
          <Input type="number" {...register("baseFee")} data-testid="service-rate-base-fee" />
        </div>
        <div>
          <Label>Currency</Label>
          <SearchableSelect
            value={watch("currency") || ""}
            onValueChange={(v) => setValue("currency", v, { shouldDirty: true })}
            options={currencyOptions}
            placeholder="Select currency"
            data-testid="service-rate-currency"
          />
        </div>
      </div>
      {rateCalculationMethod === "per_meter" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Per-distance fee</Label>
            <Input type="number" {...register("perDistanceFee")} data-testid="service-rate-per-distance" />
          </div>
          <div>
            <Label>Distance unit</Label>
            <Select value={watch("perDistanceUnit")} onValueChange={(v) => setValue("perDistanceUnit", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">Per km</SelectItem>
                <SelectItem value="m">Per meter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
});

export default ServiceRateForm;
