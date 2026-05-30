import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Star, Package } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapCatalog, mapProduct, statusLabelExt } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { toast } from "sonner";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const [raw, catRaw] = await Promise.all([
        storefrontService.getProduct(id),
        storefrontService.listCatalogs({ limit: 100 }),
      ]);
      setP(mapProduct(raw));
      setCatalogs((catRaw || []).map(mapCatalog));
    } catch (err) {
      setLoadErr(err?.friendlyMessage || "Failed to load product.");
      setP(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadErr && !p) {
    return (
      <div className="p-8 text-[#374151]" data-testid="product-detail-error">
        {loadErr}
      </div>
    );
  }

  if (!loading && !p) {
    return (
      <div className="p-8 text-[#374151]" data-testid="product-detail-not-found">
        Product not found.
      </div>
    );
  }

  const cat = catalogs.find((c) => String(c.id) === String(p?.catalogId));
  const margin =
    p && p.price > 0 && p.cost > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : null;

  return (
    <div data-testid="product-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "Storefront", to: "/storefront" },
          { label: "Products", to: "/storefront/products" },
          { label: loading ? "…" : p?.name },
        ]}
        overline={loading ? "Product" : `Product · ${p?.sku}`}
        title={loading ? "Loading…" : p?.name}
        description={
          loading ? (
            "Loading…"
          ) : (
            <span className="flex items-center gap-2">
              <StatusBadge status={p.status} label={statusLabelExt(p.status)} />{" "}
              <span className="text-xs font-mono text-[#4B5563]">{p.publicId}</span>
            </span>
          )
        }
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />
      {p && (
        <div className="p-6 grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-4">
          <div>
            <div className="aspect-square bg-[#F1F2F5] border border-black/[0.08] rounded-md overflow-hidden grid place-items-center">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-12 w-12 text-[#4B5563]" />
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Price" value={formatMoney(p.price, p.currency)} />
              <Stat label="Cost" value={p.cost > 0 ? formatMoney(p.cost, p.currency) : "—"} />
              <Stat label="Margin" value={margin != null ? `${margin}%` : "—"} accent={margin != null ? "emerald" : "default"} />
              <Stat
                label="Stock"
                value={p.stock == null ? "—" : String(p.stock)}
                accent={p.stock != null && p.stock < 20 ? "amber" : "default"}
              />
            </div>

            <Tabs defaultValue="info">
              <TabsList className="bg-[#F1F2F5] border border-black/[0.08]">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="SKU" value={p.sku} mono />
                <Field label="Public ID" value={p.publicId} mono />
                <Field label="Catalog" value={cat?.name || p.catalogName || "—"} />
                <Field
                  label="Rating"
                  value={
                    p.rating > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-[#A16207]" /> {p.rating.toFixed(1)}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <Field label="Sold 30d" value={p.sold30d > 0 ? p.sold30d.toLocaleString() : "—"} />
                <Field label="Status" value={<StatusBadge status={p.status} label={statusLabelExt(p.status)} />} />
                {p.description && (
                  <div className="md:col-span-2">
                    <Field label="Description" value={p.description} />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="variants" className="mt-4">
                <div className="bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
                  Variants are managed in the storefront engine. None are attached to this product in the API response.
                </div>
              </TabsContent>
              <TabsContent value="performance" className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
                Sales analytics are not exposed on the product resource. Use orders and metrics endpoints for reporting.
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = "default" }) {
  const cls = accent === "emerald" ? "text-[#15803D]" : accent === "amber" ? "text-[#A16207]" : "text-[#0A0E1A]";
  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-4">
      <div className="overline">{label}</div>
      <div className={`font-display text-xl font-bold tabular mt-1 ${cls}`}>{value}</div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="overline">{label}</div>
      <div className={`text-sm text-[#0A0E1A] mt-1 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
