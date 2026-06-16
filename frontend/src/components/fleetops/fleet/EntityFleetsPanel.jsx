import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fleetopsService } from "@/services/fleetops";
import { mapFleet, statusLabel } from "@/lib/mappers";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";
import StatusBadge from "@/components/common/StatusBadge";
import { parseApiError } from "@/lib/errors";

/** Load fleet memberships via fleets list filter (reliable; does not depend on vehicle/driver ?with=fleets). */
async function loadEntityFleets(entityType, entityId) {
  if (!entityId) return [];
  const params = { limit: 100, nocache: 1 };
  if (entityType === "driver") {
    params.driver = entityId;
    params["filter[driver]"] = entityId;
  } else {
    params.vehicle = entityId;
    params["filter[vehicle]"] = entityId;
  }
  const rows = await fleetopsService.listFleets(params).catch(() => []);
  return rows.map(mapFleet);
}

/**
 * Reverse membership — assign/remove fleets from a driver or vehicle record.
 */
export default function EntityFleetsPanel({ entityType, entityId, fleets = [], onChanged }) {
  const { can } = useFleetopsPermission();
  const canManage =
    can("update", "fleet") ||
    can("assign-driver-for", "fleet") ||
    can("assign-vehicle-for", "fleet") ||
    can("remove-driver-for", "fleet") ||
    can("remove-vehicle-for", "fleet");
  const [fleetPick, setFleetPick] = useState("");
  const [availableFleets, setAvailableFleets] = useState([]);
  const [memberFleets, setMemberFleets] = useState(fleets);
  const [busy, setBusy] = useState(false);

  const refreshMembership = useCallback(async () => {
    if (!entityId) return;
    const rows = await loadEntityFleets(entityType, entityId);
    setMemberFleets(rows);
  }, [entityType, entityId]);

  useEffect(() => {
    if (!entityId) {
      setMemberFleets([]);
      return;
    }
    let cancelled = false;
    refreshMembership()
      .catch(() => {
        if (!cancelled && fleets.length > 0) setMemberFleets(fleets);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId, entityType, refreshMembership, fleets]);

  const memberIds = new Set(memberFleets.map((f) => String(f.id)));

  const loadPickers = useCallback(async () => {
    const rows = await fleetopsService.listFleets({ limit: 500 }).catch(() => []);
    setAvailableFleets(rows.map(mapFleet).filter((f) => !memberIds.has(String(f.id))));
  }, [memberFleets]);

  useEffect(() => {
    if (canManage) loadPickers();
  }, [canManage, loadPickers]);

  const assign = async () => {
    if (!fleetPick || !entityId) return;
    setBusy(true);
    try {
      let result;
      if (entityType === "driver") {
        result = await fleetopsService.assignDriverToFleet(fleetPick, entityId);
      } else {
        result = await fleetopsService.assignVehicleToFleet(fleetPick, entityId);
      }
      if (result?.exists && !result?.added) {
        toast.success("Already in fleet");
      } else {
        toast.success("Added to fleet");
      }
      setFleetPick("");
      await refreshMembership();
      onChanged?.();
    } catch (err) {
      toast.error(parseApiError(err, "Failed to assign fleet"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (fleetId) => {
    setBusy(true);
    try {
      if (entityType === "driver") {
        await fleetopsService.removeDriverFromFleet(fleetId, entityId);
      } else {
        await fleetopsService.removeVehicleFromFleet(fleetId, entityId);
      }
      toast.success("Removed from fleet");
      await refreshMembership();
      onChanged?.();
    } catch (err) {
      toast.error(parseApiError(err, "Failed to remove fleet"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3" data-testid={`${entityType}-fleets-panel`}>
      <div className="flex items-center justify-between">
        <div className="overline">Fleets ({memberFleets.length})</div>
        {canManage && (
          <div className="flex gap-2 items-center">
            <Select value={fleetPick} onValueChange={setFleetPick}>
              <SelectTrigger className="h-8 w-[180px]" data-testid={`${entityType}-add-fleet-select`}>
                <SelectValue placeholder="Add to fleet" />
              </SelectTrigger>
              <SelectContent>
                {availableFleets.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" disabled={!fleetPick || busy} onClick={assign} data-testid={`${entityType}-add-fleet`}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
        )}
      </div>
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {memberFleets.length === 0 ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">Not assigned to any fleet.</div>
        ) : (
          memberFleets.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3">
              <DetailEntityLink entityKey="fleet" entityId={f.id} className="flex-1 min-w-0">
                <div className="font-medium text-sm">{f.name}</div>
                <div className="text-[10px] font-mono text-[#4B5563]">{f.publicId}</div>
              </DetailEntityLink>
              <StatusBadge status={f.status} label={statusLabel(f.status)} />
              {canManage && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => remove(f.id)}
                  data-testid={`${entityType}-remove-fleet-${f.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
