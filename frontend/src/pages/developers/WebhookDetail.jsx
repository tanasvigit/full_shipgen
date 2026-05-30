import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import StatusBadge from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Pause, Play, Webhook, ExternalLink } from "lucide-react";
import { developersService } from "@/services/developers";
import { mapWebhook, mapWebhookRequestLog } from "@/lib/mappers";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { maskSecret } from "@/lib/maskSecret";
import { toast } from "sonner";

function statusColor(s) {
  if (s >= 500) return "bg-red-500/10 border-red-500/20 text-[#B91C1C]";
  if (s >= 400) return "bg-amber-500/10 border-amber-500/20 text-[#A16207]";
  return "bg-emerald-500/10 border-emerald-500/20 text-[#15803D]";
}

export default function WebhookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [w, setW] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const raw = await developersService.getWebhook(id);
      setW(mapWebhook(raw));
      let logs = [];
      const paramAttempts = [
        { webhook_endpoint_uuid: id },
        { webhook_endpoint: id },
        { webhook_uuid: id },
      ];
      for (const params of paramAttempts) {
        try {
          const batch = await developersService.listWebhookRequestLogs({ ...params, limit: 200 });
          if (Array.isArray(batch) && batch.length) {
            logs = batch;
            break;
          }
        } catch {
          /* try next */
        }
      }
      if (!logs.length) {
        const wide = await developersService.listWebhookRequestLogs({ limit: 200 });
        logs = (wide || []).filter(
          (row) =>
            String(row?.webhook_endpoint_uuid) === String(id) ||
            String(row?.webhook_endpoint_id) === String(id),
        );
      }
      setDeliveries(logs.map(mapWebhookRequestLog));
    } catch (err) {
      setLoadErr(err?.friendlyMessage || "Failed to load webhook.");
      setW(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const paused = w && (w.status === "disabled" || w.status === "paused");

  async function togglePause() {
    if (!w?.id) return;
    try {
      if (paused) {
        await developersService.enableWebhook(w.id);
        toast.success("Webhook enabled");
      } else {
        await developersService.disableWebhook(w.id);
        toast.success("Webhook disabled");
      }
      await load();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Could not update webhook status.");
    }
  }

  const titleSlug = useMemo(() => {
    const u = w?.url || "";
    return u.replace(/^https?:\/\//, "") || "Webhook";
  }, [w]);

  if (loadErr && !w) {
    return (
      <div className="p-8 text-[#374151]" data-testid="webhook-detail-error">
        {loadErr}
      </div>
    );
  }

  if (!loading && !w) {
    return (
      <div className="p-8 text-[#374151]" data-testid="webhook-detail-not-found">
        Webhook not found.
      </div>
    );
  }

  const eventsList = w?.eventsList?.length
    ? w.eventsList
    : String(w?.events || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const secretDisplay = w?.signingSecretPreview
    ? maskSecret(String(w.signingSecretPreview), { head: 6, tail: 4 })
    : "••••••••";

  return (
    <div data-testid="webhook-detail-page">
      <PageHeader
        breadcrumbs={[
          { label: "Developers", to: "/developers" },
          { label: "Webhooks", to: "/developers/webhooks" },
          { label: titleSlug },
        ]}
        overline="Webhook"
        title={loading ? "…" : titleSlug}
        description={
          loading ? (
            "Loading…"
          ) : (
            <span className="flex items-center gap-2">
              <StatusBadge status={paused ? "paused" : w.status} />{" "}
              <span className="text-xs text-[#4B5563]">{w.description}</span>
            </span>
          )
        }
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              onClick={togglePause}
              variant="outline"
              disabled={loading || !w}
              className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]"
              data-testid="webhook-toggle-pause"
            >
              {paused ? (
                <>
                  <Play className="h-4 w-4 mr-1" /> Enable
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Disable
                </>
              )}
            </Button>
          </>
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="space-y-4">
          <Tabs defaultValue="deliveries">
            <TabsList className="bg-[#F1F2F5] border border-black/[0.08]">
              <TabsTrigger value="deliveries" data-testid="tab-deliveries">
                Deliveries ({deliveries.length})
              </TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="payload">Payload</TabsTrigger>
            </TabsList>
            <TabsContent value="deliveries" className="mt-4 bg-white border border-black/[0.08] rounded-md overflow-hidden">
              {deliveries.length === 0 ? (
                <div className="p-6 text-sm text-[#4B5563]" data-testid="webhook-deliveries-empty">
                  No webhook delivery attempts found for this endpoint (or history is not available).
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {["Event", "Subject", "Status", "Attempt", "Latency", "When", ""].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-[#4B5563] border-b border-black/[0.08]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((d) => (
                      <tr key={d.id} className="border-b border-black/[0.08]/60 hover:bg-[#F1F2F5]/50">
                        <td className="px-4 py-3 font-mono text-xs text-[#0066FF]">{d.event}</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#1F2937]">{d.payload}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border ${statusColor(d.status)}`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{(d.attempt || 1)}/3</td>
                        <td className="px-4 py-3 font-mono text-xs tabular">{d.latency}ms</td>
                        <td className="px-4 py-3 font-mono text-xs text-[#374151]">
                          {formatRelativeApiTime(d.time)}
                        </td>
                        <td className="px-4 py-3 text-right" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TabsContent>
            <TabsContent value="events" className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 space-y-2">
              <div className="overline mb-2">Subscribed events</div>
              {eventsList.length === 0 ? (
                <p className="text-sm text-[#4B5563]">No explicit event filter on this endpoint.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {eventsList.map((e) => (
                    <span key={e} className="text-xs font-mono px-2 py-1 bg-[#F1F2F5] border border-black/[0.08] rounded-sm">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="payload" className="mt-4 bg-white border border-black/[0.08] rounded-md p-5 text-sm text-[#4B5563]">
              Payload samples are not returned on the webhook resource. Use{" "}
              <a href="/developers/events" className="text-[#0066FF] hover:underline">
                Event types
              </a>{" "}
              for reference shapes, or inspect delivery attempts on the Deliveries tab when the API exposes payloads.
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-4">
          <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-3">
            <div className="overline">Performance · 24h</div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Deliveries" value={w?.deliveries24h != null ? w.deliveries24h.toLocaleString() : "—"} />
              <Metric
                label="Success"
                value={w?.successRate != null ? `${w.successRate}%` : "—"}
                accent={
                  w?.successRate != null
                    ? w.successRate >= 99
                      ? "emerald"
                      : w.successRate >= 95
                        ? "amber"
                        : "red"
                    : "default"
                }
              />
              <Metric label="Avg latency" value={w?.avgLatency != null ? `${w.avgLatency}ms` : "—"} />
              <Metric label="Last delivery" value={formatRelativeApiTime(w?.lastDelivery)} mono />
            </div>
          </div>
          <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-2">
            <div className="overline">Endpoint</div>
            <div className="font-mono text-xs text-[#1F2937] break-all">{w?.url}</div>
            {w?.url && (
              <a href={w.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#0066FF] hover:text-[#0066FF]">
                Open <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-2">
            <div className="overline flex items-center gap-1">
              <Webhook className="h-3 w-3" /> Signing secret
            </div>
            <code className="font-mono text-[11px] text-[#1F2937] bg-[#F1F2F5] border border-black/[0.08] px-2 py-1 rounded-sm block truncate">
              {secretDisplay}
            </code>
            <p className="text-[11px] text-[#4B5563]">
              Only a masked preview is shown here. The full secret may appear once when the endpoint is created, depending on
              server settings.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, accent = "default", mono }) {
  const cls =
    accent === "emerald"
      ? "text-[#15803D]"
      : accent === "amber"
        ? "text-[#A16207]"
        : accent === "red"
          ? "text-[#B91C1C]"
          : "text-[#0A0E1A]";
  return (
    <div>
      <div className="overline">{label}</div>
      <div className={`font-display text-lg font-bold tabular mt-1 ${cls} ${mono ? "font-mono text-sm" : ""}`}>{value}</div>
    </div>
  );
}
