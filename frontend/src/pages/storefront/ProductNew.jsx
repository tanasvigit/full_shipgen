import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapCatalog } from "@/lib/mappers";
import { toast } from "sonner";

export default function ProductNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [catalogs, setCatalogs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    price: "",
    status: "available",
    category_uuid: "",
    is_available: true,
  });

  useEffect(() => {
    let alive = true;
    storefrontService
      .listCatalogs({ limit: 100 })
      .then((raw) => {
        if (alive) setCatalogs((raw || []).map(mapCatalog));
      })
      .catch(() => {
        if (alive) setCatalogs([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    setLoading(true);
    try {
      const created = await storefrontService.createProduct({
        name: form.name.trim(),
        sku: form.sku.trim() || undefined,
        description: form.description.trim() || undefined,
        price: form.price !== "" ? Number(form.price) : undefined,
        status: form.status,
        category_uuid: form.category_uuid || undefined,
        is_available: form.is_available,
      });
      const id = created?.uuid || created?.public_id || created?.id;
      toast.success("Product created");
      navigate(id ? `/storefront/products/${id}` : "/storefront/products");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div data-testid="product-new-page">
      <PageHeader
        breadcrumbs={[
          { label: "Storefront", to: "/storefront" },
          { label: "Products", to: "/storefront/products" },
          { label: "New" },
        ]}
        overline="Create"
        title="New Product"
        description="Add a product to your catalog with pricing and availability from the storefront API."
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />
      <form onSubmit={submit} className="p-6 max-w-4xl space-y-4" data-testid="product-new-form">
        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Details</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Product name">
              <Input
                required
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="bg-[#F1F2F5] border-black/[0.08]"
                data-testid="new-product-name"
              />
            </Field>
            <Field label="SKU">
              <Input
                value={form.sku}
                onChange={(e) => setField("sku", e.target.value)}
                className="bg-[#F1F2F5] border-black/[0.08] font-mono"
              />
            </Field>
            <Field label="Category / catalog">
              <Select
                value={form.category_uuid || "__none__"}
                onValueChange={(v) => setField("category_uuid", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="bg-[#F1F2F5] border-black/[0.08]">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent className="bg-white border-black/[0.08]">
                  <SelectItem value="__none__">None</SelectItem>
                  {catalogs.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                <SelectTrigger className="bg-[#F1F2F5] border-black/[0.08]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-black/[0.08]">
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe the product…"
              className="bg-[#F1F2F5] border-black/[0.08] min-h-[100px]"
            />
          </Field>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
          <div className="overline">Pricing & availability</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Price">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                className="bg-[#F1F2F5] border-black/[0.08] font-mono tabular"
              />
            </Field>
            <Field label="Available for sale">
              <Select
                value={form.is_available ? "yes" : "no"}
                onValueChange={(v) => setField("is_available", v === "yes")}
              >
                <SelectTrigger className="bg-[#F1F2F5] border-black/[0.08]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-black/[0.08]">
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No (unavailable)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <p className="text-xs text-[#4B5563]">
            Stock quantity is not set on create unless your deployment stores it in product meta via the API.
          </p>
        </div>

        <div className="bg-white border border-black/[0.08] rounded-md p-5">
          <div className="overline mb-3">Media</div>
          <div className="border-2 border-dashed border-black/[0.08] rounded-md py-8 px-4 text-center text-sm text-[#4B5563]">
            <Upload className="h-6 w-6 mx-auto text-[#4B5563] mb-2" />
            Upload images via the storefront product editor or files API after creation.
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5]">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700" data-testid="new-product-submit">
            <Plus className="h-4 w-4 mr-1" /> {loading ? "Creating…" : "Create product"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">{label}</Label>
      {children}
    </div>
  );
}
