import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow, mapVehicleRow } from "@/lib/mappers";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import StatusBadge from "@/components/common/StatusBadge";
import { statusLabel } from "@/lib/mappers";

export default function FleetMembersPanel({ fleetId, drivers = [], vehicles = [], onChanged, mode = "all" }) {
  const ability = useFleetopsAbility();
  const canManage = ability.canUpdateOrder || ability.isDispatcher;
  const [driverPick, setDriverPick] = useState("");
  const [vehiclePick, setVehiclePick] = useState("");
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [busy, setBusy] = useState(false);

  const loadPickers = useCallback(async () => {
    const [d, v] = await Promise.all([
      fleetopsService.listDrivers().catch(() => []),
      fleetopsService.listVehicles().catch(() => []),
    ]);
    const memberDriverIds = new Set(drivers.map((x) => String(x.id)));
    const memberVehicleIds = new Set(vehicles.map((x) => String(x.id)));
    setAvailableDrivers(d.map(mapDriverRow).filter((row) => !memberDriverIds.has(String(row.id))));
    setAvailableVehicles(v.map(mapVehicleRow).filter((row) => !memberVehicleIds.has(String(row.id))));
  }, [drivers, vehicles]);

  useEffect(() => {
    if (canManage) loadPickers();
  }, [canManage, loadPickers]);

  const addDriver = async () => {
    if (!driverPick) return;
    setBusy(true);
    try {
      await fleetopsService.assignDriverToFleet(fleetId, driverPick);
      toast.success("Driver added to fleet");
      setDriverPick("");
      onChanged?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to assign driver");
    } finally {
      setBusy(false);
    }
  };

  const removeDriver = async (driverId) => {
    setBusy(true);
    try {
      await fleetopsService.removeDriverFromFleet(fleetId, driverId);
      toast.success("Driver removed");
      onChanged?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to remove driver");
    } finally {
      setBusy(false);
    }
  };

  const addVehicle = async () => {
    if (!vehiclePick) return;
    setBusy(true);
    try {
      await fleetopsService.assignVehicleToFleet(fleetId, vehiclePick);
      toast.success("Vehicle added to fleet");
      setVehiclePick("");
      onChanged?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to assign vehicle");
    } finally {
      setBusy(false);
    }
  };

  const removeVehicle = async (vehicleId) => {
    setBusy(true);
    try {
      await fleetopsService.removeVehicleFromFleet(fleetId, vehicleId);
      toast.success("Vehicle removed");
      onChanged?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to remove vehicle");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="fleet-members-panel">
      {(mode === "all" || mode === "drivers") && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="overline">Drivers ({drivers.length})</div>
          {canManage && (
            <div className="flex gap-2 items-center">
              <Select value={driverPick} onValueChange={setDriverPick}>
                <SelectTrigger className="h-8 w-[180px]" data-testid="fleet-add-driver-select">
                  <SelectValue placeholder="Add driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!driverPick || busy} onClick={addDriver} data-testid="fleet-add-driver">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
          {drivers.length === 0 ? (
            <div className="p-6 text-sm text-[#4B5563] text-center">No drivers in this fleet.</div>
          ) : (
            drivers.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <DetailEntityLink entityKey="driver" entityId={d.id} className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{d.name}</div>
                  <div className="text-[10px] font-mono text-[#4B5563]">{d.publicId}</div>
                </DetailEntityLink>
                <StatusBadge status={d.status} label={statusLabel(d.status)} />
                {canManage && (
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => removeDriver(d.id)} data-testid={`fleet-remove-driver-${d.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      )}

      {(mode === "all" || mode === "vehicles") && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="overline">Vehicles ({vehicles.length})</div>
          {canManage && (
            <div className="flex gap-2 items-center">
              <Select value={vehiclePick} onValueChange={setVehiclePick}>
                <SelectTrigger className="h-8 w-[180px]" data-testid="fleet-add-vehicle-select">
                  <SelectValue placeholder="Add vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name || v.plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" disabled={!vehiclePick || busy} onClick={addVehicle} data-testid="fleet-add-vehicle">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
          {vehicles.length === 0 ? (
            <div className="p-6 text-sm text-[#4B5563] text-center">No vehicles in this fleet.</div>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                <DetailEntityLink entityKey="vehicle" entityId={v.id} className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-[10px] font-mono text-[#4B5563]">{v.plate}</div>
                </DetailEntityLink>
                <StatusBadge status={v.status} label={statusLabel(v.status)} />
                {canManage && (
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => removeVehicle(v.id)} data-testid={`fleet-remove-vehicle-${v.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </div>
  );
}
