import { useCallback, useEffect, useState } from "react";
import FleetopsCrudDetailPage from "@/components/fleetops/crud/FleetopsCrudDetailPage";
import { CRUD_ENTITIES, mapCrudRow } from "@/lib/fleetops/crudEntities";
import DataTable from "@/components/common/DataTable";
import { fleetopsService } from "@/services/fleetops";
import { Link, useParams } from "react-router-dom";

function ContactCustomerOrdersPanel({ contactId, contactType }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const isCustomer = String(contactType || "").toLowerCase() === "customer";

  const load = useCallback(async () => {
    if (!isCustomer) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const all = await fleetopsService.listOrders({ customer: contactId, limit: 50 });
      setOrders(
        all
          .filter(
            (order) =>
              String(order.customer_uuid || order.customer?.uuid || "") === String(contactId),
          )
          .map((order) => mapCrudRow(order, "order")),
      );
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [contactId, isCustomer]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isCustomer) {
    return (
      <div className="mt-4 text-sm text-[#4B5563]" data-testid="contact-customers-panel">
        Set this contact&apos;s role to <strong>Customer</strong> to track orders billed to them.
      </div>
    );
  }

  return (
    <div className="mt-4" data-testid="contact-customers-panel">
      <div className="overline mb-2">Orders as customer</div>
      <DataTable
        testid="contact-customer-orders-table"
        columns={[
          {
            key: "name",
            header: "Order",
            render: (row) => (
              <Link className="text-[#0066FF] font-medium" to={`/fleet-ops/orders/${row.id}`}>
                {row.publicId}
              </Link>
            ),
          },
          { key: "status", header: "Status" },
        ]}
        data={orders}
        loading={loading}
        pageSize={5}
      />
    </div>
  );
}

export default function ContactDetail() {
  const { id } = useParams();
  const [contactType, setContactType] = useState("");

  useEffect(() => {
    fleetopsService
      .getContact(id)
      .then((contact) => setContactType(contact?.type || ""))
      .catch(() => setContactType(""));
  }, [id]);

  return (
    <FleetopsCrudDetailPage
      config={CRUD_ENTITIES.contact}
      relationSlots={<ContactCustomerOrdersPanel contactId={id} contactType={contactType} />}
    />
  );
}
