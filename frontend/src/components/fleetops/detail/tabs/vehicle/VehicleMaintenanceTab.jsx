import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Wrench } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { subjectLabel } from "@/lib/fleetops/maintenancePayloads";

function vehicleIdSet(vehicleId, vehicleApi) {
  return new Set(
    [vehicleId, vehicleApi?.uuid, vehicleApi?.id, vehicleApi?.public_id, vehicleApi?.publicId]
      .filter(Boolean)
      .map(String),
  );
}

function matchesVehicle(record, vehicleIds) {
  const subjectIds = [
    record?.subject_uuid,
    record?.target_uuid,
    record?.maintainable_uuid,
    record?.subject?.uuid,
    record?.subject?.id,
    record?.subject?.public_id,
    record?.target?.uuid,
    record?.maintainable?.uuid,
  ].map((v) => String(v || ""));
  return subjectIds.some((id) => id && vehicleIds.has(id));
}

export default function VehicleMaintenanceTab({ vehicleId, vehicleApi, enabled = true }) {
  const [schedules, setSchedules] = useState([]);
  const [records, setRecords] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled || !vehicleId) return;
    const vehicleIds = vehicleIdSet(vehicleId, vehicleApi);
    setLoading(true);
    try {
      const [scheduleRows, maintenanceRows, workOrderRows] = await Promise.all([
        fleetopsService.listMaintenanceSchedule(),
        fleetopsService.listMaintenance(),
        fleetopsService.listWorkOrder(),
      ]);
      setSchedules(scheduleRows.filter((r) => matchesVehicle(r, vehicleIds)).map((r) => mapCrudRow(r, "maintenanceSchedule")));
      setRecords(maintenanceRows.filter((r) => matchesVehicle(r, vehicleIds)).map((r) => mapCrudRow(r, "maintenance")));
      setWorkOrders(workOrderRows.filter((r) => matchesVehicle(r, vehicleIds)).map((r) => mapCrudRow(r, "workOrder")));
    } catch {
      setSchedules([]);
      setRecords([]);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, vehicleApi, vehicleId]);

  useEffect(() => {
    load();
  }, [load]);

  const lastService = vehicleApi?.last_service_at || vehicleApi?.lastService || "—";
  const nextService = vehicleApi?.next_service_at || vehicleApi?.nextService || "—";

  return (
    <div className="p-4 space-y-4" data-testid="vehicle-maintenance-tab">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md p-5 flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/30 grid place-items-center rounded-sm">
            <Wrench className="h-4 w-4 text-[#15803D]" />
          </div>
          <div>
            <div className="font-medium text-sm">Last service</div>
            <div className="text-xs text-[#4B5563] font-mono">{lastService}</div>
          </div>
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md p-5 flex items-center gap-3">
          <div className="h-9 w-9 bg-amber-500/10 border border-amber-500/30 grid place-items-center rounded-sm">
            <Calendar className="h-4 w-4 text-[#A16207]" />
          </div>
          <div>
            <div className="font-medium text-sm">Next service due</div>
            <div className="text-xs text-[#4B5563] font-mono">{nextService}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="default" size="sm" className="bg-[#0066FF] hover:bg-[#0040CC] text-white" asChild>
          <Link to={`/fleet-ops/maintenance/schedules?vehicle=${encodeURIComponent(vehicleId)}`}>New schedule for this vehicle</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/fleet-ops/maintenance/schedules">All schedules</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/fleet-ops/maintenance/work-orders">All work orders</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/fleet-ops/maintenance/records">All records</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/fleet-ops/maintenance/calendar">Maintenance calendar</Link>
        </Button>
      </div>

      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-2">
        <div className="overline">Schedules for this vehicle</div>
        <DataTable
          testid="vehicle-schedules-table"
          columns={[
            {
              key: "name",
              header: "Schedule",
              render: (r) => (
                <Link className="text-[#0066FF]" to={`/fleet-ops/maintenance/schedules/${r.id}`}>
                  {r.name}
                </Link>
              ),
            },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={r.status} /> },
            {
              key: "next",
              header: "Next due",
              render: (r) => r.raw?.next_due_date?.slice?.(0, 10) || r.raw?.next_due_odometer || "—",
            },
          ]}
          data={schedules}
          loading={loading}
          pageSize={5}
        />
      </div>

      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-2">
        <div className="overline">Work orders</div>
        <DataTable
          testid="vehicle-maintenance-work-orders-table"
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
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={r.status} /> },
            { key: "due", header: "Due", render: (r) => r.raw?.due_at?.slice?.(0, 10) || "—" },
          ]}
          data={workOrders}
          loading={loading}
          pageSize={5}
        />
      </div>

      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-2">
        <div className="overline">Service history</div>
        <DataTable
          testid="vehicle-maintenance-records-table"
          columns={[
            {
              key: "name",
              header: "Record",
              render: (r) => (
                <Link className="text-[#0066FF]" to={`/fleet-ops/maintenance/records/${r.id}`}>
                  {r.name}
                </Link>
              ),
            },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={r.status} /> },
            {
              key: "completed",
              header: "Completed",
              render: (r) => r.raw?.completed_at?.slice?.(0, 10) || "—",
            },
            { key: "asset", header: "Asset", render: (r) => subjectLabel(r.raw) },
          ]}
          data={records}
          loading={loading}
          pageSize={5}
        />
      </div>
    </div>
  );
}
