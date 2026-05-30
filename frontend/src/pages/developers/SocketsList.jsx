import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Radio, Activity } from "lucide-react";
import { developersService } from "@/services/developers";
import { mapChatChannel } from "@/lib/mappers";
import { toast } from "sonner";

export default function SocketsList() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await developersService.listChatChannels({ limit: 200 });
      setChannels((raw || []).map(mapChatChannel));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Failed to load chat channels.");
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const totalSubs = channels.reduce((s, c) => s + c.subscribers, 0);
  const totalMsgs = channels.reduce((s, c) => s + c.messagesPerMin, 0);

  return (
    <div data-testid="sockets-list-page">
      <PageHeader
        breadcrumbs={[{ label: "Developers", to: "/developers" }, { label: "Realtime Sockets" }]}
        overline="Integrations · Realtime"
        title="Realtime Channels"
        description={
          loading
            ? "Loading…"
            : channels.length === 0
              ? "No company chat channels returned. Fleetbase socket metrics may be exposed elsewhere in your deployment."
              : `${channels.length} channels · ${totalSubs.toLocaleString()} subscribers · ~${totalMsgs.toLocaleString()} msg/min (when reported by API)`
        }
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && channels.length === 0 && (
          <div className="col-span-full text-sm text-[#4B5563]" data-testid="sockets-empty">
            This view lists <code className="font-mono text-xs">/chat-channels</code> for your organization. If the list is empty, your
            tenant may not use console chat channels, or metrics may not be published to this API.
          </div>
        )}
        {channels.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors"
            data-testid={`socket-card-${c.id}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-sm relative">
                <Radio className="h-5 w-5 text-[#0066FF]" strokeWidth={1.5} />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="overline">channel</div>
                <div className="font-mono font-semibold text-[#0066FF] truncate">{c.name}</div>
              </div>
            </div>
            <p className="text-sm text-[#374151]">{c.description || "—"}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-black/[0.08]">
              <div>
                <div className="overline">Subscribers</div>
                <div className="font-display text-xl font-bold tabular mt-1">{c.subscribers}</div>
              </div>
              <div>
                <div className="overline flex items-center gap-1">
                  <Activity className="h-3 w-3 text-[#15803D]" /> Msg/min
                </div>
                <div className="font-display text-xl font-bold tabular mt-1 text-[#15803D]">{c.messagesPerMin}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
