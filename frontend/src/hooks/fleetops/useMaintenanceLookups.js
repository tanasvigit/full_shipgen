import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { parseApiError } from "@/lib/errors";

function vehicleOption(row) {
  const id = row?.uuid || row?.id || row?.public_id;
  if (!id) return null;
  const plate = row?.plate_number || row?.plate || "";
  const name = row?.name || [row?.make, row?.model].filter(Boolean).join(" ") || "Vehicle";
  const label = plate ? `${plate} — ${name}` : name;
  return { id: String(id), label, uuid: String(row?.uuid || id) };
}

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

export function useMaintenanceLookups(enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicleRows, equipmentRows, vendorRows, warrantyRows, workOrderRows] = await Promise.all([
        fleetopsService.listVehicles({ limit: 500 }),
        fleetopsService.listEquipment().catch(() => []),
        fleetopsService.listVendor().catch(() => []),
        fleetopsService.listWarranty().catch(() => []),
        fleetopsService.listWorkOrder().catch(() => []),
      ]);
      setVehicles(vehicleRows.map(vehicleOption).filter(Boolean));
      setEquipment(equipmentRows.map((e) => toOption(e, ["name", "serial_number", "public_id"])).filter(Boolean));
      setVendors(vendorRows.map((v) => toOption(v, ["name", "public_id"])).filter(Boolean));
      setWarranties(warrantyRows.map((w) => toOption(w, ["provider", "policy_number", "public_id"])).filter(Boolean));
      setWorkOrders(workOrderRows.map((w) => toOption(w, ["subject", "code", "public_id"])).filter(Boolean));
    } catch (err) {
      setError(parseApiError(err, "Maintenance lookups failed"));
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, error, vehicles, equipment, vendors, warranties, workOrders, reload };
}
