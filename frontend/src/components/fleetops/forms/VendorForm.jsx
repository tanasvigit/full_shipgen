import SimpleEntityForm from "@/components/fleetops/crud/SimpleEntityForm";
import { CRUD_ENTITIES } from "@/lib/fleetops/crudEntities";

export default function VendorForm(props) {
  return <SimpleEntityForm {...props} fields={CRUD_ENTITIES.vendor.fields} />;
}
