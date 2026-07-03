import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { parseApiError } from "@/lib/errors";

/** Prefer public_id for API payloads; fall back to uuid. */
export function resourceOption(row, labelKeys = ["name", "public_id"], prefix = "") {
  const publicId = row?.public_id || row?.publicId;
  const uuid = row?.uuid || row?.id;
  const id = publicId || uuid;
  if (!id) return null;
  let label = "";
  for (const key of labelKeys) {
    if (row?.[key] != null && row[key] !== "") {
      label = String(row[key]);
      break;
    }
  }
  const suffix = publicId && label !== publicId ? ` (${publicId})` : "";
  return {
    id: String(id),
    label: `${prefix}${label || String(id)}${suffix}`,
    uuid: String(uuid || id),
    publicId: publicId ? String(publicId) : null,
  };
}

function placeOption(row) {
  const opt = resourceOption(row, ["name", "street1", "address", "public_id"]);
  if (!opt) return null;
  const city = row?.city ? ` — ${row.city}` : "";
  return { ...opt, label: `${opt.label}${city}` };
}

function orderOption(row) {
  const tracking = row?.tracking_number?.tracking_number || row?.tracking || row?.internal_id;
  const opt = resourceOption(row, ["internal_id", "public_id"], tracking ? `${tracking} · ` : "");
  return opt;
}

function trackingNumberOption(row) {
  const num = row?.tracking_number || row?.number;
  const opt = resourceOption(row, ["tracking_number", "public_id"]);
  if (!opt) return null;
  return { ...opt, label: num ? `${num} (${row?.public_id || opt.id})` : opt.label };
}

export function serviceQuoteOption(row) {
  const amount = row?.amount ?? row?.total;
  const currency = row?.currency || "";
  const price = amount != null ? ` — ${amount}${currency ? ` ${currency}` : ""}` : "";
  const opt = resourceOption(row, ["public_id", "request_id"]);
  if (!opt) return null;
  const uuid = String(row?.uuid || row?.id || opt.uuid || "");
  const publicId = opt.publicId || row?.public_id || row?.publicId || null;
  return {
    ...opt,
    id: uuid || opt.id,
    uuid,
    publicId,
    label: `${publicId || opt.label}${price}`,
  };
}

export function useResourceLookups(enabled = true, { includeServiceQuotes = false } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [places, setPlaces] = useState([]);
  const [orders, setOrders] = useState([]);
  const [entities, setEntities] = useState([]);
  const [payloads, setPayloads] = useState([]);
  const [trackingNumbers, setTrackingNumbers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceQuotes, setServiceQuotes] = useState([]);
  const [ownerOptions, setOwnerOptions] = useState([]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [placeRows, orderRows, entityRows, payloadRows, trackingRows, customerRows, quoteRows] =
        await Promise.all([
          fleetopsService.listPlaces({ limit: 500 }).catch(() => []),
          fleetopsService.listOrders({ limit: 500 }).catch(() => []),
          fleetopsService.listEntity().catch(() => []),
          fleetopsService.listPayload().catch(() => []),
          fleetopsService.listTrackingNumber().catch(() => []),
          fleetopsService.listCustomer({ limit: 500 }).catch(() => fleetopsService.listContact({ limit: 500 }).catch(() => [])),
          includeServiceQuotes
            ? fleetopsService.listServiceQuote({ limit: 500 }).catch(() => [])
            : Promise.resolve([]),
        ]);

      const placeOpts = placeRows.map(placeOption).filter(Boolean);
      const orderOpts = orderRows.map(orderOption).filter(Boolean);
      const entityOpts = entityRows.map((e) => resourceOption(e, ["name", "sku", "public_id"], "Entity · ")).filter(Boolean);
      const payloadOpts = payloadRows.map((p) => resourceOption(p, ["type", "public_id"], "Payload · ")).filter(Boolean);
      const trackingOpts = trackingRows.map(trackingNumberOption).filter(Boolean);
      const customerOpts = customerRows.map((c) => resourceOption(c, ["name", "email", "public_id"])).filter(Boolean);
      const quoteOpts = quoteRows.map(serviceQuoteOption).filter(Boolean);

      setPlaces(placeOpts);
      setOrders(orderOpts);
      setEntities(entityOpts);
      setPayloads(payloadOpts);
      setTrackingNumbers(trackingOpts);
      setCustomers(customerOpts);
      setServiceQuotes(quoteOpts);
      setOwnerOptions([
        ...orderOpts.map((o) => ({ ...o, label: `Order · ${o.label}` })),
        ...entityOpts,
      ]);
    } catch (err) {
      setError(parseApiError(err, "Could not load resource options"));
      setPlaces([]);
      setOrders([]);
      setEntities([]);
      setPayloads([]);
      setTrackingNumbers([]);
      setCustomers([]);
      setServiceQuotes([]);
      setOwnerOptions([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, includeServiceQuotes]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    loading,
    error,
    places,
    orders,
    entities,
    payloads,
    trackingNumbers,
    customers,
    serviceQuotes,
    ownerOptions,
    reload,
  };
}
