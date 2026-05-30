import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { fleetopsCache } from "@/domain/fleetops/cache/store";

function toOption(row, labelKeys = ["name", "public_id"]) {
  const id = row?.uuid || row?.id || row?.public_id;
  if (!id) return null;
  let label = "";
  for (const key of labelKeys) {
    if (row?.[key]) {
      label = String(row[key]);
      break;
    }
  }
  return { id: String(id), label: label || String(id) };
}

export function useFleetopsLookups(enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderConfigs, setOrderConfigs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [places, setPlaces] = useState([]);
  const [fleets, setFleets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [facilitators, setFacilitators] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [configs, driverRows, vehicleRows, placeRows, fleetRows, contactRows, vendorRows, areaRows] =
        await Promise.all([
          fleetopsService.listOrderConfigs(),
          fleetopsService.listDrivers(),
          fleetopsService.listVehicles(),
          fleetopsService.listPlaces(),
          fleetopsService.listFleets(),
          fleetopsService.listContacts(),
          fleetopsService.listVendors(),
          fleetopsService.listServiceAreas(),
        ]);

      setOrderConfigs(
        configs
          .map((c) => toOption(c, ["name", "key", "public_id"]))
          .filter(Boolean),
      );
      setDrivers(driverRows.map((d) => toOption(d, ["name", "public_id"])).filter(Boolean));
      setVehicles(vehicleRows.map((v) => toOption(v, ["name", "plate_number", "public_id"])).filter(Boolean));
      setPlaces(
        placeRows
          .map((p) => ({
            id: String(p?.uuid || p?.id || p?.public_id),
            label: p?.address || p?.street1 || p?.name || p?.public_id,
            lat: Number(p?.latitude || 0),
            lng: Number(p?.longitude || 0),
          }))
          .filter((p) => p.id),
      );
      setFleets(fleetRows.map((f) => toOption(f)).filter(Boolean));
      setCustomers(
        contactRows
          .filter((c) => String(c?.type || "").toLowerCase() !== "facilitator")
          .map((c) => toOption(c, ["name", "public_id"]))
          .filter(Boolean),
      );
      setFacilitators(
        vendorRows
          .concat(contactRows.filter((c) => String(c?.type || "").toLowerCase() === "facilitator"))
          .map((v) => toOption(v, ["name", "public_id"]))
          .filter(Boolean),
      );
      setServiceAreas(areaRows.map((a) => toOption(a)).filter(Boolean));
    } catch (err) {
      setError(err?.friendlyMessage || err?.message || "Failed to load FleetOps lookups");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!enabled) return undefined;
    return fleetopsCache.subscribe((key) => {
      const parts = Array.isArray(key) ? key : [key];
      if (!parts[0]?.includes?.("fleetops")) return;
      const tag = parts.join(":");
      if (
        tag.includes("lookups") ||
        tag.includes("fleets") ||
        tag.includes("drivers") ||
        tag.includes("vehicles") ||
        tag.includes("places")
      ) {
        reload();
      }
    });
  }, [enabled, reload]);

  return {
    loading,
    error,
    orderConfigs,
    drivers,
    vehicles,
    places,
    fleets,
    customers,
    facilitators,
    serviceAreas,
    reload,
  };
}
