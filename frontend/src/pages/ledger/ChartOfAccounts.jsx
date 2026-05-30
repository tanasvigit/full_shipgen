import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Download, TrendingUp, TrendingDown, BookText } from "lucide-react";
import { ledgerService } from "@/services/ledger";
import { mapAccount } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";

const TYPES = ["All", "Asset", "Liability", "Equity", "Revenue", "Expense"];

const TYPE_COLORS = {
  Asset: "bg-[#0066FF]/10 border-[#0066FF]/25 text-[#0040CC]",
  Liability: "bg-[#A16207]/10 border-[#A16207]/25 text-[#A16207]",
  Equity: "bg-[#0891B2]/10 border-[#0891B2]/25 text-[#0E7490]",
  Revenue: "bg-[#16A34A]/10 border-[#16A34A]/25 text-[#15803D]",
  Expense: "bg-[#DC2626]/10 border-[#DC2626]/25 text-[#B91C1C]",
};

const API_TYPE = {
  Asset: "asset",
  Liability: "liability",
  Equity: "equity",
  Revenue: "revenue",
  Expense: "expense",
};

export default function ChartOfAccounts() {
  const [type, setType] = useState("All");
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ledgerService.listAccounts({ limit: 500, sort: "code" });
      setAccounts((raw || []).map(mapAccount));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load accounts.");
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (type === "All" ? accounts : accounts.filter((a) => a.type === type)),
    [accounts, type],
  );

  const totals = useMemo(
    () =>
      ["Asset", "Liability", "Equity", "Revenue", "Expense"].map((t) => ({
        type: t,
        sum: accounts.filter((a) => a.type === t).reduce((s, a) => s + a.balance, 0),
      })),
    [accounts],
  );

  const columns = [
    { key: "code", header: "Code", sortable: true, render: (r) => <span className="font-mono text-xs text-[#1F2937]">{r.code}</span> },
    { key: "name", header: "Account", sortable: true, render: (r) => <span className="font-medium text-[#0A0E1A]">{r.name}</span> },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${TYPE_COLORS[r.type] || ""}`}>{r.type}</span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      sortable: true,
      render: (r) => <span className="font-mono tabular text-sm text-[#0A0E1A]">{formatMoney(r.balance, r.currency)}</span>,
    },
    {
      key: "change",
      header: "Δ vs. last period",
      sortable: false,
      render: (r) =>
        r.change == null ? (
          <span className="font-mono text-xs text-[#4B5563]">—</span>
        ) : (
          <span className={`inline-flex items-center gap-1 font-mono text-xs ${r.change > 0 ? "text-[#15803D]" : r.change < 0 ? "text-[#B91C1C]" : "text-[#4B5563]"}`}>
            {r.change > 0 ? <TrendingUp className="h-3 w-3" /> : r.change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
            {r.change > 0 ? "+" : ""}{r.change}%
          </span>
        ),
    },
  ];

  async function handleCreate(v) {
    setSubmitting(true);
    try {
      await ledgerService.createAccount({
        account: {
          code: v.code.trim(),
          name: v.name.trim(),
          type: API_TYPE[v.type] || v.type?.toLowerCase(),
          currency: "USD",
        },
      });
      await load();
      return { toast: `Account ${v.code} ${v.name} created` };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create account.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="chart-of-accounts-page">
      <PageHeader
        breadcrumbs={[{ label: "Ledger", to: "/ledger" }, { label: "Accounting" }, { label: "Chart of Accounts" }]}
        overline="Accounting"
        title="Chart of Accounts"
        description={loading ? "Loading…" : `${accounts.length} accounts across 5 account types`}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Account export is not exposed on the ledger API yet.")}
              className="bg-white border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937] h-10 rounded-lg"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="account-new">
              <Plus className="h-4 w-4 mr-1.5" /> New account
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {totals.map((t) => (
            <div key={t.type} className="bg-white border border-black/[0.08] rounded-md p-4" data-testid={`account-total-${t.type.toLowerCase()}`}>
              <div className={`overline inline-block px-1.5 py-0.5 rounded-sm border ${TYPE_COLORS[t.type]}`}>{t.type}</div>
              <div className="font-display text-xl font-black tabular tracking-tight mt-2 text-[#0A0E1A]">
                {loading ? "…" : formatMoney(t.sum)}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              data-testid={`account-type-${t.toLowerCase()}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                type === t ? "bg-[#0066FF]/10 border-[#0066FF]/40 text-[#0040CC]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading accounts…</div>
        ) : (
          <DataTable testid="accounts-table" columns={columns} data={filtered} searchKeys={["code", "name", "type"]} pageSize={15} />
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New account"
        description="Add a new ledger account. Balances are computed from journal entries, not opening balance on create."
        icon={BookText}
        submitLabel={submitting ? "Creating…" : "Create account"}
        testid="new-account-dialog"
        fields={[
          { key: "code", label: "Code", placeholder: "1100", required: true, col: "half" },
          {
            key: "type",
            label: "Type",
            type: "select",
            required: true,
            col: "half",
            options: [
              { value: "Asset", label: "Asset" },
              { value: "Liability", label: "Liability" },
              { value: "Equity", label: "Equity" },
              { value: "Revenue", label: "Revenue" },
              { value: "Expense", label: "Expense" },
            ],
          },
          { key: "name", label: "Account name", placeholder: "Accounts Receivable", required: true },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
