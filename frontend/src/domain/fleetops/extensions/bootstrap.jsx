/**
 * FleetOps extension bootstrap (Phase 6 — G032, G053).
 * Import once at app startup; plugins may call register* from the same modules.
 */
import { registerDetailExtension } from "./detailRegistry";
import { registerFormExtension } from "./formRegistry";

registerDetailExtension("order", {
  key: "virtual-compliance",
  id: "virtual-compliance",
  label: "Compliance",
  order: 90,
  testId: "order-tab-virtual-compliance",
  render: ({ rawOrder, order }) => (
    <div className="p-4 space-y-2 text-sm" data-testid="order-extension-virtual-compliance">
      <p className="text-[#374151]">
        Extension virtual tab slot — register additional tabs via{" "}
        <code className="text-xs bg-[#F5F6F8] px-1 rounded">registerDetailExtension(&apos;order&apos;, …)</code>
      </p>
      {order?.publicId && (
        <p className="font-mono text-xs text-[#6B7280]">Order {order.publicId}</p>
      )}
      {rawOrder?.meta?.compliance_notes && (
        <pre className="text-xs bg-[#F5F6F8] p-2 rounded overflow-auto">
          {JSON.stringify(rawOrder.meta.compliance_notes, null, 2)}
        </pre>
      )}
    </div>
  ),
});

const formDetailOwners = [
  ["driver", "DriverForm"],
  ["vehicle", "VehicleForm"],
  ["place", "PlaceForm"],
  ["fleet", "FleetForm"],
  ["order", "OrderForm — payload entities inline"],
];

for (const [entityKey, owner] of formDetailOwners) {
  registerFormExtension(entityKey, {
    key: `${entityKey}-form-details`,
    order: 100,
    label: "Extended details",
    render: () => (
      <p className="text-xs text-[#6B7280] font-mono" data-testid={`form-extension-${entityKey}`}>
        {owner} — no plugin registered (§38 N/A)
      </p>
    ),
  });
}

registerFormExtension("order-payload-entity", {
  key: "order-payload-entity",
  order: 0,
  label: "Payload entity",
  render: ({ values }) => (
    <p className="text-xs text-[#6B7280]" data-testid="order-payload-entity-extension">
      Payload entity registry — use OrderForm entities section ({values?.entities?.length ?? 0} rows)
    </p>
  ),
});
