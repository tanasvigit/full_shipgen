import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import MapView from "@/components/common/MapView";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Warehouse as WarehouseIcon, MapPin, User } from "lucide-react";
import { palletService } from "@/services/pallet";
import { mapPalletWarehouse, statusLabelPallet, warehouseUsageFromInventory } from "@/lib/mappers";
import { toast } from "sonner";

export default function WarehousesList() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [whRaw, invRaw] = await Promise.all([
        palletService.listWarehouses({ limit: 200 }),
        palletService.listInventories({ limit: 1000 }),
      ]);
      const stub = (whRaw || []).map((w) => ({ id: w.uuid || w.public_id || w.id }));
      const usage = warehouseUsageFromInventory(invRaw || [], stub);
      setWarehouses((whRaw || []).map((w) => mapPalletWarehouse(w, usage[w.uuid || w.public_id || w.id])));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load warehouses.");
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(v) {
    setSubmitting(true);
    try {
      await palletService.createWarehouse({
        warehouse: {
          name: v.name.trim(),
          address: v.address.trim(),
          type: v.type || "primary",
          meta: {
            manager: v.manager || undefined,
            capacity: parseInt(v.capacity, 10) || undefined,
          },
        },
      });
      await load();
      return { toast: `Warehouse "${v.name}" added` };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create warehouse.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="warehouses-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Pallet", to: "/pallet" }, { label: "Warehouses" }]}
        overline="Inventory"
        title="Warehouses"
        description={loading ? "Loading…" : `${warehouses.length} warehouse locations`}
        actions={
          <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="warehouses-new-button">
            <Plus className="h-4 w-4 mr-1.5" /> Add warehouse
          </Button>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-full text-sm text-[#4B5563] py-12 text-center">Loading warehouses…</div>
          ) : warehouses.length === 0 ? (
            <div className="col-span-full text-sm text-[#4B5563] py-12 text-center">No warehouses found.</div>
          ) : (
            warehouses.map((w) => {
              const pct = w.capacity ? (w.used / w.capacity) * 100 : null;
              return (
                <div key={w.id} className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors" data-testid={`warehouse-card-${w.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-[#0066FF]/10 border border-[#0066FF]/25 grid place-items-center rounded-md">
                        <WarehouseIcon className="h-5 w-5 text-[#0066FF]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="overline">{w.publicId}</div>
                        <div className="font-display font-bold tracking-tight text-[#0A0E1A]">{w.name}</div>
                      </div>
                    </div>
                    <StatusBadge status={w.status} label={statusLabelPallet(w.status)} />
                  </div>
                  <div className="space-y-1.5 text-sm text-[#374151]">
                    <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span className="text-xs">{w.address}</span></div>
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 shrink-0" /><span className="text-xs">{w.manager}</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-black/[0.08]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="overline">Stock · {w.type.replace(/_/g, " ")}</span>
                      <span className="font-mono text-xs tabular text-[#1F2937]">
                        {w.used.toLocaleString()}
                        {w.capacity ? ` / ${w.capacity.toLocaleString()}` : " units"}
                      </span>
                    </div>
                    {pct != null ? (
                      <div className="h-1.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${pct >= 90 ? "bg-[#DC2626]" : pct >= 70 ? "bg-[#EAB308]" : "bg-[#16A34A]"}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#4B5563]">{w.skus} SKUs · capacity not set</div>
                    )}
                    {pct != null && (
                      <div className="flex items-center justify-between mt-3 text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                        <span>{w.skus} SKUs</span>
                        <span>{pct.toFixed(0)}% utilized</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-[600px] sticky top-6">
          <div className="px-4 py-2.5 border-b border-black/[0.08] overline flex items-center gap-2"><MapPin className="h-3 w-3" /> Network map</div>
          <div className="h-[calc(100%-37px)]">
            {loading ? (
              <div className="h-full grid place-items-center text-sm text-[#4B5563]">Loading map…</div>
            ) : (
              <MapView
                markers={warehouses
                  .filter((w) => w.lat || w.lng)
                  .map((w) => ({
                    id: w.id,
                    lat: w.lat,
                    lng: w.lng,
                    label: w.name,
                    popup: w.address,
                    color: w.status === "active" ? "#16A34A" : "#EAB308",
                  }))}
                testid="warehouses-map"
              />
            )}
          </div>
        </div>
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Add warehouse"
        description="Register a new warehouse location in Pallet."
        icon={WarehouseIcon}
        submitLabel={submitting ? "Creating…" : "Add warehouse"}
        testid="add-warehouse-dialog"
        fields={[
          { key: "name", label: "Warehouse name", placeholder: "Brooklyn Hub", required: true },
          { key: "address", label: "Address", placeholder: "123 Industry Ave, Brooklyn, NY", required: true },
          {
            key: "type",
            label: "Type",
            type: "select",
            col: "half",
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
              { value: "refrigerated", label: "Refrigerated" },
              { value: "cross_dock", label: "Cross-dock" },
              { value: "hazmat", label: "Hazmat" },
            ],
          },
          { key: "capacity", label: "Capacity (units)", type: "number", min: 100, defaultValue: "10000", col: "half" },
          { key: "manager", label: "Manager", placeholder: "Alex Tan" },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
