import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Download, PackageOpen } from "lucide-react";
import { palletService } from "@/services/pallet";
import {
  aggregateInventoryBySku,
  mapInventoryRecord,
  mapPalletWarehouse,
  statusLabelPallet,
} from "@/lib/mappers";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const STATUSES = ["all", "in_stock", "low_stock", "out_of_stock"];

export default function InventoryList() {
  const [status, setStatus] = useState("all");
  const [items, setItems] = useState([]);
  const [records, setRecords] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRaw, whRaw] = await Promise.all([
        palletService.listInventories({ limit: 1000 }),
        palletService.listWarehouses({ limit: 200 }),
      ]);
      setRecords((invRaw || []).map(mapInventoryRecord));
      setItems(aggregateInventoryBySku(invRaw || []));
      setWarehouses((whRaw || []).map((w) => mapPalletWarehouse(w)));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load inventory.");
      setItems([]);
      setRecords([]);
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
    () => (status === "all" ? items : items.filter((i) => i.status === status)),
    [items, status],
  );

  async function handleAdjust(v) {
    setSubmitting(true);
    try {
      const record = records.find((r) => r.sku === v.sku && r.warehouseId === v.warehouse);
      const delta = parseInt(v.delta, 10) || 0;
      if (!record) {
        toast.error(`No inventory record for ${v.sku} at selected warehouse.`);
        return { error: true };
      }
      const nextQty = Math.max(0, record.quantity + delta);
      await palletService.patchInventory(record.recordId, {
        inventory: { quantity: nextQty },
      });
      await load();
      return { toast: `Stock ${delta >= 0 ? "+" : ""}${delta} for ${record.name} at ${whById[v.warehouse]?.name || "warehouse"}` };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to adjust stock.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  const columns = [
    { key: "sku", header: "SKU", sortable: true, render: (r) => <span className="font-mono text-xs text-[#0066FF]">{r.sku}</span> },
    { key: "name", header: "Product", sortable: true, render: (r) => <span className="font-medium text-[#0A0E1A]">{r.name}</span> },
    { key: "category", header: "Category", render: (r) => <span className="text-xs">{r.category}</span> },
    {
      key: "warehouses",
      header: "Locations",
      render: (r) => {
        const entries = Object.entries(r.warehouses);
        if (entries.length === 0) return <span className="text-xs text-[#4B5563] italic">No stock</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {entries.map(([wId, qty]) => (
              <span key={wId} className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
                {(whById[wId]?.name || wId).split(" ")[0]}: {qty}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className={`font-mono tabular text-sm ${r.total === 0 ? "text-[#B91C1C]" : r.total < r.threshold ? "text-[#A16207]" : "text-[#0A0E1A]"}`}>
            {r.total}
          </span>
          {r.total < r.threshold && r.total > 0 && <AlertTriangle className="h-3 w-3 text-[#A16207]" />}
        </div>
      ),
    },
    { key: "threshold", header: "Min qty", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.threshold}</span> },
    { key: "cost", header: "Unit cost", sortable: true, render: (r) => <span className="font-mono tabular text-sm">${r.cost.toFixed(2)}</span> },
    {
      key: "lastReceived",
      header: "Updated",
      render: (r) => <span className="font-mono text-xs text-[#374151]">{formatRelativeApiTime(r.lastReceived)}</span>,
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={statusLabelPallet(r.status)} /> },
  ];

  return (
    <div data-testid="inventory-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Pallet", to: "/pallet" }, { label: "Inventory" }]}
        overline="Inventory"
        title="Stock Levels"
        description={
          loading ? "Loading…" : `${filtered.length} SKUs across ${warehouses.length} warehouses`
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => toast.info("Inventory export is not exposed on the pallet API yet.")}
              className="bg-white border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937] h-10 rounded-lg"
              data-testid="inventory-export"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="inventory-adjust">
              <Plus className="h-4 w-4 mr-1.5" /> Adjust stock
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              data-testid={`inventory-status-${s}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                status === s ? "bg-[#0066FF]/10 border-[#0066FF]/40 text-[#0040CC]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {s === "all" ? "All" : statusLabelPallet(s)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading inventory…</div>
        ) : (
          <DataTable testid="inventory-table" columns={columns} data={filtered} searchKeys={["sku", "name", "category"]} pageSize={10} />
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Adjust stock"
        description="Update quantity on an existing inventory record (PATCH). Does not create new SKU/warehouse pairs."
        icon={PackageOpen}
        submitLabel={submitting ? "Saving…" : "Adjust"}
        testid="adjust-stock-dialog"
        fields={[
          {
            key: "sku",
            label: "SKU",
            type: "select",
            required: true,
            options: items.map((i) => ({ value: i.sku, label: `${i.sku} · ${i.name}` })),
          },
          {
            key: "warehouse",
            label: "Warehouse",
            type: "select",
            required: true,
            col: "half",
            options: warehouses.map((w) => ({ value: w.id, label: w.name })),
          },
          { key: "delta", label: "Quantity Δ (+/-)", type: "number", required: true, defaultValue: "10", col: "half" },
          { key: "reason", label: "Reason", placeholder: "Cycle count, receipt, damage…" },
        ]}
        onSubmit={async (v) => {
          const result = await handleAdjust(v);
          if (!result?.error && v.reason) {
            try {
              const record = records.find((r) => r.sku === v.sku && r.warehouseId === v.warehouse);
              if (record) {
                await palletService.createStockAdjustment({
                  stock_adjustment: {
                    product_uuid: record.productId,
                    quantity: parseInt(v.delta, 10) || 0,
                    reason: v.reason,
                    type: "adjustment",
                  },
                });
              }
            } catch {
              /* adjustment record optional */
            }
          }
          return result;
        }}
      />
    </div>
  );
}
