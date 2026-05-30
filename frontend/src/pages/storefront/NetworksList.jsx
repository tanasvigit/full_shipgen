import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Network as NetworkIcon, Users, Store, ShoppingBag } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapNetwork, statusLabelExt } from "@/lib/mappers";
import { toast } from "sonner";

export default function NetworksList() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await storefrontService.listNetworks({ limit: 100 });
      setNetworks((raw || []).map(mapNetwork));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load networks.");
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function handleCreate(v) {
    try {
      const created = await storefrontService.createNetwork({
        name: v.name,
        description: v.description || undefined,
      });
      const mapped = mapNetwork(created, networks.length);
      setNetworks((p) => [mapped, ...p]);
      return { toast: `Network "${v.name}" created` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to create network.");
    }
  }

  return (
    <div data-testid="networks-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Networks" }]}
        overline="Audience"
        title="Networks"
        description={loading ? "Loading…" : `${networks.length} multi-store networks`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="networks-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create network
          </Button>
        }
      />
      <div className="p-6">
        {!loading && networks.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="networks-empty">
            No networks returned for this organization.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {networks.map((n) => (
            <div
              key={n.id}
              className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors"
              data-testid={`network-card-${n.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 grid place-items-center rounded-sm" style={{ background: `${n.color}22`, border: `1px solid ${n.color}55` }}>
                    <NetworkIcon className="h-5 w-5" style={{ color: n.color }} />
                  </div>
                  <div>
                    <div className="overline">{n.publicId}</div>
                    <div className="font-display font-bold text-lg tracking-tight">{n.name}</div>
                  </div>
                </div>
                <StatusBadge status={n.status} label={statusLabelExt(n.status)} />
              </div>
              <p className="text-sm text-[#374151]">{n.description || "No description"}</p>
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-black/[0.08]">
                <Metric icon={Store} label="Stores" value={n.stores} />
                <Metric icon={Users} label="Customers" value={n.customers.toLocaleString()} />
                <Metric icon={ShoppingBag} label="Orders/mo" value={n.ordersMonth > 0 ? n.ordersMonth.toLocaleString() : "—"} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="Create network"
        description="A network groups multiple stores under a single brand or region."
        icon={NetworkIcon}
        submitLabel="Create network"
        testid="create-network-dialog"
        fields={[
          { key: "name", label: "Network name", placeholder: "East Coast Network", required: true },
          { key: "region", label: "Region", placeholder: "East Coast" },
          { key: "description", label: "Description", type: "textarea", placeholder: "Stores along the eastern seaboard." },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="overline flex items-center gap-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-mono text-sm tabular mt-1 text-[#0A0E1A]">{value}</div>
    </div>
  );
}
