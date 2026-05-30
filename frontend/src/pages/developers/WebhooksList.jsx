import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import DataTable from "@/components/common/DataTable";
import StatusBadge from "@/components/common/StatusBadge";
import QuickCreateDialog from "@/components/common/QuickCreateDialog";
import { Button } from "@/components/ui/button";
import { Plus, Webhook } from "lucide-react";
import { developersService } from "@/services/developers";
import { mapWebhook } from "@/lib/mappers";
import { toast } from "sonner";

const ALL_EVENTS =
  "order.created,order.delivered,order.canceled,driver.online,vehicle.maintenance,invoice.paid,customer.created";

export default function WebhooksList() {
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await developersService.listWebhooks();
      setWebhooks(raw.map(mapWebhook));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load webhooks.");
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const columns = [
    {
      key: "url",
      header: "Endpoint",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5 max-w-[500px]">
          <div
            className={`h-8 w-8 grid place-items-center rounded-md border ${
              r.status === "active"
                ? "bg-[#16A34A]/10 border-[#16A34A]/30"
                : r.status === "failing"
                  ? "bg-[#DC2626]/10 border-[#DC2626]/30"
                  : "bg-[#F1F2F5] border-black/[0.08]"
            }`}
          >
            <Webhook
              className={`h-3.5 w-3.5 ${
                r.status === "active"
                  ? "text-[#15803D]"
                  : r.status === "failing"
                    ? "text-[#B91C1C]"
                    : "text-[#4B5563]"
              }`}
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-xs text-[#0A0E1A] truncate">{r.url}</div>
            <div className="text-[10px] text-[#4B5563] truncate">{r.description}</div>
          </div>
        </div>
      ),
    },
    {
      key: "events",
      header: "Events",
      render: (r) => {
        const list = r.eventsList?.length ? r.eventsList : String(r.events || "").split(",").map((s) => s.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1 max-w-[260px]">
            {list.slice(0, 3).map((e) => (
              <span key={e} className="text-[10px] font-mono px-1.5 py-0.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
                {e}
              </span>
            ))}
            {list.length > 3 && (
              <span className="text-[10px] font-mono text-[#4B5563]">+{list.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      key: "deliveries24h",
      header: "Deliveries (24h)",
      sortable: true,
      render: (r) => (
        <span className="font-mono text-sm tabular">{r.deliveries24h.toLocaleString()}</span>
      ),
    },
    {
      key: "successRate",
      header: "Success",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[#F1F2F5] border border-black/[0.08] rounded-sm overflow-hidden">
            <div
              className={`h-full ${r.successRate >= 99 ? "bg-[#16A34A]" : r.successRate >= 95 ? "bg-[#EAB308]" : "bg-[#DC2626]"}`}
              style={{ width: `${Math.min(100, r.successRate)}%` }}
            />
          </div>
          <span
            className={`font-mono text-xs tabular ${
              r.successRate >= 99 ? "text-[#15803D]" : r.successRate >= 95 ? "text-[#A16207]" : "text-[#B91C1C]"
            }`}
          >
            {r.successRate}%
          </span>
        </div>
      ),
    },
    {
      key: "avgLatency",
      header: "p50 Latency",
      render: (r) => <span className="font-mono text-xs tabular">{r.avgLatency}ms</span>,
    },
    { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  async function handleCreate(v) {
    const events = (v.events || ALL_EVENTS)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const created = await developersService.createWebhook({
        url: String(v.url || "").trim(),
        description: v.description?.trim() || undefined,
        events: events.length ? events : undefined,
      });
      const mapped = mapWebhook(created);
      setWebhooks((p) => [mapped, ...p]);
      return { toast: `Endpoint registered (${events.length} events)` };
    } catch (err) {
      throw new Error(err?.friendlyMessage || "Failed to create webhook.");
    }
  }

  return (
    <div data-testid="webhooks-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Developers", to: "/developers" }, { label: "Webhooks" }]}
        overline="Integrations"
        title="Webhooks"
        description={loading ? "Loading…" : `${webhooks.length} endpoints configured`}
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#0066FF] hover:bg-[#0040CC] text-white h-10 rounded-lg shadow-[0_10px_28px_-8px_rgba(0,102,255,0.45)]"
            data-testid="webhooks-new-button"
          >
            <Plus className="h-4 w-4 mr-1.5" /> New endpoint
          </Button>
        }
      />
      <div className="p-6">
        {!loading && webhooks.length === 0 && (
          <div className="mb-4 text-sm text-[#4B5563]" data-testid="webhooks-empty">
            No webhook endpoints for this organization.
          </div>
        )}
        <DataTable
          testid="webhooks-table"
          columns={columns}
          data={webhooks}
          searchKeys={["url", "description"]}
          pageSize={10}
          onRowClick={(r) => navigate(`/developers/webhooks/${r.id}`)}
        />
      </div>
      <QuickCreateDialog
        open={open}
        onOpenChange={setOpen}
        title="New webhook endpoint"
        description="Subscribe an HTTPS endpoint to platform events."
        icon={Webhook}
        submitLabel="Register endpoint"
        testid="new-webhook-dialog"
        fields={[
          {
            key: "url",
            label: "URL",
            placeholder: "https://api.example.com/hooks/fleetbase",
            required: true,
          },
          { key: "description", label: "Description", placeholder: "Production delivery hook" },
          { key: "events", label: "Events (comma-separated)", placeholder: ALL_EVENTS, type: "textarea", rows: 3 },
        ]}
        onSubmit={handleCreate}
      />
    </div>
  );
}
