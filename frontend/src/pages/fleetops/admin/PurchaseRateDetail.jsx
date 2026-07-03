import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { PurchaseRateForm, purchaseRateValuesFromApi } from "@/components/fleetops/forms/resources/ResourceForms";

export default function PurchaseRateDetail({ embedded = false, entityId, onClose }) {
  return (
    <FleetopsCrudDetailPage
      embedded={embedded}
      entityId={entityId}
      onClose={onClose}
      config={CRUD_ENTITIES.purchaseRate}
      FormComponent={PurchaseRateForm}
      valuesFromApi={purchaseRateValuesFromApi}
    />
  );
}
