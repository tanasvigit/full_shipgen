import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { ledgerService } from "@/services/ledger";
import { mapLedgerTxn, statusLabelExt } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const TYPES = ["all", "charge", "refund", "payout"];

export default function TransactionsList() {
  const [type, setType] = useState("all");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ledgerService.listTransactions({ limit: 500, sort: "-created_at" });
      setTransactions((raw || []).map(mapLedgerTxn));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load transactions.");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (type === "all" ? transactions : transactions.filter((t) => t.type === type)),
    [transactions, type],
  );

  const columns = [
    { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-xs text-[#0066FF]">{r.ref}</span> },
    { key: "time", header: "When", render: (r) => <span className="font-mono text-xs">{formatRelativeApiTime(r.time)}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <span
          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${
            r.type === "refund"
              ? "bg-red-500/10 border-red-500/20 text-[#B91C1C]"
              : r.type === "payout"
                ? "bg-blue-500/10 border-blue-500/20 text-[#0066FF]"
                : "bg-emerald-500/10 border-emerald-500/20 text-[#15803D]"
          }`}
        >
          {r.type}
        </span>
      ),
    },
    { key: "customer", header: "Counterparty", render: (r) => <span className="text-sm">{r.customer}</span> },
    { key: "method", header: "Method", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.method}</span> },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (r) => (
        <span className={`font-mono tabular text-sm ${r.type === "refund" ? "text-[#B91C1C]" : "text-[#0A0E1A]"}`}>
          {r.type === "refund" ? "-" : ""}{formatMoney(r.amount, r.currency)}
        </span>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={statusLabelExt(r.status)} /> },
  ];

  return (
    <div data-testid="transactions-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Ledger", to: "/ledger" }, { label: "Payments" }, { label: "Transactions" }]}
        overline="Payments"
        title="Transactions"
        description={loading ? "Loading…" : `${filtered.length} payment transactions`}
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              data-testid={`transactions-type-${t}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                type === t ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading transactions…</div>
        ) : (
          <DataTable testid="transactions-table" columns={columns} data={filtered} searchKeys={["ref", "customer", "method"]} pageSize={10} />
        )}
      </div>
    </div>
  );
}
