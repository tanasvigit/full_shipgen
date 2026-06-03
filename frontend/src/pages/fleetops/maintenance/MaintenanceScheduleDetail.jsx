import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES, mapCrudRow } from "@/lib/fleetops/crudEntities";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import MaintenanceScheduleActions from "@/components/fleetops/maintenance/MaintenanceScheduleActions";

function ScheduleWorkOrdersPanel() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const all = await fleetopsService.listWorkOrder();
        if (!active) return;
        setRows(
          all
            .filter((wo) => String(wo.schedule_uuid || wo.maintenance_schedule_id || "") === String(id))
            .map((r) => mapCrudRow(r, "workOrder")),
        );
      } catch {
        if (active) setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div data-testid="schedule-work-orders-panel" className="mt-4">
      <div className="overline mb-2">Related work orders</div>
      <DataTable
        testid="schedule-work-orders-table"
        columns={[
          { key: "name", header: "Title" },
          { key: "status", header: "Status" },
        ]}
        data={rows}
        loading={loading}
        pageSize={5}
      />
    </div>
  );
}

function ScheduleActionsSlot() {
  const { id } = useParams();
  return <MaintenanceScheduleActions scheduleId={id} />;
}

export default function MaintenanceScheduleDetail() {
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.maintenanceSchedule}
      relationSlots={
        <>
          <ScheduleWorkOrdersPanel />
          <ScheduleActionsSlot />
        </>
      }
    />
  );
}
