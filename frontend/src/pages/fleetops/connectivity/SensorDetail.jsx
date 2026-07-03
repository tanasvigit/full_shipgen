import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { SensorForm, sensorValuesFromApi } from "@/components/fleetops/forms/connectivity/ConnectivityForms";

export default function SensorDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.sensor}
      FormComponent={SensorForm}
      valuesFromApi={sensorValuesFromApi}
    />
  );
}
