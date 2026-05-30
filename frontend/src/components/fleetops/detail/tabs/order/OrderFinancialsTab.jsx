import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";

export default function OrderFinancialsTab({ order, rawOrder }) {
  const raw = rawOrder || {};
  const fields = [
    { label: "Order total", value: `$${Number(order?.total || raw.total || 0).toFixed(2)}` },
    { label: "Payment status", value: order?.paymentStatus || raw.payment_status || "—" },
    { label: "Currency", value: raw.currency || "—" },
    { label: "Subtotal", value: raw.subtotal != null ? `$${Number(raw.subtotal).toFixed(2)}` : "—" },
    { label: "Tax", value: raw.tax != null ? `$${Number(raw.tax).toFixed(2)}` : "—" },
    { label: "Driver payout", value: raw.driver_payout ?? raw.payout_amount ?? "—" },
    { label: "Settlement", value: raw.settlement_status ?? "—" },
    { label: "Invoice", value: raw.invoice_number ?? raw.invoice?.number ?? "—", mono: true },
    { label: "Ledger reference", value: raw.ledger_reference ?? raw.transaction_id ?? "—", mono: true },
  ];

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <DetailFieldGrid fields={fields} columns={2} />
      </div>
    </div>
  );
}
