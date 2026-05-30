import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";

export default function VehicleWorkOrdersTab({ vehicleId, enabled = true }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !vehicleId) return;
    setLoading(true);
    try {
      const raw = await fleetopsService.listVehicleWorkOrders(vehicleId);
      setRows(raw.map((r) => mapCrudRow(r, "workOrder")));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-5" data-testid="vehicle-work-orders-tab">
      <DataTable
        testid="vehicle-work-orders-table"
        columns={[
          {
            key: "name",
            header: "Work order",
            render: (r) => (
              <Link className="text-[#0066FF]" to={`/fleet-ops/maintenance/work-orders/${r.id}`}>
                {r.name}
              </Link>
            ),
          },
          { key: "status", header: "Status" },
          { key: "publicId", header: "Public ID" },
        ]}
        data={rows}
        loading={loading}
        pageSize={8}
      />
    </div>
  );
}
