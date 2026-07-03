import FleetopsCrudListPage from "@/components/fleetops/crud/FleetopsCrudListPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";
import { PurchaseRateForm } from "@/components/fleetops/forms/resources/ResourceForms";

export default function PurchaseRatesList() {
  return <FleetopsCrudListPage config={CRUD_ENTITIES.purchaseRate} FormComponent={PurchaseRateForm} />;
}
