import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, ArrowRightLeft, Info } from "lucide-react";
import { palletService } from "@/services/pallet";
import { mapAuditTransfer, mapPalletWarehouse, statusLabelPallet } from "@/lib/mappers";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const STATUSES = ["all", "draft", "in_transit", "received", "canceled"];

export default function TransfersList() {
  const [status, setStatus] = useState("all");
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [auditRaw, whRaw] = await Promise.all([
        palletService.listAudits({ limit: 500, sort: "-created_at" }),
        palletService.listWarehouses({ limit: 200 }),
      ]);
      const whMapped = (whRaw || []).map((w) => mapPalletWarehouse(w));
      setWarehouses(whMapped);
      const whLookup = Object.fromEntries(whMapped.map((w) => [w.id, w]));
      const xfer = (auditRaw || [])
        .map((a) => mapAuditTransfer(a, whLookup))
        .filter(Boolean);
      setTransfers(xfer);
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load transfer activity.");
      setTransfers([]);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const whById = useMemo(() => Object.fromEntries(warehouses.map((w) => [w.id, w])), [warehouses]);

  const filtered = useMemo(
    () => (status === "all" ? transfers : transfers.filter((t) => t.status === status)),
    [transfers, status],
  );

  const columns = [
    { key: "number", header: "Number", sortable: true, render: (r) => <span className="font-mono text-xs text-[#0066FF]">{r.number}</span> },
    {
      key: "route",
      header: "Route",
      render: (r) => (
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-[#1F2937]">{(whById[r.from]?.name || r.from || "—").split(" ")[0]}</span>
          <ArrowRight className="h-3 w-3 text-[#4B5563]" />
          <span className="text-[#0A0E1A] font-medium">{(whById[r.to]?.name || r.to || "—").split(" ")[0]}</span>
        </div>
      ),
    },
    { key: "skuCount", header: "SKUs", sortable: true, render: (r) => <span className="font-mono text-sm tabular">{r.skuCount}</span> },
    { key: "units", header: "Units", sortable: true, render: (r) => <span className="font-mono text-sm tabular">{r.units.toLocaleString()}</span> },
    { key: "initiatedBy", header: "Initiated by", render: (r) => <span className="text-sm text-[#1F2937]">{r.initiatedBy}</span> },
    { key: "initiated", header: "Initiated", render: (r) => <span className="font-mono text-xs text-[#374151]">{formatRelativeApiTime(r.initiated)}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={statusLabelPallet(r.status)} /> },
  ];

  return (
    <div data-testid="transfers-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Pallet", to: "/pallet" }, { label: "Transfers" }]}
        overline="Inventory"
        title="Stock Transfers"
        description={
          loading
            ? "Loading…"
            : `${filtered.length} warehouse moves from inventory audits`
        }
        actions={
          <Button
            variant="outline"
            onClick={() =>
              toast.info(
                "Pallet API has no dedicated transfers resource. Inter-warehouse moves appear here when recorded via inventory audits.",
              )
            }
            className="bg-white border-black/[0.08] text-[#1F2937] h-10 rounded-lg"
            data-testid="transfers-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New transfer
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-2 p-3 bg-[#F1F2F5] border border-black/[0.08] rounded-md text-sm text-[#374151]">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#0066FF]" />
          <span>
            Fleetbase Pallet does not expose a <code className="font-mono text-xs">/transfers</code> endpoint. This view lists
            inventory audit events where <code className="font-mono text-xs">warehouse_uuid</code> changed. Use{" "}
            <a href="/pallet/inventory" className="text-[#0066FF] underline">stock adjustments</a> for quantity changes at a single location.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              data-testid={`transfers-status-${s}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                status === s ? "bg-[#0066FF]/10 border-[#0066FF]/40 text-[#0040CC]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {s === "all" ? "All" : statusLabelPallet(s)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading transfer activity…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-[#4B5563] py-12 text-center flex flex-col items-center gap-2">
            <ArrowRightLeft className="h-8 w-8 text-[#4B5563]" />
            No inter-warehouse audit events found for this period.
          </div>
        ) : (
          <DataTable testid="transfers-table" columns={columns} data={filtered} searchKeys={["number", "initiatedBy"]} pageSize={10} />
        )}
      </div>
    </div>
  );
}
