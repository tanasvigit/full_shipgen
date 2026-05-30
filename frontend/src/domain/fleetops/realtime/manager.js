import socketClusterClient from "socketcluster-client";
import { fleetopsCache } from "@/domain/fleetops/cache/store";
import { fleetopsCacheKeys } from "@/domain/fleetops/cache/keys";
import { resolveSocketConfig } from "./socketConfig";
import { handleFleetopsRealtimeMessage } from "./eventRouter";

const DEDUPE_MS = 400;

/**
 * Central FleetOps realtime engine — ref-counted channels, dedupe, reconnect, extension hooks.
 */
class FleetopsRealtimeManager {
  constructor() {
    this.socket = null;
    this.state = "idle";
    this.subscriptions = new Map();
    this.extensionHandlers = [];
    this.recentKeys = new Map();
    this.reconnectTimer = null;
    this.pollers = new Map();
  }

  registerHandler(fn) {
    if (typeof fn === "function") this.extensionHandlers.push(fn);
    return () => {
      this.extensionHandlers = this.extensionHandlers.filter((h) => h !== fn);
    };
  }

  async connect() {
    if (this.socket && this.state === "connected") return this.socket;
    if (this.state === "connecting") return this.socket;

    this.state = "connecting";
    const options = resolveSocketConfig();

    try {
      this.socket = socketClusterClient.create(options);
      this.socket.connect();
      await this.socket.listener("connect").once();
      this.state = "connected";
      this.#resubscribeAll();
      this.#wireReconnect();
    } catch (err) {
      this.state = "degraded";
      console.warn("[fleetops-realtime] Socket unavailable, using poll fallback:", err?.message);
      this.#startPollFallback();
    }

    return this.socket;
  }

  subscribe(channelId, handler, { debounceMs = 0, pollIntervalMs = 0 } = {}) {
    if (!channelId || typeof handler !== "function") {
      return () => {};
    }

    let sub = this.subscriptions.get(channelId);
    if (!sub) {
      sub = {
        channelId,
        refCount: 0,
        handlers: new Set(),
        debounceMs,
        debouncer: null,
        channel: null,
        pumpActive: false,
        pollIntervalMs,
        pollTimer: null,
      };
      this.subscriptions.set(channelId, sub);
      void this.#attachChannel(sub);
    }

    sub.refCount += 1;
    sub.handlers.add(handler);

    if (pollIntervalMs > 0) this.#ensurePoll(sub);

    return () => this.unsubscribe(channelId, handler);
  }

  unsubscribe(channelId, handler) {
    const sub = this.subscriptions.get(channelId);
    if (!sub) return;

    sub.handlers.delete(handler);
    sub.refCount = Math.max(0, sub.refCount - 1);

    if (sub.refCount === 0) {
      this.#teardownSubscription(sub);
      this.subscriptions.delete(channelId);
    }
  }

  async #attachChannel(sub) {
    await this.connect();
    if (this.state !== "connected" || !this.socket) return;

    try {
      sub.channel = this.socket.subscribe(sub.channelId);
      if (sub.channel.state !== "subscribed") {
        await sub.channel.subscribe();
      }
      if (!sub.pumpActive) {
        sub.pumpActive = true;
        void this.#pump(sub);
      }
    } catch (err) {
      console.warn(`[fleetops-realtime] subscribe failed ${sub.channelId}:`, err?.message);
      this.#ensurePoll(sub);
    }
  }

  async #pump(sub) {
    const { channel } = sub;
    if (!channel) return;

    try {
      for await (const message of channel) {
        if (!this.subscriptions.has(sub.channelId)) break;
        this.#dispatch(sub.channelId, message);
      }
    } catch (err) {
      if (this.subscriptions.has(sub.channelId)) {
        console.warn(`[fleetops-realtime] pump ended ${sub.channelId}:`, err?.message);
      }
    } finally {
      sub.pumpActive = false;
    }
  }

  #dispatch(channelId, message) {
    const event = message?.event || message?.type || "message";
    const key = `${channelId}:${event}:${JSON.stringify(message?.data?.id || message?.data?.uuid || "")}`;
    const now = Date.now();
    const last = this.recentKeys.get(key);
    if (last && now - last < DEDUPE_MS) return;
    this.recentKeys.set(key, now);

    const sub = this.subscriptions.get(channelId);
    if (!sub) return;

    const run = () => {
      sub.handlers.forEach((fn) => {
        try {
          fn(message, { channelId });
        } catch (e) {
          console.warn("[fleetops-realtime] handler error:", e);
        }
      });
      this.extensionHandlers.forEach((fn) => {
        try {
          fn(message, { channelId });
        } catch (e) {
          console.warn("[fleetops-realtime] extension handler error:", e);
        }
      });
      handleFleetopsRealtimeMessage(message, { channelId });
    };

    if (sub.debounceMs > 0) {
      if (sub.debouncer) clearTimeout(sub.debouncer);
      sub.debouncer = setTimeout(run, sub.debounceMs);
    } else {
      run();
    }
  }

  #teardownSubscription(sub) {
    if (sub.debouncer) clearTimeout(sub.debouncer);
    if (sub.pollTimer) clearInterval(sub.pollTimer);
    sub.pollTimer = null;
    if (sub.channel) {
      try {
        sub.channel.unsubscribe?.();
        sub.channel.close?.();
      } catch {
        /* ignore */
      }
      sub.channel = null;
    }
  }

  #resubscribeAll() {
    for (const sub of this.subscriptions.values()) {
      sub.channel = null;
      sub.pumpActive = false;
      void this.#attachChannel(sub);
    }
  }

  #ensurePoll(sub) {
    if (sub.pollTimer || !sub.pollIntervalMs) return;
    sub.pollTimer = setInterval(() => {
      this.#dispatch(sub.channelId, {
        event: "poll.tick",
        data: {},
        _synthetic: true,
      });
    }, sub.pollIntervalMs);
  }

  #startPollFallback() {
    for (const sub of this.subscriptions.values()) {
      if (!sub.pollIntervalMs) sub.pollIntervalMs = 15000;
      this.#ensurePoll(sub);
    }
  }

  #wireReconnect() {
    if (!this.socket || this._reconnectWired) return;
    this._reconnectWired = true;
    (async () => {
      try {
        for await (const _ of this.socket.listener("disconnect")) {
          this.state = "degraded";
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => {
            this.state = "connecting";
            void this.connect();
          }, 2500);
        }
      } catch {
        /* socket closed */
      }
    })();
    (async () => {
      try {
        for await (const _ of this.socket.listener("connect")) {
          if (this.state !== "connected") {
            this.state = "connected";
            this.#resubscribeAll();
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }

  getStatus() {
    return this.state;
  }
}

export const fleetopsRealtimeManager = new FleetopsRealtimeManager();
