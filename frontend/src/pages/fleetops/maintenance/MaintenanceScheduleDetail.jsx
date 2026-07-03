import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { mapCrudRow } from "@/lib/fleetops/crudEntities";
import { useEffect, useState } from "react";
import MaintenanceScheduleActions from "@/components/fleetops/maintenance/MaintenanceScheduleActions";
import MaintenanceScheduleForm, {
  maintenanceScheduleValuesFromApi,
} from "@/components/fleetops/forms/maintenance/MaintenanceScheduleForm";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

function ScheduleWorkOrdersPanel({ scheduleId }) {
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
            .filter((wo) => String(wo.schedule_uuid || wo.maintenance_schedule_id || "") === String(scheduleId))
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
  }, [scheduleId]);

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

export default function MaintenanceScheduleDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={id}
      onClose={onClose}
      config={CRUD_ENTITIES.maintenanceSchedule}
      FormComponent={MaintenanceScheduleForm}
      valuesFromApi={maintenanceScheduleValuesFromApi}
      relationSlots={
        <>
          <ScheduleWorkOrdersPanel scheduleId={id} />
          <MaintenanceScheduleActions scheduleId={id} />
        </>
      }
    />
  );
}
