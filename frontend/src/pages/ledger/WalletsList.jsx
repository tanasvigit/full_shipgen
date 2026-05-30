import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Wallet as WalletIcon, Users, Building, Briefcase } from "lucide-react";
import { ledgerService } from "@/services/ledger";
import { mapWallet } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const ICONS = { driver: Users, network: Building, internal: Briefcase };

export default function WalletsList() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await ledgerService.listWallets({ limit: 200 });
      setWallets((raw || []).map(mapWallet));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load wallets.");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = useMemo(
    () => wallets.reduce((s, w) => s + (w.currency === "USD" ? w.balance : 0), 0),
    [wallets],
  );

  return (
    <div data-testid="wallets-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Ledger", to: "/ledger" }, { label: "Payments" }, { label: "Wallets" }]}
        overline="Payments"
        title="Wallets"
        description={
          loading
            ? "Loading wallets…"
            : `${wallets.length} wallets · total balance ${formatMoney(total)}`
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-sm text-[#4B5563] py-12 text-center">Loading wallets…</div>
        ) : wallets.length === 0 ? (
          <div className="col-span-full text-sm text-[#4B5563] py-12 text-center">No wallets found.</div>
        ) : (
          wallets.map((w) => {
            const Icon = ICONS[w.type] || WalletIcon;
            const balanceLabel = w.balanceFormatted || formatMoney(w.balance, w.currency);
            return (
              <div
                key={w.id}
                className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors"
                data-testid={`wallet-card-${w.id}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-sm">
                    <Icon className="h-5 w-5 text-[#0066FF]" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
                    {w.type}{w.isFrozen ? " · frozen" : ""}
                  </span>
                </div>
                <div className="font-display text-3xl font-black tabular tracking-tight">{balanceLabel}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563] mt-1">{w.currency}</div>
                <div className="mt-4 pt-4 border-t border-black/[0.08]">
                  <div className="text-sm font-medium">{w.owner}</div>
                  <div className="text-[11px] text-[#4B5563] mt-0.5">
                    Last activity {formatRelativeApiTime(w.lastActivity)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
