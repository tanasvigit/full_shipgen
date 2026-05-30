import { toast } from "sonner";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { fleetopsCache } from "../cache/store";

/**
 * Serializes mutations per scope, dedupes in-flight identical ops, supports rollback + cache invalidation.
 */
class MutationOrchestrator {
  constructor() {
    this.queues = new Map();
    this.inflight = new Map();
    this.pendingCount = 0;
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    this.listeners.forEach((fn) => fn(this.pendingCount));
  }

  _dedupeKey(scope, id) {
    return `${scope}:${id}`;
  }

  async run({
    scope = "default",
    id = "default",
    dedupe = true,
    apply,
    commit,
    rollback,
    invalidate,
    successMessage,
    errorMessage,
    silent = false,
  }) {
    const inflightKey = dedupe ? `${scope}:${id}:${commit?.name || "op"}` : null;

    if (dedupe && inflightKey && this.inflight.has(inflightKey)) {
      return this.inflight.get(inflightKey);
    }

    const execute = async () => {
      this.pendingCount += 1;
      this._notify();
      let snapshot;

      try {
        if (apply) snapshot = apply();
        const result = await commit();
        if (invalidate) invalidate();
        if (successMessage && !silent) toast.success(successMessage);
        return { ok: true, result, snapshot };
      } catch (err) {
        if (rollback && snapshot !== undefined) rollback(snapshot);
        if (!silent) toast.error(errorMessage || parseFleetopsApiError(err));
        return { ok: false, error: err, snapshot };
      } finally {
        this.pendingCount = Math.max(0, this.pendingCount - 1);
        this._notify();
        if (inflightKey) this.inflight.delete(inflightKey);
      }
    };

    const scoped = this._enqueue(scope, execute);
    if (inflightKey) this.inflight.set(inflightKey, scoped);
    return scoped;
  }

  _enqueue(scope, fn) {
    const prev = this.queues.get(scope) || Promise.resolve();
    const next = prev.then(fn, fn);
    this.queues.set(
      scope,
      next.finally(() => {
        if (this.queues.get(scope) === next) this.queues.delete(scope);
      }),
    );
    return next;
  }

  get isPending() {
    return this.pendingCount > 0;
  }
}

export const mutationOrchestrator = new MutationOrchestrator();

export function invalidateAfterOrderMutation(orderId) {
  fleetopsCache.invalidateOrder(orderId);
}
