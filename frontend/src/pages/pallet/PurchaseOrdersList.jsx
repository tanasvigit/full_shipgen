import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, ScrollText } from "lucide-react";
import { palletService } from "@/services/pallet";
import { mapPurchaseOrderRow, mapPalletSupplier, mapPalletWarehouse, statusLabelPallet } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";

const STATUSES = ["all", "draft", "approved", "in_transit", "received", "canceled"];
const todayIso = () => new Date().toISOString().slice(0, 10);

export default function PurchaseOrdersList() {
  const [status, setStatus] = useState("all");
  const [pos, setPos] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [poRaw, supRaw, whRaw] = await Promise.all([
        palletService.listPurchaseOrders({ limit: 500, sort: "-created_at" }),
        palletService.listSuppliers({ limit: 200 }),
        palletService.listWarehouses({ limit: 200 }),
      ]);
      setPos((poRaw || []).map(mapPurchaseOrderRow));
      setSuppliers((supRaw || []).map((s) => mapPalletSupplier(s)));
      setWarehouses((whRaw || []).map((w) => mapPalletWarehouse(w)));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load purchase orders.");
      setPos([]);
      setSuppliers([]);
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
    () => (status === "all" ? pos : pos.filter((p) => p.status === status)),
    [pos, status],
  );

  const pendingCount = useMemo(
    () => pos.filter((p) => ["approved", "in_transit", "pending", "draft"].includes(p.status)).length,
    [pos],
  );

  const columns = [
    { key: "number", header: "PO Number", sortable: true, render: (r) => <span className="font-mono text-xs text-[#0066FF]">{r.number}</span> },
    { key: "supplier", header: "Supplier", sortable: true, render: (r) => <span className="font-medium text-[#0A0E1A]">{r.supplier}</span> },
    {
      key: "warehouse",
      header: "Destination",
      render: (r) => (
        <span className="text-sm">{r.warehouseName || (r.warehouse ? whById[r.warehouse]?.name : "—")}</span>
      ),
    },
    { key: "items", header: "Items", sortable: true, render: (r) => <span className="font-mono text-sm tabular">{r.items || "—"}</span> },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (r) => (
        <span className="font-mono tabular text-sm">{r.total > 0 ? formatMoney(r.total) : "—"}</span>
      ),
    },
    { key: "issued", header: "Issued", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.issued}</span> },
    { key: "expected", header: "Expected", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.expected}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={statusLabelPallet(r.status)} /> },
  ];

  async function handleCreate(v) {
    setSubmitting(true);
    try {
      const supplier = suppliers.find((s) => s.id === v.supplier || s.name === v.supplier);
      await palletService.createPurchaseOrder({
        purchase_order: {
          supplier_uuid: supplier?.uuid || supplier?.id || v.supplier,
          status: "draft",
          reference_code: v.reference || undefined,
          expected_delivery_at: v.expected || todayIso(),
          description: v.description || undefined,
          meta: {
            warehouse_uuid: v.warehouse || undefined,
            items_count: parseInt(v.items, 10) || 0,
            total: parseFloat(v.total) || 0,
          },
        },
      });
      await load();
      return { toast: "Purchase order created" };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create purchase order.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="purchase-orders-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Pallet", to: "/pallet" }, { label: "Purchase Orders" }]}
        overline="Procurement"
        title="Purchase Orders"
        description={loading ? "Loading…" : `${filtered.length} POs · ${pendingCount} open`}
        actions={
          <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="po-new-button">
            <Plus className="h-4 w-4 mr-1.5" /> New PO
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              data-testid={`po-status-${s}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${
                status === s ? "bg-[#0066FF]/10 border-[#0066FF]/40 text-[#0040CC]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"
              }`}
            >
              {s === "all" ? "All" : statusLabelPallet(s)}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-sm text-[#4B5563] py-12 text-center">Loading purchase orders…</div>
        ) : (
          <DataTable testid="po-table" columns={columns} data={filtered} searchKeys={["number", "supplier"]} pageSize={10} />
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New purchase order"
        description="Create a purchase order against a supplier. Line items and totals are stored in meta until a dedicated PO lines API exists."
        icon={ScrollText}
        submitLabel={submitting ? "Creating…" : "Create PO"}
        testid="new-po-dialog"
        fields={[
          {
            key: "supplier",
            label: "Supplier",
            type: "select",
            required: true,
            options: suppliers.map((s) => ({ value: s.uuid || s.id, label: s.name })),
          },
          {
            key: "warehouse",
            label: "Destination warehouse",
            type: "select",
            col: "half",
            options: warehouses.map((w) => ({ value: w.id, label: w.name })),
          },
          { key: "expected", label: "Expected delivery", placeholder: todayIso(), col: "half" },
          { key: "reference", label: "Reference code", placeholder: "PO-2026-0001", col: "half" },
          { key: "items", label: "Items (count)", type: "number", min: 0, defaultValue: "1", col: "half" },
          { key: "total", label: "Total (USD)", type: "number", min: 0, step: 0.01, defaultValue: "0", col: "half" },
          { key: "description", label: "Description", placeholder: "Optional notes" },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
