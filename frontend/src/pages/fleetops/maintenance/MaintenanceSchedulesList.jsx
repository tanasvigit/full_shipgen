import { useSearchParams } from "react-router-dom";
import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import MaintenanceScheduleForm from "@/components/fleetops/forms/maintenance/MaintenanceScheduleForm";

export default function MaintenanceSchedulesList() {
  const [searchParams] = useSearchParams();
  const defaultVehicleId = searchParams.get("vehicle") || "";

  return (
    <FleetopsCrudListPage
      config={{ ...CRUD_ENTITIES.maintenanceSchedule, formDialogSize: "xl" }}
      FormComponent={MaintenanceScheduleForm}
      formProps={{ defaultVehicleId }}
      openCreateOnMount={Boolean(defaultVehicleId)}
    />
  );
}
