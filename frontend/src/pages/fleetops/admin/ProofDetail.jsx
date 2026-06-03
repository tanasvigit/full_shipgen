import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function ProofDetail() {
  return <FleetopsCrudDetailPage config={CRUD_ENTITIES.proof} />;
}
