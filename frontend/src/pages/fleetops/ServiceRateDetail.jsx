import { useParams } from "react-router-dom";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import ServiceRateForm, { serviceRateValuesFromApi } from "@/components/fleetops/forms/ServiceRateForm";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { resolveDetailEntityId } from "@/lib/fleetops/detailEmbedded";

function mapServiceRateFormValues(raw) {
  const values = serviceRateValuesFromApi(raw);
  return {
    name: values.name,
    serviceType: values.serviceType,
    baseFee: values.baseFee,
    rateCalculationMethod: values.rateCalculationMethod,
    perDistanceFee: values.perDistanceFee,
    perDistanceUnit: values.perDistanceUnit,
    currency: values.currency,
  };
}

export default function ServiceRateDetail({ embedded = false, entityId: entityIdProp, onClose }) {
  const { id: routeId } = useParams();
  const id = resolveDetailEntityId(entityIdProp, routeId);

  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={id}
      onClose={onClose}
      config={CRUD_ENTITIES.serviceRate}
      FormComponent={ServiceRateForm}
      valuesFromApi={mapServiceRateFormValues}
    />
  );
}
