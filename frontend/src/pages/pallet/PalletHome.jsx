import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import KpiCard from "@/components/common/KpiCard";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpRight, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, Settings2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { palletService } from "@/services/pallet";
import {
  aggregateInventoryBySku,
  mapPalletWarehouse,
  mapPurchaseOrderRow,
  mapStockMovement,
  statusLabelPallet,
  warehouseUsageFromInventory,
} from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

const accents = { total_skus: "blue", stock_value: "emerald", low_stock: "amber", out_of_stock: "red", pending_pos: "cyan", fill_rate: "emerald" };

const ICONS = { inbound: ArrowDownToLine, outbound: ArrowUpFromLine, transfer: ArrowRightLeft, adjustment: Settings2 };
const COLORS = { inbound: "text-[#15803D]", outbound: "text-[#A16207]", transfer: "text-[#0066FF]", adjustment: "text-[#374151]" };

export default function PalletHome() {
  const [skus, setSkus] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [movements, setMovements] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRaw, whRaw, adjRaw, poRaw] = await Promise.all([
        palletService.listInventories({ limit: 1000 }),
        palletService.listWarehouses({ limit: 200 }),
        palletService.listStockAdjustments({ limit: 20, sort: "-created_at" }),
        palletService.listPurchaseOrders({ limit: 500 }),
      ]);
      const aggregated = aggregateInventoryBySku(invRaw || []);
      setSkus(aggregated);
      const whStub = (whRaw || []).map((w) => ({ id: w.uuid || w.public_id || w.id }));
      const usage = warehouseUsageFromInventory(invRaw || [], whStub);
      const whMapped = (whRaw || []).map((w) => mapPalletWarehouse(w, usage[w.uuid || w.public_id || w.id]));
      setWarehouses(whMapped);
      const whLookup = Object.fromEntries(whMapped.map((w) => [w.id, w]));
      setMovements((adjRaw || []).map((a) => mapStockMovement(a, whLookup)));
      setPurchaseOrders((poRaw || []).map(mapPurchaseOrderRow));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load pallet overview.");
      setSkus([]);
      setWarehouses([]);
      setMovements([]);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const lowStock = skus.filter((i) => i.status === "low_stock").length;
    const outOfStock = skus.filter((i) => i.status === "out_of_stock").length;
    const stockValue = skus.reduce((s, i) => s + (i.cost || 0) * i.total, 0);
    const pendingPos = purchaseOrders.filter((p) =>
      ["draft", "approved", "in_transit", "pending"].includes(p.status),
    ).length;
    const inStock = skus.filter((i) => i.status === "in_stock").length;
    const fillRate = skus.length ? (inStock / skus.length) * 100 : 0;

    return [
      { id: "total_skus", label: "Total SKUs", value: String(skus.length), delta: null, trend: "neutral", series: [] },
      { id: "stock_value", label: "Stock value (cost)", value: formatMoney(stockValue), delta: null, trend: "neutral", series: [] },
      { id: "low_stock", label: "Low stock SKUs", value: String(lowStock), delta: null, trend: lowStock > 0 ? "down" : "neutral", series: [] },
      { id: "out_of_stock", label: "Out of stock", value: String(outOfStock), delta: null, trend: outOfStock > 0 ? "down" : "neutral", series: [] },
      { id: "pending_pos", label: "Open POs", value: String(pendingPos), delta: null, trend: "neutral", series: [] },
      { id: "fill_rate", label: "Fill rate", value: `${fillRate.toFixed(1)}%`, delta: null, trend: "neutral", series: [] },
    ];
  }, [skus, purchaseOrders]);

  const flowChart = useMemo(() => {
    const byDay = {};
    for (const m of movements) {
      if (!m.time) continue;
      const d = new Date(m.time).toLocaleDateString("en-US", { weekday: "short" });
      if (!byDay[d]) byDay[d] = { d, inbound: 0, outbound: 0 };
      if (m.units >= 0) byDay[d].inbound += Math.abs(m.units);
      else byDay[d].outbound += Math.abs(m.units);
    }
    return Object.values(byDay);
  }, [movements]);

  const lowStockSkus = useMemo(
    () => skus.filter((i) => i.status === "low_stock" || i.status === "out_of_stock").slice(0, 8),
    [skus],
  );

  return (
    <div data-testid="pallet-home">
      <PageHeader
        breadcrumbs={[{ label: "Pallet" }, { label: "Overview" }]}
        overline="Inventory · Live"
        title="Warehouse Operations"
        description={
          loading
            ? "Loading warehouse overview…"
            : "Track stock levels, transfers and procurement across your warehouse network."
        }
        actions={
          <>
            <Button variant="outline" asChild className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <Link to="/pallet/inventory">All SKUs <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700" data-testid="pallet-new-po">
              <Link to="/pallet/purchase-orders"><Plus className="h-4 w-4 mr-1" /> New PO</Link>
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
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
                <div className="overline">Stock adjustments · recent</div>
                <div className="font-display font-bold text-lg tracking-tight">Adjustment activity (7d view)</div>
              </div>
            </div>
            <div className="h-[300px] p-3">
              {loading ? (
                <div className="h-full grid place-items-center text-sm text-[#4B5563]">Loading…</div>
              ) : movements.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-[#4B5563]">No recent stock adjustments.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flowChart} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="d" stroke="#52525b" tickLine={false} axisLine={{ stroke: "#27272a" }} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, fontSize: 12 }} cursor={{ fill: "rgba(59,130,246,0.04)" }} />
                    <Bar dataKey="inbound" fill="#10B981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="outbound" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline flex items-center gap-2"><AlertTriangle className="h-3 w-3 text-[#A16207]" /> Action required</div>
                <div className="font-display font-bold text-lg tracking-tight">Stock alerts</div>
              </div>
              <Link to="/pallet/inventory" className="text-xs text-[#0066FF] font-medium">View all →</Link>
            </div>
            <div className="divide-y divide-black/[0.06] max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">Loading…</div>
              ) : lowStockSkus.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">No low-stock alerts.</div>
              ) : (
                lowStockSkus.map((i) => (
                  <div key={i.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-[#0066FF]">{i.sku}</span>
                      <StatusBadge status={i.status} label={statusLabelPallet(i.status)} />
                    </div>
                    <div className="text-sm font-medium truncate mt-1">{i.name}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                      <span>{i.total} on hand</span>
                      <span>·</span>
                      <span>min {i.threshold}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Live activity</div>
                <div className="font-display font-bold text-lg tracking-tight">Recent stock movements</div>
              </div>
            </div>
            <div className="divide-y divide-black/[0.06]">
              {loading ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">Loading…</div>
              ) : movements.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">No stock movements yet.</div>
              ) : (
                movements.slice(0, 6).map((m) => {
                  const Icon = ICONS[m.type] || Settings2;
                  return (
                    <div key={m.id} className="p-3 flex items-center gap-3">
                      <div className={`h-8 w-8 grid place-items-center bg-[#F1F2F5] border border-black/[0.08] rounded-sm shrink-0 ${COLORS[m.type] || COLORS.adjustment}`}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-xs text-[#0066FF]">{m.sku}</span>
                          <span className={`font-mono text-sm tabular ${m.units > 0 ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
                            {m.units > 0 ? "+" : ""}{m.units}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563] mt-0.5">
                          {m.warehouse} · {m.reference}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-[#4B5563]">{formatRelativeApiTime(m.time)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Warehouses</div>
                <div className="font-display font-bold text-lg tracking-tight">Utilization</div>
              </div>
              <Link to="/pallet/warehouses" className="text-xs text-[#0066FF] font-medium">All →</Link>
            </div>
            <div className="divide-y divide-black/[0.06]">
              {loading ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">Loading…</div>
              ) : warehouses.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563] text-center">No warehouses configured.</div>
              ) : (
                warehouses.map((w) => {
                  const pct = w.capacity ? (w.used / w.capacity) * 100 : null;
                  return (
                    <div key={w.id} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{w.name}</div>
                          <div className="text-[10px] text-[#4B5563] capitalize">
                            {w.type.replace(/_/g, " ")} · {w.skus} SKUs
                          </div>
                        </div>
                        <span className="font-mono text-xs tabular text-[#1F2937]">
                          {w.used.toLocaleString()}
                          {w.capacity ? ` / ${w.capacity.toLocaleString()}` : " units"}
                        </span>
                      </div>
                      {pct != null ? (
                        <div className="h-1.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#4B5563]">Capacity not configured on warehouse</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
