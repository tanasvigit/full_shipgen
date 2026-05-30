import { useCallback, useEffect, useState } from "react";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES, mapCrudRow } from "@/lib/fleetops/crudEntities";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { useParams } from "react-router-dom";

function ContactCustomersPanel({ contactId }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fleetopsService.listCustomer();
      setCustomers(
        all
          .filter((c) => String(c.contact_uuid || c.contact_id || "") === String(contactId))
          .map((c) => mapCrudRow(c, "customer")),
      );
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-4" data-testid="contact-customers-panel">
      <div className="overline mb-2">Customers</div>
      <DataTable
        testid="contact-customers-table"
        columns={[
          { key: "name", header: "Name" },
          { key: "publicId", header: "Public ID" },
        ]}
        data={customers}
        loading={loading}
        pageSize={5}
      />
    </div>
  );
}

export default function ContactDetail() {
  const { id } = useParams();
  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.contact}
      relationSlots={<ContactCustomersPanel contactId={id} />}
    />
  );
}
