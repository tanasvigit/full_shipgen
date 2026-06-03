import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { toast } from "sonner";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";

export default function VehicleDevicesAdmin() {
  const ability = useFleetopsAbility();
  const canManage = ability.canUpdateOrder || ability.isDispatcher;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const junction = await fleetopsService.listVehicleDevicesAdmin();
      setRows(
        junction.map((j) => ({
          id: j.uuid || j.id,
          vehicleId: j.vehicle_uuid || j.vehicle_id,
          deviceId: j.device_uuid || j.device_id,
          raw: j,
        })),
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const detach = async (row) => {
    if (!row.vehicleId || !row.deviceId) return;
    try {
      await fleetopsService.detachDeviceFromVehicle(row.vehicleId, row.deviceId);
      toast.success("Detached");
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Detach failed");
    }
  };

  return (
    <div data-testid="vehicle-devices-admin-page">
      <PageHeader
        breadcrumbs={[
          { label: "FleetOps", to: "/fleet-ops" },
          { label: "Connectivity" },
          { label: "Vehicle devices" },
        ]}
        title="Vehicle ↔ device junction"
        description="Fleet-wide view of device attachments (G085). Per-vehicle attach also on vehicle detail devices tab."
      />
      <div className="p-6">
        <p className="text-sm text-[#4B5563] mb-4">
          Also see{" "}
          <Link to="/fleet-ops/management/vehicles" className="text-[#0066FF]">
            vehicle detail → devices tab
          </Link>
          .
        </p>
        <DataTable
          testid="vehicle-devices-admin-table"
          loading={loading}
          data={rows}
          columns={[
            {
              key: "vehicle",
              header: "Vehicle",
              render: (r) =>
                r.vehicleId ? (
                  <DetailEntityLink entityKey="vehicle" entityId={r.vehicleId}>
                    {r.vehicleId}
                  </DetailEntityLink>
                ) : (
                  "—"
                ),
            },
            {
              key: "device",
              header: "Device",
              render: (r) =>
                r.deviceId ? (
                  <DetailEntityLink entityKey="device" entityId={r.deviceId}>
                    {r.deviceId}
                  </DetailEntityLink>
                ) : (
                  "—"
                ),
            },
            {
              key: "actions",
              header: "",
              render: (r) =>
                canManage ? (
                  <Button variant="ghost" size="sm" onClick={() => detach(r)} data-testid={`vehicle-devices-detach-${r.id}`}>
                    Detach
                  </Button>
                ) : null,
            },
          ]}
          emptyMessage="No vehicle-device links — attach from vehicle or device detail."
        />
      </div>
    </div>
  );
}
