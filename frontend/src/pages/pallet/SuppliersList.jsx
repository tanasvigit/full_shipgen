import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Factory, Mail, Phone, Star, Clock } from "lucide-react";
import { palletService } from "@/services/pallet";
import { mapPalletSupplier, mapPurchaseOrderRow } from "@/lib/mappers";
import { toast } from "sonner";

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [supRaw, poRaw] = await Promise.all([
        palletService.listSuppliers({ limit: 200 }),
        palletService.listPurchaseOrders({ limit: 500 }),
      ]);
      const pos = (poRaw || []).map(mapPurchaseOrderRow);
      const openBySupplier = {};
      for (const po of pos) {
        if (!po.supplierId) continue;
        if (["draft", "approved", "in_transit", "pending"].includes(po.status)) {
          openBySupplier[po.supplierId] = (openBySupplier[po.supplierId] || 0) + 1;
        }
      }
      setSuppliers((supRaw || []).map((s) => mapPalletSupplier(s, openBySupplier[s.uuid || s.id] || 0)));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load suppliers.");
      setSuppliers([]);
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
      await palletService.createSupplier({
        supplier: {
          name: v.name.trim(),
          email: v.email.trim(),
          phone: v.phone || undefined,
          type: v.category || "General",
          meta: {
            lead_time: v.leadTime || undefined,
            payment_terms: v.terms || undefined,
          },
        },
      });
      await load();
      return { toast: `Supplier "${v.name}" added` };
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to create supplier.");
      return { error: true };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="suppliers-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Pallet", to: "/pallet" }, { label: "Suppliers" }]}
        overline="Procurement"
        title="Suppliers"
        description={loading ? "Loading…" : `${suppliers.length} suppliers`}
        actions={
          <Button onClick={() => setOpen(true)} className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]" data-testid="suppliers-new-button">
            <Plus className="h-4 w-4 mr-1.5" /> Add supplier
          </Button>
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-sm text-[#4B5563] py-12 text-center">Loading suppliers…</div>
        ) : suppliers.length === 0 ? (
          <div className="col-span-full text-sm text-[#4B5563] py-12 text-center">No suppliers found.</div>
        ) : (
          suppliers.map((s) => (
            <div key={s.id} className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors" data-testid={`supplier-card-${s.id}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-[#0066FF]/10 border border-[#0066FF]/25 grid place-items-center rounded-md">
                  <Factory className="h-5 w-5 text-[#0066FF]" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="overline">{s.category}</div>
                  <div className="font-display font-bold tracking-tight truncate text-[#0A0E1A]">{s.name}</div>
                </div>
              </div>
              <div className="space-y-1 text-sm text-[#374151]">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /><span className="text-xs truncate">{s.contact}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /><span className="text-xs font-mono">{s.phone}</span></div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span className="text-xs">{s.leadTime} · {s.terms}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-black/[0.08]">
                <Metric label="On-time" value={s.onTime != null ? `${s.onTime}%` : "—"} accent={s.onTime >= 97 ? "emerald" : s.onTime >= 93 ? "amber" : "default"} />
                <Metric
                  label="Quality"
                  value={
                    s.qualityScore != null ? (
                      <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-[#A16207]" />{s.qualityScore}</span>
                    ) : (
                      "—"
                    )
                  }
                />
                <Metric label="Open POs" value={s.openPOs} />
              </div>
            </div>
          ))
        )}
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Add supplier"
        description="Onboard a new supplier for procurement."
        icon={Factory}
        submitLabel={submitting ? "Creating…" : "Add supplier"}
        testid="add-supplier-dialog"
        fields={[
          { key: "name", label: "Supplier name", placeholder: "Pacific Packaging Co.", required: true },
          { key: "email", label: "Email", type: "email", required: true, col: "half" },
          { key: "phone", label: "Phone", placeholder: "+1 555 0100", col: "half" },
          { key: "category", label: "Category", placeholder: "Packaging", col: "half" },
          { key: "leadTime", label: "Lead time", placeholder: "5 days", col: "half" },
          { key: "terms", label: "Terms", placeholder: "Net 30" },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function Metric({ label, value, accent = "default" }) {
  const cls = accent === "emerald" ? "text-[#15803D]" : accent === "amber" ? "text-[#A16207]" : accent === "red" ? "text-[#B91C1C]" : "text-[#0A0E1A]";
  return (
    <div>
      <div className="overline">{label}</div>
      <div className={`font-display text-base font-bold mt-0.5 ${cls}`}>{value}</div>
    </div>
  );
}
