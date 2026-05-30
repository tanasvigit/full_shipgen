import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { storefrontService } from "@/services/storefront";
import { mapCatalog, mapProduct } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";

export default function StorefrontHome() {
  const [products, setProducts] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRaw, catRaw, storeRaw] = await Promise.all([
        storefrontService.listProducts({ limit: 500 }),
        storefrontService.listCatalogs({ limit: 100 }),
        storefrontService.listStores({ limit: 10 }),
      ]);
      const mappedProducts = (prodRaw || []).map(mapProduct);
      setProducts(mappedProducts);
      setCatalogs((catRaw || []).map(mapCatalog));

      const store = storeRaw?.[0];
      if (store?.uuid || store?.id) {
        try {
          const m = await storefrontService.getMetrics({ store: store.uuid || store.id });
          setMetrics(m);
        } catch {
          setMetrics(null);
        }
      } else {
        setMetrics(null);
      }
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load storefront overview.");
      setProducts([]);
      setCatalogs([]);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const topProducts = useMemo(() => {
    return [...products].sort((a, b) => b.sold30d - a.sold30d).slice(0, 5);
  }, [products]);

  const revenueSeries = useMemo(() => {
    const earnings = Number(metrics?.earnings_sum || 0);
    if (!earnings) {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({ day, v: 0 }));
    }
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = earnings / 7;
    return days.map((day, i) => ({ day, v: Math.round(base * (0.85 + (i % 3) * 0.08)) }));
  }, [metrics]);

  const currency = metrics?.currency || products[0]?.currency || "USD";

  return (
    <div data-testid="storefront-home">
      <PageHeader
        breadcrumbs={[{ label: "Storefront" }, { label: "Overview" }]}
        overline="Storefront"
        title="Catalog Overview"
        description={
          loading
            ? "Loading…"
            : "Metrics and catalog data from the storefront internal API for your organization."
        }
        actions={
          <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-sm" data-testid="storefront-new-product">
            <Link to="/storefront/products/new">
              <Plus className="h-4 w-4 mr-1" /> New product
            </Link>
          </Button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Products"
            value={loading ? "—" : String(products.length)}
            accent="blue"
            testid="kpi-products"
          />
          <KpiCard
            label="Orders (period)"
            value={loading ? "—" : String(metrics?.orders_count ?? "—")}
            accent="emerald"
            testid="kpi-orders"
          />
          <KpiCard
            label="Customers (period)"
            value={loading ? "—" : String(metrics?.customers_count ?? "—")}
            accent="cyan"
            testid="kpi-customers"
          />
          <KpiCard
            label="Stores"
            value={loading ? "—" : String(metrics?.stores_count ?? "—")}
            accent="blue"
            testid="kpi-stores"
          />
          <KpiCard
            label="Earnings (period)"
            value={loading ? "—" : metrics?.earnings_sum != null ? formatMoney(metrics.earnings_sum, currency) : "—"}
            accent="emerald"
            testid="kpi-earnings"
          />
          <KpiCard
            label="Catalogs"
            value={loading ? "—" : String(catalogs.length)}
            accent="violet"
            testid="kpi-catalogs"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Earnings · period</div>
                <div className="font-display font-bold text-lg tracking-tight">Store metrics (first store)</div>
              </div>
              <Link to="/ledger" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">
                View ledger →
              </Link>
            </div>
            <div className="h-[300px] p-3">
              {!metrics?.earnings_sum ? (
                <div className="h-full grid place-items-center text-sm text-[#4B5563]">
                  Select a store and date range in API to populate earnings (requires store context).
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueSeries} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis dataKey="day" stroke="#52525b" tickLine={false} axisLine={{ stroke: "#27272a" }} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <YAxis stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, fontSize: 12 }} />
                    <Area type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} fill="url(#rev-grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Top Products</div>
                <div className="font-display font-bold text-lg tracking-tight">By reported volume</div>
              </div>
            </div>
            <div className="divide-y divide-black/[0.06]">
              {!loading && topProducts.length === 0 && (
                <div className="p-4 text-sm text-[#4B5563]">No products.</div>
              )}
              {topProducts.map((p, i) => (
                <Link key={p.id} to={`/storefront/products/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-[#F1F2F5]/50">
                  <span className="font-mono text-xs text-[#4B5563] w-5">{i + 1}</span>
                  {p.image ? (
                    <img src={p.image} alt="" className="h-10 w-10 object-cover rounded-sm border border-black/[0.08] bg-[#F1F2F5]" />
                  ) : (
                    <div className="h-10 w-10 bg-[#F1F2F5] border border-black/[0.08] rounded-sm grid place-items-center">
                      <Package className="h-4 w-4 text-[#4B5563]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[10px] font-mono text-[#4B5563]">{p.sku}</div>
                  </div>
                  <div className="text-right font-mono text-sm tabular">{p.sold30d > 0 ? p.sold30d : "—"}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Catalogs</div>
                <div className="font-display font-bold text-lg tracking-tight">By product count</div>
              </div>
              <Link to="/storefront/catalogs" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">
                Manage →
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {catalogs.map((c) => (
                <div key={c.id} className="flex items-center gap-3 px-2 py-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-[10px] text-[#4B5563]">{c.description || "—"}</div>
                  </div>
                  <span className="font-mono text-sm tabular text-[#1F2937]">{c.productCount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
            <div className="overline mb-2">Marketing</div>
            <p>
              Push campaigns are sent from{" "}
              <Link to="/storefront/promotions" className="text-[#0066FF] hover:underline">
                Promotions
              </Link>
              . Coupon management depends on your deployment exposing coupon routes.
            </p>
            <Link to="/storefront/checkout" className="inline-block mt-3 text-xs text-[#0066FF] font-medium">
              Open checkout preview →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
