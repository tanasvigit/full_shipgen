import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Package } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapCatalog, mapProduct } from "@/lib/mappers";
import { toast } from "sonner";

export default function CatalogsList() {
  const [catalogs, setCatalogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [catRaw, prodRaw] = await Promise.all([
        storefrontService.listCatalogs({ limit: 100 }),
        storefrontService.listProducts({ limit: 500 }),
      ]);
      setCatalogs((catRaw || []).map(mapCatalog));
      setProducts((prodRaw || []).map(mapProduct));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load catalogs.");
      setCatalogs([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleCreate(v) {
    try {
      const created = await storefrontService.createCatalog({
        name: v.name,
        description: v.description || undefined,
      });
      const mapped = mapCatalog(created, catalogs.length);
      setCatalogs((p) => [mapped, ...p]);
      return { toast: `Catalog "${v.name}" created` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to create catalog.");
    }
  }

  return (
    <div data-testid="catalogs-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Catalogs" }]}
        overline="Catalog"
        title="Catalogs"
        description={loading ? "Loading…" : `${catalogs.length} catalogs · ${products.length} products`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="catalogs-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New catalog
          </Button>
        }
      />
      <div className="p-6">
        {!loading && catalogs.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="catalogs-empty">
            No catalogs returned for this organization.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {catalogs.map((c) => {
            const sampleProducts = products.filter((p) => String(p.catalogId) === String(c.id)).slice(0, 4);
            return (
              <div
                key={c.id}
                className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors"
                data-testid={`catalog-card-${c.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-1.5 rounded-sm" style={{ background: c.color }} />
                    <div>
                      <div className="overline">{c.productCount || sampleProducts.length} products</div>
                      <div className="font-display font-bold text-lg tracking-tight">{c.name}</div>
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 text-[#4B5563]" />
                </div>
                <p className="text-sm text-[#374151]">{c.description || "—"}</p>
                <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-black/[0.08]">
                  {sampleProducts.map((p) => (
                    <div key={p.id} className="aspect-square bg-[#F1F2F5] border border-black/[0.08] rounded-sm overflow-hidden">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center">
                          <Package className="h-4 w-4 text-[#4B5563]" />
                        </div>
                      )}
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - sampleProducts.length) }).map((_, i) => (
                    <div key={i} className="aspect-square bg-[#F1F2F5]/40 border border-dashed border-black/[0.08] rounded-sm" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New catalog"
        description="Group products into a curated catalog."
        icon={BookOpen}
        submitLabel="Create catalog"
        testid="new-catalog-dialog"
        fields={[
          { key: "name", label: "Catalog name", placeholder: "Holiday 2026", required: true },
          { key: "description", label: "Description", type: "textarea", placeholder: "Limited-time holiday selection" },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
