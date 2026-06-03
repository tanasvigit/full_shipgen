import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapVehicleRow } from "@/lib/mappers";
import { toast } from "sonner";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";

export default function DeviceVehiclePanel({ deviceId, deviceApi }) {
  const ability = useFleetopsAbility();
  const canManage = ability.canUpdateOrder || ability.isDispatcher;
  const [vehicle, setVehicle] = useState(null);
  const [pick, setPick] = useState("");
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);

  const vehicleId = deviceApi?.vehicle_uuid || deviceApi?.vehicle_id || deviceApi?.vehicle?.id;

  const load = useCallback(async () => {
    if (vehicleId) {
      try {
        const v = await fleetopsService.getVehicle(vehicleId);
        setVehicle(mapVehicleRow(v));
      } catch {
        setVehicle(null);
      }
    } else {
      setVehicle(null);
    }
    if (canManage) {
      const all = await fleetopsService.listVehicles().catch(() => []);
      setOptions(all.map(mapVehicleRow));
    }
  }, [vehicleId, canManage]);

  useEffect(() => {
    load();
  }, [load]);

  const attach = async () => {
    if (!pick) return;
    setBusy(true);
    try {
      await fleetopsService.attachDeviceToVehicle(pick, deviceId);
      toast.success("Device attached to vehicle");
      setPick("");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Attach failed");
    } finally {
      setBusy(false);
    }
  };

  const detach = async () => {
    if (!vehicle) return;
    setBusy(true);
    try {
      await fleetopsService.detachDeviceFromVehicle(vehicle.id, deviceId);
      toast.success("Device detached");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Detach failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-[#F5F6F8] border border-black/[0.08] rounded-md" data-testid="device-vehicle-panel">
      <div className="overline mb-2">Assigned vehicle</div>
      {vehicle ? (
        <div className="flex items-center justify-between gap-2">
          <DetailEntityLink entityKey="vehicle" entityId={vehicle.id}>
            <span className="font-medium">{vehicle.name}</span>
            <span className="text-xs font-mono text-[#4B5563] ml-2">{vehicle.plate}</span>
          </DetailEntityLink>
          {canManage && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={detach} data-testid="device-detach-vehicle">
              Detach
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#4B5563] mb-2">Not assigned to a vehicle.</p>
      )}
      {canManage && !vehicle && (
        <div className="flex gap-2 items-end mt-2">
          <Select value={pick} onValueChange={setPick}>
            <SelectTrigger className="w-[220px]" data-testid="device-attach-vehicle-select">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {options.map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.name || v.plate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" disabled={busy || !pick} onClick={attach} data-testid="device-attach-vehicle">
            Attach
          </Button>
        </div>
      )}
    </div>
  );
}
