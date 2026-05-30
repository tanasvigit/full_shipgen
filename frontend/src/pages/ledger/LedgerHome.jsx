import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import KpiCard from "@/components/common/KpiCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, Receipt } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ledgerService } from "@/services/ledger";
import { mapInvoiceRow, mapLedgerTxn, statusLabelExt } from "@/lib/mappers";
import { formatMoney, formatMoneyMinor, minorToMajor } from "@/lib/formatMoney";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const accents = { lg_revenue: "emerald", lg_outstanding: "amber", lg_paid: "blue", lg_overdue: "red" };

function pctLabel(changePct) {
  if (changePct == null || !Number.isFinite(Number(changePct))) return null;
  const n = Number(changePct);
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function trendFromPct(changePct) {
  if (changePct == null) return "neutral";
  return Number(changePct) >= 0 ? "up" : "down";
}

export default function LedgerHome() {
  const [dashboard, setDashboard] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, invRaw, txnRaw] = await Promise.all([
        ledgerService.getDashboard(),
        ledgerService.listInvoices({ limit: 200 }),
        ledgerService.listTransactions({ limit: 20, sort: "-created_at" }),
      ]);
      setDashboard(dash);
      setInvoices((invRaw || []).map(mapInvoiceRow));
      setTransactions((txnRaw || []).map(mapLedgerTxn));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load ledger overview.");
      setDashboard(null);
      setInvoices([]);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const currency = "USD";

  const kpis = useMemo(() => {
    const k = dashboard?.kpis || {};
    const rev = k.total_revenue || {};
    const ar = k.outstanding_ar || {};
    const counts = dashboard?.invoice_counts || {};
    const paidCount = Number(counts.paid || 0);
    const overdueCount = Number(counts.overdue || 0);

    return [
      {
        id: "lg_revenue",
        label: "Revenue · period",
        value: formatMoneyMinor(rev.current, currency),
        delta: pctLabel(rev.change_pct),
        trend: trendFromPct(rev.change_pct),
        series: (dashboard?.revenue_trend || []).map((r) => minorToMajor(r.daily_revenue)),
      },
      {
        id: "lg_outstanding",
        label: "Outstanding A/R",
        value: formatMoneyMinor(ar.total, currency),
        delta: ar.overdue ? `${formatMoneyMinor(ar.overdue, currency)} overdue` : null,
        trend: "neutral",
        series: [],
      },
      {
        id: "lg_paid",
        label: "Paid invoices",
        value: String(paidCount),
        delta: null,
        trend: "neutral",
        series: [],
      },
      {
        id: "lg_overdue",
        label: "Overdue invoices",
        value: String(overdueCount),
        delta: null,
        trend: overdueCount > 0 ? "down" : "neutral",
        series: [],
      },
    ];
  }, [dashboard, currency]);

  const revenueChart = useMemo(() => {
    const trend = dashboard?.revenue_trend || [];
    return trend.map((r) => {
      const d = r.date ? String(r.date).slice(5) : "—";
      return { d, revenue: minorToMajor(r.daily_revenue) };
    });
  }, [dashboard]);

  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status === "overdue"),
    [invoices],
  );

  return (
    <div data-testid="ledger-home">
      <PageHeader
        breadcrumbs={[{ label: "Ledger" }, { label: "Overview" }]}
        overline="Finance · Live"
        title="Ledger Overview"
        description={
          loading
            ? "Loading financial overview…"
            : "Track revenue, receivables, payments and wallet balances across the platform."
        }
        actions={
          <>
            <Button variant="outline" asChild className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <Link to="/ledger/reports">View reports <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
            <Button asChild className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="ledger-new-invoice">
              <Link to="/ledger/billing/invoices"><Plus className="h-4 w-4 mr-1.5" /> New invoice</Link>
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <KpiCard
              key={k.id}
              label={k.label}
              value={loading ? "…" : k.value}
              delta={k.delta}
              trend={k.trend}
              series={k.series}
              accent={accents[k.id] || "blue"}
              testid={`kpi-${k.id}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Revenue trend</div>
                <div className="font-display font-bold text-lg tracking-tight">Daily revenue (period)</div>
              </div>
            </div>
            <div className="h-[300px] p-3">
              {loading ? (
                <div className="h-full grid place-items-center text-sm text-[#4B5563]">Loading chart…</div>
              ) : revenueChart.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-[#4B5563]">No revenue data for this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChart} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="d" stroke="#52525b" tickLine={false} axisLine={{ stroke: "#27272a" }} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, fontSize: 12 }} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                    <Bar dataKey="revenue" fill="#10B981" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Action required</div>
                <div className="font-display font-bold text-lg tracking-tight">Overdue invoices</div>
              </div>
              <Link to="/ledger/billing/invoices" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">All →</Link>
            </div>
            <div className="divide-y divide-black/[0.06]">
              {loading ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">Loading…</div>
              ) : overdueInvoices.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">No overdue invoices. You&apos;re all good.</div>
              ) : (
                overdueInvoices.slice(0, 5).map((inv) => (
                  <Link key={inv.id} to={`/ledger/billing/invoices/${inv.id}`} className="flex items-center gap-3 p-3 hover:bg-[#F1F2F5]/50">
                    <div className="h-8 w-8 bg-red-500/10 border border-red-500/30 grid place-items-center rounded-sm">
                      <Receipt className="h-3.5 w-3.5 text-[#B91C1C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{inv.customer}</div>
                      <div className="text-[10px] font-mono text-[#4B5563]">{inv.number} · due {inv.due}</div>
                    </div>
                    <div className="font-mono text-sm tabular text-[#B91C1C]">{formatMoney(inv.balance, inv.currency)}</div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
            <div>
              <div className="overline">Recent transactions</div>
              <div className="font-display font-bold text-lg tracking-tight">Latest payment activity</div>
            </div>
            <Link to="/ledger/payments/transactions" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">View all →</Link>
          </div>
          {loading ? (
            <div className="p-8 text-sm text-[#4B5563] text-center">Loading transactions…</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-sm text-[#4B5563] text-center">No transactions yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {["Ref", "Type", "Customer", "Method", "Amount", "Status", "When"].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="border-b border-black/[0.08]/60 hover:bg-[#F1F2F5]/50">
                    <td className="px-4 py-3 font-mono text-xs text-[#0066FF]">{t.ref}</td>
                    <td className="px-4 py-3 text-sm capitalize">{t.type}</td>
                    <td className="px-4 py-3 text-sm">{t.customer}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#374151]">{t.method}</td>
                    <td className={`px-4 py-3 font-mono tabular text-right text-sm ${t.type === "refund" ? "text-[#B91C1C]" : "text-[#0A0E1A]"}`}>
                      {t.type === "refund" ? "-" : ""}{formatMoney(t.amount, t.currency)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} label={statusLabelExt(t.status)} /></td>
                    <td className="px-4 py-3 text-xs font-mono text-[#374151]">{formatRelativeApiTime(t.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
