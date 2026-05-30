import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";

export default function OrderPurchaseRateTab({ rawOrder }) {
  const pr = rawOrder?.purchase_rate || rawOrder?.purchaseRate || rawOrder?.rate;

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        {!pr ? (
          <p className="text-sm text-[#4B5563]">No purchase rate linked to this order.</p>
        ) : (
          <DetailFieldGrid
            fields={[
              { label: "ID", value: pr.public_id || pr.id, mono: true },
              { label: "Amount", value: pr.amount != null ? `$${Number(pr.amount).toFixed(2)}` : "—" },
              { label: "Currency", value: pr.currency || "—" },
              { label: "Service", value: pr.service_name || pr.service?.name || "—" },
            ]}
          />
        )}
      </div>
    </div>
  );
}
