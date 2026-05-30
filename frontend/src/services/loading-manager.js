/**
 * Central loading state manager — debounce, minimum visible duration, concurrent tokens.
 */

export const LOADING_DEFAULTS = {
  debounceMs: 220,
  minVisibleMs: 380,
  routeMinMs: 280,
};

const MESSAGES = {
  bootstrap: "Starting up…",
  auth: "Restoring session…",
  route: "Loading page…",
  api: "Syncing records…",
  dashboard: "Loading dashboard…",
  orders: "Fetching orders…",
  routes: "Fetching routes…",
  schedule: "Loading schedule…",
  drivers: "Loading drivers…",
  vehicles: "Loading vehicles…",
  places: "Loading places…",
  fleets: "Loading fleets…",
  report: "Generating report…",
  map: "Loading map…",
  search: "Searching…",
  upload: "Uploading…",
  websocket: "Reconnecting…",
};

export function messageForPath(pathname = "") {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return MESSAGES.dashboard;
  if (pathname.includes("/operations/orders")) return MESSAGES.orders;
  if (pathname.includes("/operations/routing")) return MESSAGES.routes;
  if (pathname.includes("/operations/schedule")) return MESSAGES.schedule;
  if (pathname.includes("/management/drivers")) return MESSAGES.drivers;
  if (pathname.includes("/management/vehicles")) return MESSAGES.vehicles;
  if (pathname.includes("/management/places")) return MESSAGES.places;
  if (pathname.includes("/management/fleets")) return MESSAGES.fleets;
  if (pathname.includes("/ledger/reports")) return MESSAGES.report;
  if (pathname.includes("/fleet-ops")) return MESSAGES.orders;
  if (pathname.includes("/storefront")) return MESSAGES.api;
  if (pathname.includes("/ledger")) return MESSAGES.api;
  if (pathname.includes("/iam")) return MESSAGES.api;
  if (pathname.includes("/developers")) return MESSAGES.api;
  if (pathname.includes("/pallet")) return MESSAGES.api;
  if (pathname.includes("/registry")) return MESSAGES.api;
  return MESSAGES.route;
}

class LoadingManager {
  constructor() {
    this.listeners = new Set();
    this.apiEntries = new Map();
    this.apiActiveCount = 0;
    this.bootstrap = { active: true, message: MESSAGES.bootstrap };
    this.auth = { active: false, message: MESSAGES.auth };
    this.global = { active: false, message: "" };
    this.route = { active: false, message: MESSAGES.route, startedAt: 0 };
    this.routeTimer = null;
    this.scoped = new Map();
    this.progressVisible = false;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  getSnapshot() {
    return {
      bootstrap: { ...this.bootstrap },
      auth: { ...this.auth },
      global: { ...this.global },
      route: { ...this.route },
      apiActive: this.apiActiveCount > 0,
      apiCount: this.apiActiveCount,
      progressActive:
        this.bootstrap.active ||
        this.auth.active ||
        this.global.active ||
        this.route.active ||
        this.apiActiveCount > 0,
      scoped: Object.fromEntries(
        [...this.scoped.entries()].map(([k, v]) => [k, { ...v }]),
      ),
    };
  }

  setBootstrap(active, message = MESSAGES.bootstrap) {
    this.bootstrap = { active, message };
    this.notify();
  }

  setAuth(active, message = MESSAGES.auth) {
    this.auth = { active, message };
    this.notify();
  }

  setGlobal(active, message = "") {
    this.global = { active, message };
    this.notify();
  }

  startRoute(message) {
    if (this.routeTimer) clearTimeout(this.routeTimer);
    this.route = { active: true, message: message || MESSAGES.route, startedAt: Date.now() };
    this.notify();
  }

  endRoute() {
    const elapsed = Date.now() - (this.route.startedAt || 0);
    const remain = Math.max(0, LOADING_DEFAULTS.routeMinMs - elapsed);
    if (this.routeTimer) clearTimeout(this.routeTimer);
    this.routeTimer = setTimeout(() => {
      this.route = { active: false, message: "", startedAt: 0 };
      this.routeTimer = null;
      this.notify();
    }, remain);
  }

  /**
   * Track an API request. Returns release function.
   * @param {{ message?: string, debounceMs?: number, minVisibleMs?: number, global?: boolean }} options
   */
  trackApi(options = {}) {
    const id = `api-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const message = options.message || MESSAGES.api;
    const debounceMs = options.debounceMs ?? LOADING_DEFAULTS.debounceMs;
    const minVisibleMs = options.minVisibleMs ?? LOADING_DEFAULTS.minVisibleMs;
    const useGlobal = options.global === true;

    const timer = setTimeout(() => {
      const entry = this.apiEntries.get(id);
      if (!entry) return;
      entry.visible = true;
      entry.shownAt = Date.now();
      this.apiActiveCount += 1;
      if (useGlobal) {
        this.global = { active: true, message };
      }
      this.notify();
    }, debounceMs);

    this.apiEntries.set(id, { timer, message, visible: false, shownAt: 0, minVisibleMs, useGlobal });

    return () => this.releaseApi(id);
  }

  releaseApi(id) {
    const entry = this.apiEntries.get(id);
    if (!entry) return;

    if (entry.timer) {
      clearTimeout(entry.timer);
      entry.timer = null;
    }

    const finish = () => {
      if (!this.apiEntries.has(id)) return;
      this.apiEntries.delete(id);
      if (entry.visible) {
        this.apiActiveCount = Math.max(0, this.apiActiveCount - 1);
        if (entry.useGlobal) {
          this.global = { active: false, message: "" };
        }
      }
      this.notify();
    };

    if (!entry.visible) {
      finish();
      return;
    }

    const elapsed = Date.now() - entry.shownAt;
    const remain = Math.max(0, entry.minVisibleMs - elapsed);
    if (remain > 0) {
      entry.releaseTimer = setTimeout(finish, remain);
    } else {
      finish();
    }
  }

  /** Reconcile counters if releases were missed (e.g. aborted requests). */
  reconcileApiTokens() {
    let visible = 0;
    for (const entry of this.apiEntries.values()) {
      if (entry.visible) visible += 1;
    }
    if (visible !== this.apiActiveCount) {
      this.apiActiveCount = visible;
      if (visible === 0) {
        this.global = { active: false, message: "" };
      }
      this.notify();
    }
  }

  setScoped(key, active, message = "") {
    if (active) {
      this.scoped.set(key, { active: true, message });
    } else {
      this.scoped.delete(key);
    }
    this.notify();
  }
}

export const loadingManager = new LoadingManager();
export { MESSAGES };
