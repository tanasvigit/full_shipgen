import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import KpiCard from "@/components/common/KpiCard";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Activity, Webhook, Plus } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { isValid, parseISO } from "date-fns";
import { developersService } from "@/services/developers";
import { mapApiLog, mapWebhook, mapDeveloperEventType } from "@/lib/mappers";
import { formatRelativeApiTime } from "@/lib/formatRelativeApiTime";
import { toast } from "sonner";

function statusColor(s) {
  if (s >= 500) return "text-[#B91C1C]";
  if (s >= 400) return "text-[#A16207]";
  if (s >= 200) return "text-[#15803D]";
  return "text-[#374151]";
}

function hourlyBucketsFromLogs(mappedRows) {
  const series = [];
  for (let i = 0; i < 24; i++) {
    series.push({ t: `${String(i).padStart(2, "0")}:00`, v: 0 });
  }
  for (const l of mappedRows) {
    const at = l.at;
    if (!at) continue;
    const d = typeof at === "string" ? parseISO(at) : new Date(at);
    if (!isValid(d)) continue;
    const h = d.getHours();
    series[h].v += 1;
  }
  return series;
}

function p95Ms(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export default function DevelopersHome() {
  const [keysCount, setKeysCount] = useState(0);
  const [activeKeys, setActiveKeys] = useState(0);
  const [whCount, setWhCount] = useState(0);
  const [logs, setLogs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [creds, whRaw, logRaw, evRaw] = await Promise.all([
        developersService.listApiCredentials(),
        developersService.listWebhooks(),
        developersService.listApiRequestLogs({ limit: 500 }),
        developersService.listWebhookEvents().catch(() => []),
      ]);

      const mappedKeys = creds || [];
      setKeysCount(mappedKeys.length);
      setActiveKeys(mappedKeys.filter((k) => !k?.revoked_at && (k?.status == null || k.status === "active")).length);

      const wh = (whRaw || []).map(mapWebhook);
      setWebhooks(wh);
      setWhCount(wh.length);

      const mappedLogs = (logRaw || []).map(mapApiLog);
      setLogs(mappedLogs);

      let events = (evRaw || []).map(mapDeveloperEventType);
      if (!events.length) {
        try {
          const alt = await developersService.listApiEvents({ limit: 200 });
          events = (alt || []).map(mapDeveloperEventType);
        } catch {
          events = [];
        }
      }
      setTopEvents([...events].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load developer overview.");
      setKeysCount(0);
      setActiveKeys(0);
      setWhCount(0);
      setLogs([]);
      setWebhooks([]);
      setTopEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const trafficSeries = useMemo(() => hourlyBucketsFromLogs(logs), [logs]);

  const errorRatePct = useMemo(() => {
    if (!logs.length) return null;
    const bad = logs.filter((l) => l.status >= 400).length;
    return (bad / logs.length) * 100;
  }, [logs]);

  const p95 = useMemo(() => p95Ms(logs.map((l) => l.latency).filter((n) => n > 0)), [logs]);

  const recentRows = useMemo(() => logs.slice(0, 6), [logs]);

  return (
    <div data-testid="developers-home">
      <PageHeader
        breadcrumbs={[{ label: "Developers" }, { label: "Overview" }]}
        overline="Developer Platform"
        title="API Overview"
        description={
          loading
            ? "Loading…"
            : "Monitor API health, webhooks, and integrations from data returned by your environment."
        }
        actions={
          <>
            <Button variant="outline" asChild className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]">
              <Link to="/developers/logs">
                Open logs <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
            <Button asChild className="bg-blue-600 hover:bg-blue-700" data-testid="developers-new-key">
              <Link to="/developers/api-keys">
                <Plus className="h-4 w-4 mr-1" /> New API key
              </Link>
            </Button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Requests (sample)"
            value={loading ? "—" : logs.length.toLocaleString()}
            accent="blue"
            testid="kpi-api-requests-sample"
          />
          <KpiCard
            label="p95 latency"
            value={loading || p95 == null ? "—" : `${Math.round(p95)} ms`}
            accent="emerald"
            testid="kpi-p95"
          />
          <KpiCard
            label="Error rate"
            value={loading || errorRatePct == null ? "—" : `${errorRatePct.toFixed(2)}%`}
            accent="red"
            testid="kpi-error-rate"
          />
          <KpiCard
            label="Webhooks"
            value={loading ? "—" : String(whCount)}
            accent="emerald"
            testid="kpi-webhooks"
          />
          <KpiCard
            label="Active API keys"
            value={loading ? "—" : String(activeKeys)}
            accent="cyan"
            testid="kpi-active-keys"
          />
          <KpiCard
            label="Total API keys"
            value={loading ? "—" : String(keysCount)}
            accent="blue"
            testid="kpi-total-keys"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Traffic · sampled</div>
                <div className="font-display font-bold text-lg tracking-tight">API requests by hour of day</div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Recent logs
              </div>
            </div>
            <div className="h-[300px] p-3">
              {!loading && logs.length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-[#4B5563]">No request logs in the current sample.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficSeries} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#27272a" vertical={false} />
                    <XAxis
                      dataKey="t"
                      stroke="#52525b"
                      tickLine={false}
                      axisLine={{ stroke: "#27272a" }}
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <YAxis
                      stroke="#52525b"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                    />
                    <Tooltip
                      contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, fontSize: 12 }}
                      cursor={{ stroke: "#3B82F6", strokeWidth: 1 }}
                    />
                    <Line type="monotone" dataKey="v" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline">Top events · catalog</div>
                <div className="font-display font-bold text-lg tracking-tight">Event volume hints</div>
              </div>
              <Link to="/developers/events" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">
                All →
              </Link>
            </div>
            <div className="divide-y divide-black/[0.06]">
              {!loading && topEvents.length === 0 && (
                <div className="p-4 text-sm text-[#4B5563]">No event catalog from API.</div>
              )}
              {topEvents.map((e) => (
                <div key={e.id} className="p-3 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-[#0066FF] truncate">{e.id}</div>
                    <div className="text-[10px] text-[#4B5563] truncate">{e.category}</div>
                  </div>
                  <span className="font-mono text-sm tabular text-[#0A0E1A]">{e.volume24h.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline flex items-center gap-2">
                  <Activity className="h-3 w-3" /> Recent requests
                </div>
                <div className="font-display font-bold text-lg tracking-tight">Live request log</div>
              </div>
              <Link to="/developers/logs" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">
                View all →
              </Link>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {!loading && recentRows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-[#4B5563]" colSpan={4}>
                      No recent logs.
                    </td>
                  </tr>
                )}
                {recentRows.map((l) => (
                  <tr key={l.id} className="border-b border-black/[0.08]/60">
                    <td className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider w-16">{l.method}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#1F2937] truncate">{l.path}</td>
                    <td className={`px-4 py-2.5 font-mono text-xs ${statusColor(l.status)} text-right`}>{l.status}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#4B5563] text-right tabular">{l.latency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
              <div>
                <div className="overline flex items-center gap-2">
                  <Webhook className="h-3 w-3" /> Webhook health
                </div>
                <div className="font-display font-bold text-lg tracking-tight">Endpoints</div>
              </div>
              <Link to="/developers/webhooks" className="text-xs text-[#0066FF] hover:text-[#0066FF] font-medium">
                Manage →
              </Link>
            </div>
            <div className="divide-y divide-black/[0.06]">
              {!loading && webhooks.length === 0 && (
                <div className="p-4 text-sm text-[#4B5563]">No webhook endpoints.</div>
              )}
              {webhooks.slice(0, 4).map((w) => (
                <Link key={w.id} to={`/developers/webhooks/${w.id}`} className="block p-3 hover:bg-[#F1F2F5]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        w.status === "active" ? "bg-emerald-500" : w.status === "paused" ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-[#1F2937] truncate">{w.url}</div>
                      <div className="text-[10px] text-[#4B5563] mt-0.5">
                        {w.deliveries24h.toLocaleString()} deliveries · {w.avgLatency}ms avg · last{" "}
                        {formatRelativeApiTime(w.lastDelivery)}
                      </div>
                    </div>
                    <span
                      className={`font-mono text-xs tabular ${
                        w.successRate >= 99 ? "text-[#15803D]" : w.successRate >= 95 ? "text-[#A16207]" : "text-[#B91C1C]"
                      }`}
                    >
                      {w.successRate}%
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
