import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Receipt } from "lucide-react";
import { ledgerService } from "@/services/ledger";
import { mapInvoiceRow, statusLabelExt } from "@/lib/mappers";
import { formatMoney, majorToMinor } from "@/lib/formatMoney";
import { toast } from "sonner";

const STATUSES = ["all", "draft", "sent", "paid", "overdue", "partial", "viewed"];
const todayIso = () => new Date().toISOString().slice(0, 10);

export default function InvoicesList() {
  const [status, setStatus] = useState("all");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ledgerService.listInvoices({ limit: 500, sort: "-created_at" });
      setInvoices((raw || []).map(mapInvoiceRow));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load invoices.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (status === "all" ? invoices : invoices.filter((i) => i.status === status)),
    [invoices, status],
  );

  const columns = [
    { key: "number", header: "Number", sortable: true, render: (r) => <span className="font-mono text-xs text-[#0066FF]">{r.number}</span> },
    { key: "customer", header: "Customer", sortable: true, render: (r) => <span className="font-medium text-[#0A0E1A]">{r.customer}</span> },
    { key: "issued", header: "Issued", sortable: true, render: (r) => <span className="font-mono text-xs">{r.issued}</span> },
    { key: "due", header: "Due", sortable: true, render: (r) => <span className="font-mono text-xs">{r.due}</span> },
    { key: "amount", header: "Amount", sortable: true, render: (r) => <span className="font-mono tabular text-sm">{formatMoney(r.amount, r.currency)}</span> },
    { key: "paid", header: "Paid", render: (r) => <span className="font-mono tabular text-sm text-[#15803D]">{formatMoney(r.paid, r.currency)}</span> },
    { key: "lineItems", header: "Lines", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.lineItems}</span> },
    { key: "status", header: "Status", sortable: true, render: (r) => <StatusBadge status={r.status} label={statusLabelExt(r.status)} /> },
  ];

  async function handleCreate(v) {
    setSubmitting(true);
    try {
      const amountMajor = parseFloat(v.amount) || 0;
      const qty = Math.max(1, parseInt(v.lineItems, 10) || 1);
      const created = await ledgerService.createInvoice({
        invoice: {
          date: todayIso(),
          due_date: v.due || todayIso(),
          currency: "USD",
          items: [
            {
              description: v.customer.trim(),
              quantity: qty,
              unit_price: Math.round(majorToMinor(amountMajor) / qty),
            },
          ],
        },
      });
      await load();
      const row = mapInvoiceRow(created);
      return { toast: `Invoice ${row.number} created` };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create invoice.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="invoices-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Ledger", to: "/ledger" }, { label: "Billing" }, { label: "Invoices" }]}
        overline="Billing"
        title="Invoices"
        description={
          loading
            ? "Loading…"
            : `${filtered.length} invoices · ${status === "all" ? "all statuses" : statusLabelExt(status)}`
        }
        actions={
          <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="invoices-new-button">
            <Plus className="h-4 w-4 mr-1.5" /> New invoice
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              data-testid={`invoices-status-filter-${s}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                status === s ? "bg-[#0066FF]/10 border-[#0066FF]/40 text-[#0040CC]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {s === "all" ? "All" : statusLabelExt(s)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading invoices…</div>
        ) : (
          <DataTable testid="invoices-table" columns={columns} data={filtered} searchKeys={["number", "customer"]} pageSize={10} onRowClick={(r) => navigate(`/ledger/billing/invoices/${r.id}`)} />
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New invoice"
        description="Draft a new invoice with a single line item. Link a customer record in Fleetbase for full billing details."
        icon={Receipt}
        submitLabel={submitting ? "Creating…" : "Create draft"}
        testid="new-invoice-dialog"
        fields={[
          { key: "customer", label: "Customer / line description", placeholder: "Acme Logistics Inc.", required: true },
          { key: "amount", label: "Amount (USD)", type: "number", min: 0, step: 0.01, defaultValue: "1000", required: true, col: "half" },
          { key: "due", label: "Due date", placeholder: todayIso(), col: "half" },
          { key: "lineItems", label: "Quantity", type: "number", min: 1, max: 99, defaultValue: "1", col: "half" },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
