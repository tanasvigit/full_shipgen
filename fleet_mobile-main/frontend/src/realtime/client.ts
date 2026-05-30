import socketClusterClient from "socketcluster-client";
import { resolveSocketConfig } from "@/src/realtime/socketConfig";
import { nextReconnectDelayMs } from "@/src/realtime/reconnect";
import { logEvent } from "@/src/services/observability";

export type SocketState = "idle" | "connecting" | "connected" | "degraded";

class RealtimeClient {
  private socket: ReturnType<typeof socketClusterClient.create> | null = null;
  state: SocketState = "idle";
  reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  getStatus() {
    return {
      state: this.state,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  async connect(): Promise<ReturnType<typeof socketClusterClient.create> | null> {
    if (this.state === "connected" && this.socket) return this.socket;
    if (this.state === "connecting") return this.socket;

    this.state = "connecting";
    try {
      this.socket = socketClusterClient.create(resolveSocketConfig());
      this.socket.connect();
      await this.socket.listener("connect").once();
      this.state = "connected";
      this.reconnectAttempts = 0;
      logEvent("socket.connected");
      this.#wireDisconnect();
      return this.socket;
    } catch (error) {
      this.state = "degraded";
      this.socket = null;
      const message = error instanceof Error ? error.message : String(error);
      logEvent("socket.disconnected", { reason: "initial_connect_failed", message });
      this.#scheduleReconnect();
      return null;
    }
  }

  instance() {
    return this.socket;
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try {
      this.socket?.disconnect();
    } catch {
      // ignore
    }
    this.socket = null;
    this.state = "idle";
    logEvent("socket.disconnected", { reason: "manual" });
  }

  #wireDisconnect() {
    if (!this.socket) return;
    void (async () => {
      for await (const _event of this.socket!.listener("disconnect")) {
        void _event;
        this.state = "degraded";
        logEvent("socket.disconnected", { reason: "socket_drop" });
        this.#scheduleReconnect();
        break;
      }
    })();
  }

  #scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = nextReconnectDelayMs(this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect().catch(() => undefined);
    }, delay);
  }
}

export const realtimeClient = new RealtimeClient();
