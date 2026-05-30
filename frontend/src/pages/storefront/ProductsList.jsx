import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3, LayoutList, Star, Package } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapCatalog, mapProduct, statusLabelExt } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";

export default function ProductsList() {
  const [view, setView] = useState("grid");
  const [catalog, setCatalog] = useState("all");
  const [products, setProducts] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRaw, catRaw] = await Promise.all([
        storefrontService.listProducts({ limit: 500 }),
        storefrontService.listCatalogs({ limit: 100 }),
      ]);
      setProducts((prodRaw || []).map(mapProduct));
      setCatalogs((catRaw || []).map(mapCatalog));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load products.");
      setProducts([]);
      setCatalogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = useMemo(() => {
    if (catalog === "all") return products;
    return products.filter(
      (p) => String(p.catalogId) === String(catalog) || String(p.catalogName) === catalogs.find((c) => String(c.id) === String(catalog))?.name,
    );
  }, [products, catalog, catalogs]);

  const columns = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          {r.image ? (
            <img src={r.image} alt="" className="h-10 w-10 object-cover rounded-sm border border-black/[0.08] bg-[#F1F2F5]" />
          ) : (
            <div className="h-10 w-10 bg-[#F1F2F5] border border-black/[0.08] rounded-sm grid place-items-center">
              <Package className="h-4 w-4 text-[#4B5563]" />
            </div>
          )}
          <div>
            <div className="font-medium text-[#0A0E1A]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#4B5563]">{r.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: "catalogName",
      header: "Catalog",
      render: (r) => (
        <span className="text-xs">{catalogs.find((c) => String(c.id) === String(r.catalogId))?.name || r.catalogName || "—"}</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (r) => <span className="font-mono tabular text-sm">{formatMoney(r.price, r.currency)}</span>,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      render: (r) => (
        <span className="font-mono tabular text-sm">{r.stock == null ? "—" : r.stock}</span>
      ),
    },
    {
      key: "sold30d",
      header: "Sold (30d)",
      sortable: true,
      render: (r) => <span className="font-mono tabular text-sm">{r.sold30d > 0 ? r.sold30d : "—"}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      render: (r) =>
        r.rating > 0 ? (
          <span className="inline-flex items-center gap-1 text-sm">
            <Star className="h-3 w-3 fill-amber-400 text-[#A16207]" />
            {r.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-[#4B5563] text-xs">—</span>
        ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={statusLabelExt(r.status)} /> },
  ];

  return (
    <div data-testid="products-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Products" }]}
        overline="Catalog"
        title="Products"
        description={loading ? "Loading…" : `${filtered.length} products across ${catalogs.length} catalogs`}
        actions={
          <>
            <div className="flex bg-white border border-black/[0.08] rounded-sm p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                data-testid="products-view-grid"
                className={`flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-sm ${view === "grid" ? "bg-[#EEF0F4] text-[#0A0E1A]" : "text-[#374151]"}`}
              >
                <Grid3x3 className="h-3.5 w-3.5" /> Grid
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                data-testid="products-view-table"
                className={`flex items-center gap-1.5 px-3 h-8 text-xs font-medium rounded-sm ${view === "table" ? "bg-[#EEF0F4] text-[#0A0E1A]" : "text-[#374151]"}`}
              >
                <LayoutList className="h-3.5 w-3.5" /> Table
              </button>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 rounded-sm" data-testid="products-new-button">
              <Link to="/storefront/products/new">
                <Plus className="h-4 w-4 mr-1" /> New product
              </Link>
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setCatalog("all")}
            className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border ${catalog === "all" ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"}`}
          >
            All
          </button>
          {catalogs.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCatalog(c.id)}
              data-testid={`catalog-filter-${c.id}`}
              className={`px-2.5 h-7 text-[11px] font-mono uppercase tracking-wider rounded-sm border flex items-center gap-1.5 ${catalog === c.id ? "bg-blue-600/10 border-blue-500/40 text-[#0066FF]" : "bg-white border-black/[0.08] text-[#374151] hover:bg-[#F1F2F5]"}`}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} /> {c.name}
            </button>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-sm text-[#4B5563]" data-testid="products-empty">
            No products returned for this organization.
          </div>
        )}

        {view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                to={`/storefront/products/${p.id}`}
                className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md overflow-hidden transition-colors group"
                data-testid={`product-card-${p.id}`}
              >
                <div className="aspect-square bg-[#F1F2F5] relative overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Package className="h-8 w-8 text-[#4B5563]" />
                    </div>
                  )}
                  {p.status !== "active" && (
                    <div className="absolute top-2 left-2">
                      <StatusBadge status={p.status} label={statusLabelExt(p.status)} />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium line-clamp-2 leading-tight">{p.name}</div>
                  <div className="text-[10px] font-mono text-[#4B5563] mt-1">{p.sku}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-display text-lg font-bold tabular">{formatMoney(p.price, p.currency)}</span>
                    <span className="text-[10px] font-mono text-[#4B5563]">
                      {p.stock == null ? "Stock N/A" : `${p.stock} in stock`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <DataTable
            testid="products-table"
            columns={columns}
            data={filtered}
            searchKeys={["name", "sku", "publicId"]}
            pageSize={10}
            onRowClick={(r) => navigate(`/storefront/products/${r.id}`)}
          />
        )}
      </div>
    </div>
  );
}
