import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { toast } from "sonner";

export default function VehicleDevicesTab({ vehicleId, enabled = true }) {
  const [attached, setAttached] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !vehicleId) return;
    setLoading(true);
    try {
      const [onVehicle, all] = await Promise.all([
        fleetopsService.listVehicleDevices(vehicleId),
        fleetopsService.listDevice(),
      ]);
      setAttached(onVehicle.map((d) => mapCrudRow(d, "device")));
      const attachedIds = new Set(onVehicle.map((d) => String(d.uuid || d.id)));
      setAvailable(
        all
          .filter((d) => !attachedIds.has(String(d.uuid || d.id)))
          .map((d) => mapCrudRow(d, "device")),
      );
    } catch {
      setAttached([]);
      setAvailable([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  const attach = async () => {
    if (!selected) return;
    try {
      await fleetopsService.attachDeviceToVehicle(vehicleId, selected);
      toast.success("Device attached");
      setSelected("");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Attach failed");
    }
  };

  const detach = async (deviceId) => {
    try {
      await fleetopsService.detachDeviceFromVehicle(vehicleId, deviceId);
      toast.success("Device detached");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Detach failed");
    }
  };

  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4" data-testid="vehicle-devices-tab">
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger data-testid="vehicle-attach-device-select">
              <SelectValue placeholder="Select device to attach" />
            </SelectTrigger>
            <SelectContent>
              {available.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} ({d.publicId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={attach} disabled={!selected} data-testid="vehicle-attach-device">
          Attach device
        </Button>
      </div>
      <DataTable
        testid="vehicle-devices-table"
        columns={[
          { key: "name", header: "Device" },
          { key: "publicId", header: "Public ID" },
          {
            key: "actions",
            header: "",
            render: (r) => (
              <Button variant="ghost" size="sm" onClick={() => detach(r.id)} data-testid={`vehicle-detach-${r.id}`}>
                Detach
              </Button>
            ),
          },
        ]}
        data={attached}
        loading={loading}
        pageSize={5}
      />
    </div>
  );
}
