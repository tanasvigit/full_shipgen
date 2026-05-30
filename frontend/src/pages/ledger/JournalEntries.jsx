import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, ArrowDownRight, ArrowUpRight, CheckCircle2, Circle, NotebookPen } from "lucide-react";
import { ledgerService } from "@/services/ledger";
import { mapAccount, mapJournalEntry, statusLabelExt } from "@/lib/mappers";
import { formatMoney, majorToMinor } from "@/lib/formatMoney";
import { toast } from "sonner";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jeRaw, accRaw] = await Promise.all([
        ledgerService.listJournals({ limit: 200, sort: "-entry_date" }),
        ledgerService.listAccounts({ limit: 500 }),
      ]);
      setEntries((jeRaw || []).map(mapJournalEntry));
      setAccounts((accRaw || []).map(mapAccount));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load journal entries.");
      setEntries([]);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const postedCount = entries.filter((e) => e.posted).length;
  const draftCount = entries.length - postedCount;

  const accountOptions = accounts.map((a) => ({
    value: a.uuid || a.id,
    label: `${a.code} ${a.name}`,
  }));

  async function handleCreate(v) {
    setSubmitting(true);
    try {
      await ledgerService.createManualJournal({
        debit_account_uuid: v.debitAccount,
        credit_account_uuid: v.creditAccount,
        amount: majorToMinor(parseFloat(v.amount) || 0),
        currency: "USD",
        description: v.description.trim(),
        entry_date: v.date || todayIso(),
      });
      await load();
      return { toast: "Journal entry created" };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create journal entry.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="journal-entries-page">
      <PageHeader
        breadcrumbs={[{ label: "Ledger", to: "/ledger" }, { label: "Accounting" }, { label: "Journal" }]}
        overline="Accounting"
        title="Journal Entries"
        description={loading ? "Loading…" : `${postedCount} posted · ${draftCount} draft`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={accounts.length < 2}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="je-new"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New entry
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading journal entries…</div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">No journal entries yet.</div>
        ) : (
          entries.map((e) => {
            const balanced = e.debit.amount === e.credit.amount;
            return (
              <div key={e.id} className="bg-white border border-black/[0.08] rounded-md overflow-hidden" data-testid={`je-${e.id}`}>
                <div className="px-4 py-3 border-b border-black/[0.08] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    {e.posted ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#15803D]">
                        <CheckCircle2 className="h-3 w-3" /> Posted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#A16207]">
                        <Circle className="h-3 w-3" /> {statusLabelExt(e.status)}
                      </span>
                    )}
                    <span className="font-mono text-xs text-[#0066FF]">{e.number}</span>
                    <span className="font-mono text-xs text-[#4B5563]">{e.date}</span>
                  </div>
                  <span className="text-sm text-[#1F2937]">{e.description}</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563]">Account</th>
                      <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563]">Debit</th>
                      <th className="text-right px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563]">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-black/[0.05]">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <ArrowDownRight className="h-3 w-3 text-[#15803D]" />
                          <span className="font-mono text-xs text-[#4B5563]">{e.debit.code}</span>
                          <span className="text-[#0A0E1A]">{e.debit.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular text-[#0A0E1A]">{formatMoney(e.debit.amount, e.currency)}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#374151]">—</td>
                    </tr>
                    <tr className="border-t border-black/[0.05]">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <ArrowUpRight className="h-3 w-3 text-[#A16207]" />
                          <span className="font-mono text-xs text-[#4B5563]">{e.credit.code}</span>
                          <span className="text-[#0A0E1A]">{e.credit.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#374151]">—</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular text-[#0A0E1A]">{formatMoney(e.credit.amount, e.currency)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-black/[0.08]">
                      <td className="px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">{balanced ? "Balanced" : "Out of balance"}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs tabular text-[#374151]">{formatMoney(e.debit.amount, e.currency)}</td>
                      <td className="px-4 py-2 text-right font-mono text-xs tabular text-[#374151]">{formatMoney(e.credit.amount, e.currency)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New journal entry"
        description="Record a manual debit-credit pair (amounts in USD, stored in cents on the server)."
        icon={NotebookPen}
        submitLabel={submitting ? "Creating…" : "Create entry"}
        testid="new-je-dialog"
        fields={[
          { key: "description", label: "Description", placeholder: "Office supplies purchase", required: true },
          { key: "date", label: "Date", defaultValue: todayIso(), col: "half" },
          { key: "amount", label: "Amount (USD)", type: "number", min: 0.01, step: 0.01, defaultValue: "100", required: true, col: "half" },
          {
            key: "debitAccount",
            label: "Debit account",
            type: "select",
            required: true,
            col: "half",
            options: accountOptions,
          },
          {
            key: "creditAccount",
            label: "Credit account",
            type: "select",
            required: true,
            col: "half",
            options: accountOptions,
          },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
