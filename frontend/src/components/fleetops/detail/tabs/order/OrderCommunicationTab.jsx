import { useMemo, useState } from "react";
import { useOrderComments } from "@/hooks/fleetops/useOrderComments";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";
import { orderChannelId } from "@/domain/fleetops/realtime/socketConfig";
import { mergeOperationalFeed } from "@/domain/fleetops/feed/mergeOperationalFeed";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TableSkeleton } from "@/components/loaders";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function OrderCommunicationTab({ orderId, rawOrder, enabled, activityEvents = [] }) {
  const ability = useFleetopsAbility();
  const [draft, setDraft] = useState("");
  const { comments, loading, sending, sendComment, reload } = useOrderComments(orderId, { enabled });

  const channel = rawOrder ? orderChannelId(rawOrder) : orderId ? orderChannelId({ uuid: orderId, id: orderId }) : null;

  useFleetopsRealtimeChannel(
    channel,
    (message) => {
      const event = message?.event || message?.type;
      if (event === "order.comment_added" || event === "order.updated") {
        reload();
      }
    },
    { enabled: enabled && Boolean(channel), debounceMs: 400 },
  );

  const feed = useMemo(() => mergeOperationalFeed(activityEvents, comments), [activityEvents, comments]);

  const handleSend = async () => {
    if (!ability.canCommentOrder) {
      toast.error("You do not have permission to post comments.");
      return;
    }
    const ok = await sendComment(draft);
    if (ok) setDraft("");
  };

  if (loading && !comments.length && !activityEvents.length) {
    return (
      <div className="p-4">
        <TableSkeleton rows={4} testId="order-communication-skeleton" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="order-communication-tab">
      {ability.canCommentOrder && (
        <div className="bg-white border border-black/[0.08] rounded-md p-4 space-y-3">
          <div className="overline">Dispatcher note</div>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add operational note for dispatch, delivery, or customer communication…"
            className="bg-[#F5F6F8] resize-none"
            data-testid="order-comment-input"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              className="bg-[#0066FF] hover:bg-[#0040CC]"
              disabled={sending || !draft.trim()}
              onClick={handleSend}
              data-testid="order-comment-send"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="overline">Operational feed</div>
          <span className="text-[10px] font-mono text-emerald-700 uppercase tracking-wider">Live</span>
        </div>
        <ActivityTimeline events={feed} loading={false} testId="order-operational-feed" />
      </div>
    </div>
  );
}
