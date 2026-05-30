import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Input } from "@/components/ui/input";
import { Search, Zap, Copy } from "lucide-react";
import { developersService } from "@/services/developers";
import { mapDeveloperEventType } from "@/lib/mappers";
import { toast } from "sonner";

export default function EventsList() {
  const [q, setQ] = useState("");
  const [eventTypes, setEventTypes] = useState([]);
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        let raw = await developersService.listWebhookEvents();
        if (!alive) return;
        if (!raw?.length) {
          raw = await developersService.listApiEvents({ limit: 500 });
        }
        const mapped = (raw || []).map(mapDeveloperEventType).filter((e) => e.id);
        setEventTypes(mapped);
        if (mapped.length) setActive((prev) => (prev && mapped.some((e) => e.id === prev) ? prev : mapped[0].id));
      } catch (err) {
        if (!alive) return;
        toast.error(err?.friendlyMessage || "Failed to load event catalog.");
        setEventTypes([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return eventTypes;
    const lower = q.toLowerCase();
    return eventTypes.filter((e) => e.id.toLowerCase().includes(lower) || e.category.toLowerCase().includes(lower));
  }, [eventTypes, q]);

  const grouped = useMemo(() => {
    return filtered.reduce((acc, e) => {
      (acc[e.category] = acc[e.category] || []).push(e);
      return acc;
    }, {});
  }, [filtered]);

  const activeEvent = eventTypes.find((e) => e.id === active);

  return (
    <div data-testid="events-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Developers", to: "/developers" }, { label: "Event Types" }]}
        overline="Inspect"
        title="Event Types"
        description={
          loading
            ? "Loading…"
            : `${eventTypes.length} event type${eventTypes.length === 1 ? "" : "s"} across ${Object.keys(grouped).length} categories`
        }
      />
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-fit">
          <div className="p-3 border-b border-black/[0.08]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#4B5563]" strokeWidth={1.75} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filter events…"
                className="pl-8 h-8 bg-[#F1F2F5] border-black/[0.08] text-sm"
                data-testid="events-search"
              />
            </div>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {!loading && filtered.length === 0 && (
              <div className="p-4 text-sm text-[#4B5563]">No event types returned by the API.</div>
            )}
            {Object.entries(grouped).map(([cat, list]) => (
              <div key={cat} className="border-b border-black/[0.08]/60 last:border-b-0">
                <div className="px-3 pt-3 pb-1 overline">{cat}</div>
                {list.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setActive(e.id)}
                    data-testid={`event-item-${e.id}`}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors border-l-2 ${
                      active === e.id ? "bg-blue-600/10 border-blue-500" : "hover:bg-[#F1F2F5] border-transparent"
                    }`}
                  >
                    <Zap className="h-3 w-3 text-[#4B5563] shrink-0" />
                    <span className="font-mono text-xs flex-1 truncate">{e.id}</span>
                    <span className="font-mono text-[10px] text-[#4B5563] tabular">{e.volume24h.toLocaleString()}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {activeEvent && (
          <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden h-fit">
            <div className="p-5 border-b border-black/[0.08]">
              <div className="overline">{activeEvent.category}</div>
              <div className="font-mono text-2xl font-semibold mt-1 text-[#0066FF]">{activeEvent.id}</div>
              <p className="text-sm text-[#1F2937] mt-3">{activeEvent.description}</p>
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div>
                  <div className="overline">Volume · 24h</div>
                  <div className="font-display text-xl font-bold tabular mt-1">{activeEvent.volume24h.toLocaleString()}</div>
                </div>
                <div>
                  <div className="overline">Category</div>
                  <div className="text-sm mt-1">{activeEvent.category}</div>
                </div>
              </div>
            </div>
            <div>
              <div className="px-4 py-2.5 border-b border-black/[0.08] flex items-center justify-between">
                <span className="overline">Sample payload</span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard?.writeText(activeEvent.sample)?.catch?.(() => {});
                    } catch {
                      /* ignore */
                    }
                    toast.success("Sample copied");
                  }}
                  className="text-[#4B5563] hover:text-[#0A0E1A] inline-flex items-center gap-1 text-[11px] font-medium"
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="p-4 font-mono text-[11px] text-[#1F2937] overflow-x-auto leading-relaxed">{activeEvent.sample}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
