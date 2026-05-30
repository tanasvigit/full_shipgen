import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Tag } from "lucide-react";
import { storefrontService } from "@/services/storefront";
import { mapCoupon, statusLabelExt } from "@/lib/mappers";
import { safeCopyToClipboard } from "@/lib/clipboard";
import { toast } from "sonner";

export default function CouponsList() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await storefrontService.listCoupons({ limit: 200 });
      setCoupons((raw || []).map(mapCoupon));
      setApiAvailable(true);
    } catch (err) {
      setCoupons([]);
      setApiAvailable(false);
      if (err?.response?.status !== 404) {
        toast.error(err?.friendlyMessage || "Failed to load coupons.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const columns = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-[#0066FF]">{r.code}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              safeCopyToClipboard(r.code, `Copied "${r.code}"`);
            }}
            className="text-[#4B5563] hover:text-[#0A0E1A]"
            data-testid={`coupon-copy-${r.id}`}
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ),
    },
    { key: "description", header: "Description", render: (r) => <span className="text-sm">{r.description || "—"}</span> },
    { key: "discount", header: "Discount", render: (r) => <span className="font-mono text-sm tabular">{r.discount}</span> },
    {
      key: "usage",
      header: "Usage",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono tabular text-sm">{r.usage.toLocaleString()}</span>
          {r.limit != null && <span className="text-[#4B5563] text-xs font-mono">/ {Number(r.limit).toLocaleString()}</span>}
        </div>
      ),
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} label={statusLabelExt(r.status)} /> },
    { key: "expires", header: "Expires", render: (r) => <span className="font-mono text-xs text-[#374151]">{r.expires}</span> },
  ];

  async function handleCreate(v) {
    if (!apiAvailable) {
      throw new Error("Coupon API is not available on this deployment.");
    }
    try {
      const isPct = v.kind === "percent";
      const created = await storefrontService.createCoupon({
        code: String(v.code || "").toUpperCase(),
        description: v.description || undefined,
        discount_type: isPct ? "percentage" : "fixed",
        discount_value: Number(v.value),
        usage_limit: v.limit ? Number(v.limit) : undefined,
        expires_at: v.expires || undefined,
      });
      const mapped = mapCoupon(created);
      setCoupons((p) => [mapped, ...p]);
      return { toast: `Coupon ${mapped.code} created` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to create coupon.");
    }
  }

  return (
    <div data-testid="coupons-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Storefront", to: "/storefront" }, { label: "Coupons" }]}
        overline="Marketing"
        title="Coupons"
        description={
          loading
            ? "Loading…"
            : apiAvailable
              ? `${coupons.length} discount codes`
              : "Coupon endpoints are not registered in the storefront module"
        }
        actions={
          <Button
            onClick={() => setOpen(true)}
            disabled={!apiAvailable}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="coupons-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New coupon
          </Button>
        }
      />
      <div className="p-6">
        {!loading && !apiAvailable && (
          <div className="mb-4 text-sm text-[#4B5563] bg-amber-500/5 border border-amber-500/20 rounded-md p-4" data-testid="coupons-unavailable">
            This Fleetbase build does not expose <code className="font-mono text-xs">/coupons</code> on the storefront internal API.
            Checkout may still accept <code className="font-mono text-xs">discount_code</code> on carts when configured server-side.
          </div>
        )}
        {!loading && apiAvailable && coupons.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="coupons-empty">
            No coupons returned.
          </div>
        )}
        <DataTable testid="coupons-table" columns={columns} data={coupons} searchKeys={["code", "description"]} pageSize={10} />
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New coupon"
        description="Create a discount code for checkout (when supported by your API)."
        icon={Tag}
        submitLabel="Create coupon"
        testid="new-coupon-dialog"
        fields={[
          { key: "code", label: "Code", placeholder: "WELCOME20", required: true },
          { key: "description", label: "Description", placeholder: "20% off first order" },
          {
            key: "kind",
            label: "Type",
            type: "select",
            col: "half",
            options: [
              { value: "percent", label: "Percent off" },
              { value: "fixed", label: "Fixed amount" },
            ],
          },
          { key: "value", label: "Value", type: "number", min: 1, max: 9999, defaultValue: "20", required: true, col: "half" },
          { key: "limit", label: "Usage limit", type: "number", min: 0, placeholder: "1000", col: "half" },
          { key: "expires", label: "Expires", placeholder: "2026-12-31", col: "half" },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
