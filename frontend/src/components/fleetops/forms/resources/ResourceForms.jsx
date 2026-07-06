import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import EntityAsyncSelect from "@/components/fleetops/EntityAsyncSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormHandle } from "@/components/fleetops/forms/formUtils";
import { useResourceLookups, serviceQuoteOption } from "@/hooks/fleetops/useResourceLookups";
import { fleetopsService } from "@/services/fleetops";
import { parseApiError } from "@/lib/errors";
import { getTenantCurrency } from "@/lib/tenant/locale";
import { toast } from "sonner";
import {
  buildEntityApiPayload,
  buildPayloadApiPayload,
  buildPurchaseRateApiPayload,
  buildTrackingNumberApiPayload,
  buildTrackingStatusApiPayload,
  entityValuesFromApi,
  isUuid,
  payloadValuesFromApi,
  purchaseRateValuesFromApi,
  trackingNumberValuesFromApi,
  trackingStatusValuesFromApi,
} from "@/lib/fleetops/connectivityResourcePayloads";

/** Build a dropdown option for an already-linked service quote (edit mode). */
function seededQuoteOptionFrom(initialValues = {}) {
  const uuid =
    initialValues.service_quote_uuid ||
    (isUuid(initialValues.service_quote) ? initialValues.service_quote : "");
  const publicId =
    initialValues.service_quote_public_id ||
    (!isUuid(initialValues.service_quote) ? initialValues.service_quote : "");
  const id = uuid || publicId || initialValues.service_quote;
  if (!id) return null;
  const amount = initialValues.service_quote_amount;
  const currency = initialValues.service_quote_currency || "";
  const price =
    amount != null && amount !== "" ? ` — ${amount}${currency ? ` ${currency}` : ""}` : "";
  return {
    id: String(id),
    uuid: String(uuid || id),
    publicId: publicId ? String(publicId) : null,
    label: `${publicId || id}${price}`,
  };
}

function ResourceFormShell({ formId, children }) {
  return (
    <div id={formId} className="space-y-4">
      {children}
      <p className="text-xs text-[#4B5563]">Linked records can be selected from the dropdown or entered as public IDs.</p>
    </div>
  );
}

export const EntityForm = forwardRef(function EntityForm({ formId, initialValues }, ref) {
  const { payloads, loading } = useResourceLookups();
  const methods = useForm({ defaultValues: { ...entityValuesFromApi(null), ...initialValues } });
  const { register, watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildEntityApiPayload(methods.getValues()));

  return (
    <ResourceFormShell formId={formId}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Name *</Label><Input {...register("name", { required: true })} data-testid="field-name" /></div>
        <div><Label>Type *</Label><Input {...register("type", { required: true })} data-testid="field-type" placeholder="parcel, pallet…" /></div>
        <div><Label>SKU</Label><Input {...register("sku")} data-testid="field-sku" /></div>
        <div>
          <EntityAsyncSelect
            label="Payload"
            value={watch("payload") || ""}
            onChange={(v) => setValue("payload", v)}
            options={payloads}
            allowClear
            loading={loading}
            placeholder="Select payload…"
            searchPlaceholder="Filter payloads…"
            testId="field-payload"
          />
        </div>
        <div><Label>Weight</Label><Input {...register("weight")} data-testid="field-weight" /></div>
        <div>
          <Label>Weight unit</Label>
          <Select value={watch("weight_unit") || "kg"} onValueChange={(v) => setValue("weight_unit", v)}>
            <SelectTrigger data-testid="field-weight-unit"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["kg", "g", "lb", "oz"].map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label>Declared value</Label><Input {...register("declared_value")} data-testid="field-declared-value" /></div>
      </div>
      <div><Label>Description</Label><Textarea {...register("description")} rows={2} data-testid="field-description" /></div>
    </ResourceFormShell>
  );
});

export const PayloadForm = forwardRef(function PayloadForm({ formId, initialValues }, ref) {
  const { places, loading } = useResourceLookups();
  const methods = useForm({ defaultValues: { ...payloadValuesFromApi(null), ...initialValues } });
  const { register, watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildPayloadApiPayload(methods.getValues()));

  return (
    <ResourceFormShell formId={formId}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Type *</Label><Input {...register("type", { required: true })} data-testid="field-type" placeholder="default, parcel…" /></div>
        <div>
          <EntityAsyncSelect
            label="Pickup place *"
            value={watch("pickup") || ""}
            onChange={(v) => setValue("pickup", v, { shouldValidate: true })}
            options={places}
            required
            loading={loading}
            placeholder="Select pickup…"
            searchPlaceholder="Filter places…"
            testId="field-pickup"
          />
        </div>
        <div>
          <EntityAsyncSelect
            label="Dropoff place *"
            value={watch("dropoff") || ""}
            onChange={(v) => setValue("dropoff", v, { shouldValidate: true })}
            options={places}
            required
            loading={loading}
            placeholder="Select dropoff…"
            searchPlaceholder="Filter places…"
            testId="field-dropoff"
          />
        </div>
        <div><Label>COD amount</Label><Input {...register("cod_amount")} data-testid="field-cod-amount" /></div>
        <div><Label>COD currency</Label><Input {...register("cod_currency")} data-testid="field-cod-currency" placeholder={getTenantCurrency()} maxLength={3} /></div>
        <div>
          <Label>COD payment method</Label>
          <Select value={watch("cod_payment_method") || ""} onValueChange={(v) => setValue("cod_payment_method", v)}>
            <SelectTrigger data-testid="field-cod-payment-method"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["card", "check", "cash", "bank_transfer"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ResourceFormShell>
  );
});

export const TrackingNumberForm = forwardRef(function TrackingNumberForm({ formId, initialValues }, ref) {
  const { ownerOptions, loading } = useResourceLookups();
  const methods = useForm({ defaultValues: { ...trackingNumberValuesFromApi(null), ...initialValues } });
  const { register, watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildTrackingNumberApiPayload(methods.getValues()));

  return (
    <ResourceFormShell formId={formId}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Region *</Label><Input {...register("region", { required: true })} data-testid="field-region" placeholder="US, SG…" /></div>
        <div>
          <EntityAsyncSelect
            label="Owner (order or entity) *"
            value={watch("owner") || ""}
            onChange={(v) => setValue("owner", v, { shouldValidate: true })}
            options={ownerOptions}
            required
            loading={loading}
            placeholder="Select owner…"
            searchPlaceholder="Filter orders / entities…"
            testId="field-owner"
          />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={watch("type") || ""} onValueChange={(v) => setValue("type", v)}>
            <SelectTrigger data-testid="field-type"><SelectValue placeholder="Optional" /></SelectTrigger>
            <SelectContent>
              {["city", "province", "country"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={watch("status") || "active"} onValueChange={(v) => setValue("status", v)}>
            <SelectTrigger data-testid="field-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="inactive">inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </ResourceFormShell>
  );
});

export const TrackingStatusForm = forwardRef(function TrackingStatusForm({ formId, initialValues }, ref) {
  const { trackingNumbers, orders, loading } = useResourceLookups();
  const methods = useForm({ defaultValues: { ...trackingStatusValuesFromApi(null), ...initialValues } });
  const { register, watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildTrackingStatusApiPayload(methods.getValues()));

  return (
    <ResourceFormShell formId={formId}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <EntityAsyncSelect
            label="Tracking number"
            value={watch("tracking_number") || ""}
            onChange={(v) => setValue("tracking_number", v)}
            options={trackingNumbers}
            allowClear
            loading={loading}
            placeholder="Select tracking #…"
            testId="field-tracking-number"
          />
        </div>
        <div>
          <EntityAsyncSelect
            label="Order (alternative)"
            value={watch("order") || ""}
            onChange={(v) => setValue("order", v)}
            options={orders}
            allowClear
            loading={loading}
            placeholder="Or link via order…"
            testId="field-order"
          />
        </div>
        <div><Label>Status *</Label><Input {...register("status", { required: true })} data-testid="field-status" placeholder="In transit" /></div>
        <div><Label>Code</Label><Input {...register("code")} data-testid="field-code" placeholder="Auto-generated if empty" /></div>
        <div className="md:col-span-2"><Label>Details *</Label><Textarea {...register("details", { required: true })} rows={2} data-testid="field-details" /></div>
        <div><Label>Latitude *</Label><Input {...register("latitude", { required: true })} data-testid="field-latitude" placeholder="e.g. 1.3521" /></div>
        <div><Label>Longitude *</Label><Input {...register("longitude", { required: true })} data-testid="field-longitude" placeholder="e.g. 103.8198" /></div>
        <div><Label>Country</Label><Input {...register("country")} data-testid="field-country" placeholder="US" maxLength={2} /></div>
      </div>
    </ResourceFormShell>
  );
});

export const PurchaseRateForm = forwardRef(function PurchaseRateForm({ formId, initialValues }, ref) {
  const { payloads, customers, loading: lookupsLoading } = useResourceLookups();

  // Seed edit state from the existing record so the form is pre-populated.
  const seededQuote = useMemo(
    () => seededQuoteOptionFrom(initialValues || {}),
    // Depend on the primitive quote fields so identity stays stable across renders.
    [
      initialValues?.service_quote,
      initialValues?.service_quote_uuid,
      initialValues?.service_quote_public_id,
      initialValues?.service_quote_amount,
      initialValues?.service_quote_currency,
    ],
  );

  const [quotePayload, setQuotePayload] = useState(initialValues?.payload || "");
  const [serviceQuotes, setServiceQuotes] = useState(seededQuote ? [seededQuote] : []);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const userChangedPayload = useRef(false);
  const methods = useForm({ defaultValues: { ...purchaseRateValuesFromApi(null), ...initialValues } });
  const { watch, setValue } = methods;
  useFormHandle(ref, methods, () => buildPurchaseRateApiPayload(methods.getValues()));

  useEffect(() => {
    let cancelled = false;
    if (!quotePayload) {
      setServiceQuotes(seededQuote ? [seededQuote] : []);
      return undefined;
    }
    // On edit open we already know the linked quote — don't re-mint quotes
    // (queryServiceQuotes creates new ones) until the user changes the payload.
    if (!userChangedPayload.current && seededQuote) {
      return undefined;
    }
    setQuotesLoading(true);
    fleetopsService
      .queryServiceQuotes({ payload: quotePayload })
      .then((rows) => {
        if (cancelled) return;
        const opts = rows.map(serviceQuoteOption).filter(Boolean);
        // Keep the already-linked quote available so the selection is preserved.
        setServiceQuotes(
          seededQuote && !opts.some((o) => o.id === seededQuote.id) ? [seededQuote, ...opts] : opts,
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setServiceQuotes(seededQuote ? [seededQuote] : []);
          toast.error(parseApiError(err, "Could not load service quotes for this payload."));
        }
      })
      .finally(() => {
        if (!cancelled) setQuotesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [quotePayload, seededQuote]);

  const loading = lookupsLoading || quotesLoading;

  return (
    <ResourceFormShell formId={formId}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <EntityAsyncSelect
            label="Payload (to load quotes) *"
            value={quotePayload}
            onChange={(v) => {
              userChangedPayload.current = true;
              setQuotePayload(v);
              setValue("payload", v);
              setValue("service_quote", "");
            }}
            options={payloads}
            required
            loading={lookupsLoading}
            placeholder="Select payload…"
            searchPlaceholder="Filter payloads…"
            testId="field-quote-payload"
          />
        </div>
        <div>
          <EntityAsyncSelect
            label="Service quote *"
            value={watch("service_quote") || ""}
            onChange={(v) => setValue("service_quote", v, { shouldValidate: true })}
            options={serviceQuotes}
            required
            loading={loading}
            disabled={!quotePayload && !seededQuote}
            placeholder={quotePayload || seededQuote ? "Select quote…" : "Select payload first"}
            testId="field-service-quote"
          />
        </div>
        <div>
          <EntityAsyncSelect
            label="Customer"
            value={watch("customer") || ""}
            onChange={(v) => setValue("customer", v)}
            options={customers}
            allowClear
            loading={loading}
            placeholder="Contact / customer…"
            testId="field-customer"
          />
        </div>
      </div>
      <p className="text-xs text-[#4B5563]">
        Orders link to a purchase rate from the order itself, so there is no order field here.
      </p>
    </ResourceFormShell>
  );
});

export {
  entityValuesFromApi,
  payloadValuesFromApi,
  trackingNumberValuesFromApi,
  trackingStatusValuesFromApi,
  purchaseRateValuesFromApi,
};
