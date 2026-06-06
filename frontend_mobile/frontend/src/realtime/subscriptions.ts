import { realtimeClient } from "@/src/realtime/client";
import { companyChannel, companyOrdersChannel, driverChannel, orderChannel } from "@/src/realtime/channels";
import { normalizeRealtimeMessage } from "@/src/realtime/eventRouter";
import { invalidateForRealtimeEvent } from "@/src/query/eventInvalidation";
import { triggerScopedResync } from "@/src/realtime/resync";
import { queryClient } from "@/src/query/client";
import { logEvent } from "@/src/services/observability";

type SubscriptionRecord = {
  channelId: string;
  refCount: number;
  channel: { unsubscribe: () => Promise<void> };
};

class RealtimeSubscriptions {
  private subs = new Map<string, SubscriptionRecord>();
  private companyUuid: string | null = null;
  private driverPublicId: string | null = null;
  private activeOrderIds = new Set<string>();

  getActiveChannels() {
    return [...this.subs.keys()];
  }

  async startSession(params: {
    companyUuid: string;
    driverPublicId?: string | null;
    orderPublicIds?: string[];
  }) {
    this.companyUuid = params.companyUuid;
    this.driverPublicId = params.driverPublicId || null;

    await this.#subscribe(companyChannel(params.companyUuid));
    await this.#subscribe(companyOrdersChannel(params.companyUuid));

    if (this.driverPublicId) {
      await this.#subscribe(driverChannel(this.driverPublicId));
    }

    for (const orderId of params.orderPublicIds || []) {
      this.trackOrder(orderId);
    }
  }

  async trackOrder(orderPublicId: string) {
    if (!orderPublicId || this.activeOrderIds.has(orderPublicId)) return;
    this.activeOrderIds.add(orderPublicId);
    await this.#subscribe(orderChannel(orderPublicId));
  }

  async untrackOrder(orderPublicId: string) {
    this.activeOrderIds.delete(orderPublicId);
    await this.#unsubscribe(orderChannel(orderPublicId));
  }

  async stopSession() {
    for (const channelId of [...this.subs.keys()]) {
      await this.#unsubscribe(channelId, true);
    }
    this.subs.clear();
    this.activeOrderIds.clear();
    this.companyUuid = null;
    this.driverPublicId = null;
  }

  async #subscribe(channelId: string) {
    const existing = this.subs.get(channelId);
    if (existing) {
      existing.refCount += 1;
      return;
    }

    let socket;
    try {
      socket = await realtimeClient.connect();
    } catch {
      logEvent("socket.disconnected", { reason: "subscribe_connect_failed", channelId });
      return;
    }
    if (!socket) return;
    const channel = socket.subscribe(channelId);
    if (channel.state !== "subscribed") {
      await channel.subscribe();
    }

    const record: SubscriptionRecord = { channelId, refCount: 1, channel };
    this.subs.set(channelId, record);

    void (async () => {
      for await (const message of channel) {
        const normalized = normalizeRealtimeMessage(channelId, message);
        if (!normalized || !this.companyUuid) continue;

        logEvent("socket.event", {
          channelId,
          event: normalized.event,
          rawEvent: normalized.rawEvent,
        });

        await invalidateForRealtimeEvent(queryClient, this.companyUuid, normalized);

        const orderRef = String(
          normalized.data.uuid ||
            normalized.data.id ||
            normalized.data.public_id ||
            normalized.data.order_uuid ||
            ""
        );
        if (orderRef) {
          await triggerScopedResync(queryClient, this.companyUuid, `socket:${normalized.event}`, orderRef);
        } else {
          await triggerScopedResync(queryClient, this.companyUuid, `socket:${normalized.event}`);
        }
      }
    })();
  }

  async #unsubscribe(channelId: string, force = false) {
    const record = this.subs.get(channelId);
    if (!record) return;

    if (!force) {
      record.refCount -= 1;
      if (record.refCount > 0) return;
    }

    const channel = record.channel;
    this.subs.delete(channelId);
    try {
      await channel.unsubscribe();
    } catch {
      // ignore
    }
  }
}

export const realtimeSubscriptions = new RealtimeSubscriptions();
