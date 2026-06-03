import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";

export default function DeviceEventsPanel({ deviceId, enabled = true }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !deviceId) return;
    setLoading(true);
    try {
      const all = await fleetopsService.listDeviceEvent();
      setRows(
        all
          .filter((e) => String(e.device_uuid || e.device_id || "") === String(deviceId))
          .map((r) => mapCrudRow(r, "deviceEvent")),
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4" data-testid="device-events-panel">
      <DataTable
        testid="device-events-panel-table"
        columns={[
          { key: "name", header: "Event" },
          { key: "type", header: "Type", render: (r) => r.raw?.type || r.type || "—" },
          {
            key: "created",
            header: "When",
            render: (r) => r.raw?.created_at || r.raw?.occurred_at || "—",
          },
        ]}
        data={rows}
        loading={loading}
        pageSize={10}
        onRowClick={(r) => navigate(`/fleet-ops/connectivity/device-events/${r.id}`)}
        emptyMessage="No events for this device"
      />
    </div>
  );
}
