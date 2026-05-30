import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapDriverRow } from "@/lib/mappers";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";

export default function VendorPersonnelPanel({ vendorId }) {
  const ability = useFleetopsAbility();
  const canManage = ability.canUpdateOrder || ability.isDispatcher;
  const [drivers, setDrivers] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const all = await fleetopsService.listDrivers().catch(() => []);
    const mapped = all.map(mapDriverRow);
    setDrivers(
      mapped.filter(
        (d) =>
          String(d.raw?.vendor_uuid || d.raw?.facilitator_uuid || "") === String(vendorId),
      ),
    );
    setAvailable(
      mapped.filter(
        (d) =>
          !d.raw?.vendor_uuid &&
          String(d.raw?.vendor_uuid || "") !== String(vendorId),
      ),
    );
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await fleetopsService.assignDriverToVendor(vendorId, selected);
      toast.success("Driver assigned to vendor");
      setSelected("");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Assign failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (driverId) => {
    setBusy(true);
    try {
      await fleetopsService.removeDriverFromVendor(vendorId, driverId);
      toast.success("Driver removed");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Remove failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-3" data-testid="vendor-personnel-panel">
      <div className="flex items-center justify-between">
        <div className="overline">Assigned drivers ({drivers.length})</div>
        {canManage && (
          <div className="flex gap-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="h-8 w-[160px]" data-testid="vendor-assign-driver-select">
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {available.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!selected || busy} onClick={assign} data-testid="vendor-assign-driver">
              <Plus className="h-3.5 w-3.5 mr-1" /> Assign
            </Button>
          </div>
        )}
      </div>
      {drivers.length === 0 ? (
        <p className="text-sm text-[#4B5563]">No drivers assigned to this vendor.</p>
      ) : (
        <ul className="divide-y divide-black/[0.06]">
          {drivers.map((d) => (
            <li key={d.id} className="flex items-center justify-between py-2">
              <DetailEntityLink entityKey="driver" entityId={d.id}>
                <span className="text-sm font-medium">{d.name}</span>
              </DetailEntityLink>
              {canManage && (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => remove(d.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
