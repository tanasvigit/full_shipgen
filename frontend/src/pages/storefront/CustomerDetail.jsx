import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Phone, Calendar, Star } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapStoreCustomer, statusLabelExt } from "@/lib/mappers";
import { formatMoney } from "@/lib/formatMoney";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const raw = await storefrontService.getCustomer(id);
      setC(mapStoreCustomer(raw));
    } catch (err) {
      setLoadErr(err?.friendlyMessage || "Failed to load customer.");
      setC(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loadErr && !c) {
    return (
      <div className="p-8 text-[#374151]" data-testid="customer-detail-error">
        {loadErr}
      </div>
    );
  }

  if (!loading && !c) {
    return (
      <div className="p-8 text-[#374151]" data-testid="customer-detail-not-found">
        Customer not found.
      </div>
    );
  }

  return (
    <div data-testid="customer-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "Storefront", to: "/storefront" },
          { label: "Customers", to: "/storefront/customers" },
          { label: loading ? "…" : c?.name },
        ]}
        overline={loading ? "Customer" : `Customer · ${c?.publicId}`}
        title={loading ? "Loading…" : c?.name}
        description={
          loading ? (
            "Loading…"
          ) : (
            <span className="flex items-center gap-2">
              <StatusBadge status={c.status} label={statusLabelExt(c.status)} />{" "}
              <span className="text-xs font-mono text-[#4B5563]">{c.email}</span>
            </span>
          )
        }
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        }
      />
      {c && (
        <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Orders" value={c.orders} />
              <Stat label="Lifetime Value" value={c.ltv > 0 ? formatMoney(c.ltv) : "—"} accent="emerald" />
              <Stat label="AOV" value={c.orders > 0 && c.ltv > 0 ? formatMoney(c.ltv / c.orders) : "—"} />
              <Stat label="Last Order" value={c.lastOrder === "—" ? "—" : formatRelativeApiTime(c.lastOrder)} />
            </div>
            <Tabs defaultValue="orders">
              <TabsList className="bg-[#F1F2F5] border border-black/[0.08]">
                <TabsTrigger value="orders">Orders ({c.orders})</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
              </TabsList>
              <TabsContent value="orders" className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
                Order history is available from FleetOps storefront orders. This customer record does not embed order rows.
              </TabsContent>
              <TabsContent value="addresses" className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#374151]">
                No saved addresses on this customer resource.
              </TabsContent>
            </Tabs>
          </div>
          <aside className="space-y-4">
            <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-2">
              <div className="overline mb-2">Contact</div>
              <div className="flex items-center gap-2 text-sm text-[#1F2937]">
                <Mail className="h-3.5 w-3.5 text-[#4B5563]" /> {c.email || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1F2937]">
                <Phone className="h-3.5 w-3.5 text-[#4B5563]" /> {c.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-[#1F2937]">
                <Calendar className="h-3.5 w-3.5 text-[#4B5563]" /> Joined {formatRelativeApiTime(c.joined)}
              </div>
            </div>
            <div className="bg-white border border-black/[0.08] rounded-md p-4">
              <div className="overline mb-2">Tier</div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-amber-400 text-[#A16207]" />{" "}
                <span className="text-sm font-medium capitalize">{statusLabelExt(c.status)}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent = "default" }) {
  const cls = accent === "emerald" ? "text-[#15803D]" : "text-[#0A0E1A]";
  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-4">
      <div className="overline">{label}</div>
      <div className={`font-display text-xl font-bold tabular mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
