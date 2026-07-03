import DetailFieldGrid from "@/components/fleetops/detail/DetailFieldGrid";
import { formatMoney, normalizeDisplayCurrency } from "@/lib/formatMoney";

export default function OrderFinancialsTab({ order, rawOrder }) {
  const raw = rawOrder || {};
  const fields = [
    { label: "Order total", value: formatMoney(order?.total || raw.total || 0) },
    { label: "Payment status", value: order?.paymentStatus || raw.payment_status || "—" },
    { label: "Currency", value: normalizeDisplayCurrency(raw.currency) },
    { label: "Subtotal", value: raw.subtotal != null ? formatMoney(raw.subtotal) : "—" },
    { label: "Tax", value: raw.tax != null ? formatMoney(raw.tax) : "—" },
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
