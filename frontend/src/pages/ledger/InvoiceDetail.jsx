import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Mail, Loader2 } from "lucide-react";
import { ledgerService } from "@/services/ledger";
import { mapInvoiceDetail, statusLabelExt } from "@/lib/mappers";
import { formatMoney, majorToMinor } from "@/lib/formatMoney";
import { toast } from "sonner";

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    try {
      const raw = await ledgerService.getInvoice(id);
      setInv(mapInvoiceDetail(raw));
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
        setInv(null);
      } else {
        toast.error(err?.friendlyMessage || "Failed to load invoice.");
        setInv(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRecordPayment() {
    if (!inv || inv.balance <= 0) return;
    setActionLoading(true);
    try {
      const updated = await ledgerService.recordInvoicePayment(id, {
        amount: majorToMinor(inv.balance),
        payment_method: "manual",
      });
      setInv(mapInvoiceDetail(updated));
      toast.success("Payment recorded.");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to record payment.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendReminder() {
    setActionLoading(true);
    try {
      await ledgerService.sendInvoice(id);
      await load();
      toast.success("Invoice sent to customer.");
    } catch (err) {
      if (err?.response?.status === 422) {
        try {
          await ledgerService.markInvoiceSent(id);
          await load();
          toast.success("Invoice marked as sent.");
        } catch (inner) {
          toast.error(inner?.friendlyMessage || "Could not mark invoice as sent.");
        }
      } else {
        toast.error(err?.friendlyMessage || "Failed to send invoice.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-[#374151]">Loading invoice…</div>;
  }
  if (notFound || !inv) {
    return <div className="p-8 text-[#374151]">Invoice not found.</div>;
  }

  const lineItems = inv.items || [];
  const canPay = inv.status !== "paid" && inv.balance > 0;

  return (
    <div data-testid="invoice-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "Ledger", to: "/ledger" },
          { label: "Invoices", to: "/ledger/billing/invoices" },
          { label: inv.number },
        ]}
        overline={`Invoice · issued ${inv.issued}`}
        title={inv.customer}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={inv.status} label={statusLabelExt(inv.status)} />
            <span className="text-xs font-mono text-[#4B5563]">{inv.number}</span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              variant="outline"
              disabled
              title="PDF export requires an invoice template in Fleetbase"
              className="bg-transparent border-black/[0.08] text-[#1F2937] opacity-60"
            >
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            {canPay && (
              <Button
                onClick={handleSendReminder}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="invoice-send-reminder"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
                Send / mark sent
              </Button>
            )}
          </>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
          <div className="p-5 border-b border-black/[0.08] flex items-start justify-between">
            <div>
              <div className="font-display font-bold text-2xl tracking-tighter">Invoice</div>
              <div className="text-xs font-mono text-[#4B5563] mt-1">{inv.number}</div>
            </div>
            <div className="text-right text-xs font-mono text-[#374151] space-y-0.5">
              <div>Issued <span className="text-[#0A0E1A]">{inv.issued}</span></div>
              <div>Due <span className="text-[#0A0E1A]">{inv.due}</span></div>
            </div>
          </div>
          <div className="p-5 border-b border-black/[0.08]">
            <div className="overline mb-2">Bill to</div>
            <div className="text-sm">{inv.customer}</div>
            {inv.customerEmail ? (
              <div className="text-xs text-[#4B5563] mt-1">{inv.customerEmail}</div>
            ) : null}
          </div>
          {lineItems.length === 0 ? (
            <div className="p-8 text-sm text-[#4B5563] text-center">No line items on this invoice.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {["SKU", "Description", "Qty", "Unit", "Amount"].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08] ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((l) => (
                  <tr key={l.id} className="border-b border-black/[0.08]/60">
                    <td className="px-4 py-3 font-mono text-xs text-[#374151]">{l.sku}</td>
                    <td className="px-4 py-3 text-sm">{l.description}</td>
                    <td className="px-4 py-3 font-mono tabular text-sm text-right">{l.qty}</td>
                    <td className="px-4 py-3 font-mono tabular text-sm text-right">{formatMoney(l.unit, inv.currency)}</td>
                    <td className="px-4 py-3 font-mono tabular text-sm text-right">{formatMoney(l.amount, inv.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="p-5 border-t border-black/[0.08] flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-[#374151]"><span>Subtotal</span><span className="font-mono tabular text-[#0A0E1A]">{formatMoney(inv.subtotal, inv.currency)}</span></div>
              <div className="flex justify-between text-[#374151]"><span>Tax</span><span className="font-mono tabular text-[#0A0E1A]">{formatMoney(inv.tax, inv.currency)}</span></div>
              <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-black/[0.08]"><span>Total</span><span className="font-mono tabular">{formatMoney(inv.total, inv.currency)}</span></div>
            </div>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-3">
            <div className="overline">Payment</div>
            <div className="flex justify-between text-sm"><span className="text-[#374151]">Amount</span><span className="font-mono tabular">{formatMoney(inv.amount, inv.currency)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#374151]">Paid</span><span className="font-mono tabular text-[#15803D]">{formatMoney(inv.paid, inv.currency)}</span></div>
            <div className="flex justify-between text-sm pt-2 border-t border-black/[0.08]"><span className="text-[#374151]">Balance</span><span className={`font-mono tabular ${inv.balance > 0 ? "text-[#B91C1C]" : "text-[#15803D]"}`}>{formatMoney(inv.balance, inv.currency)}</span></div>
          </div>
          {canPay && (
            <Button
              onClick={handleRecordPayment}
              disabled={actionLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              data-testid="invoice-mark-paid"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Record payment ({formatMoney(inv.balance, inv.currency)})
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}
