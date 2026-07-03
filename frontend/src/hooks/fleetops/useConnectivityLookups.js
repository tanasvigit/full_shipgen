import { useCallback, useEffect, useState } from "react";
import { fleetopsService } from "@/services/fleetops";
import { parseApiError } from "@/lib/errors";

function telematicOption(row) {
  const id = row?.uuid || row?.id;
  if (!id) return null;
  const name = row?.name || "Telematic";
  const suffix = row?.public_id || row?.provider || "";
  const label = suffix ? `${name} (${suffix})` : name;
  return { id: String(id), label, uuid: String(id) };
}

function deviceOption(row) {
  const id = row?.uuid || row?.id;
  if (!id) return null;
  const name = row?.name || "Device";
  const parts = [name];
  if (row?.imei) parts.push(row.imei);
  if (row?.public_id) parts.push(`(${row.public_id})`);
  return { id: String(id), label: parts.join(" — "), uuid: String(id) };
}

export function useConnectivityLookups(enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [telematics, setTelematics] = useState([]);
  const [devices, setDevices] = useState([]);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [telematicRows, deviceRows] = await Promise.all([
        fleetopsService.listTelematic().catch(() => []),
        fleetopsService.listDevice().catch(() => []),
      ]);
      setTelematics(telematicRows.map(telematicOption).filter(Boolean));
      setDevices(deviceRows.map(deviceOption).filter(Boolean));
    } catch (err) {
      setError(parseApiError(err, "Could not load connectivity options"));
      setTelematics([]);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { loading, error, telematics, devices, reload };
}
