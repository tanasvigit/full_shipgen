import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import DetailEntityLink from "@/components/fleetops/detail/DetailEntityLink";

export default function TelematicLinkedDevicesPanel({ telematicId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fleetopsService.listTelematicLinkedDevices(
        telematicId ? { telematic: telematicId, telematic_id: telematicId } : {},
      );
      setRows(all.map((d) => mapCrudRow(d, "device")));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [telematicId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div data-testid="telematic-linked-devices">
      <DataTable
        testid="telematic-linked-devices-table"
        columns={[
          {
            key: "name",
            header: "Device",
            render: (r) => (
              <DetailEntityLink entityKey="device" entityId={r.id}>
                {r.name}
              </DetailEntityLink>
            ),
          },
          { key: "imei", header: "IMEI", render: (r) => r.raw?.imei || "—" },
          { key: "status", header: "Status" },
        ]}
        data={rows}
        loading={loading}
        pageSize={8}
        emptyMessage="No linked devices — use setup wizard to link."
      />
    </div>
  );
}
