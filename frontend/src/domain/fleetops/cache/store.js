import { fleetopsCacheKeys } from "./keys";

/**
 * Lightweight in-memory cache + invalidation bus (React-query-free).
 * Subscribers refresh when keys are invalidated after mutations.
 */

class FleetopsCacheStore {
  constructor() {
    this.data = new Map();
    this.generation = new Map();
    this.listeners = new Set();
  }

  _keyStr(key) {
    return Array.isArray(key) ? key.join(":") : String(key);
  }

  getGeneration(key) {
    return this.generation.get(this._keyStr(key)) || 0;
  }

  bump(key) {
    const k = this._keyStr(key);
    this.generation.set(k, (this.generation.get(k) || 0) + 1);
    this.data.delete(k);
    this.notify(key);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify(key) {
    this.listeners.forEach((fn) => fn(key));
  }

  invalidate(keys) {
    const list = Array.isArray(keys[0]) ? keys : [keys];
    list.forEach((k) => this.bump(k));
  }

  /** Standard invalidation after order mutation */
  invalidateOrder(orderId) {
    this.invalidate([
      fleetopsCacheKeys.orders.all(),
      fleetopsCacheKeys.orders.detail(orderId),
      fleetopsCacheKeys.orders.meta(orderId),
      fleetopsCacheKeys.orders.activity(orderId),
      fleetopsCacheKeys.orders.files(orderId),
    ]);
  }

  invalidateDriver(driverId) {
    this.invalidate([
      fleetopsCacheKeys.drivers.all(),
      fleetopsCacheKeys.drivers.detail(driverId),
      fleetopsCacheKeys.orders.all(),
    ]);
  }

  invalidateVehicle(vehicleId) {
    this.invalidate([
      fleetopsCacheKeys.vehicles.all(),
      fleetopsCacheKeys.vehicles.detail(vehicleId),
      fleetopsCacheKeys.orders.all(),
    ]);
  }

  invalidateFleet(fleetId) {
    this.invalidate([
      fleetopsCacheKeys.fleets.all(),
      fleetopsCacheKeys.fleets.detail(fleetId),
      fleetopsCacheKeys.lookups(),
    ]);
  }

  invalidatePlace(placeId) {
    this.invalidate([
      fleetopsCacheKeys.places.all(),
      fleetopsCacheKeys.places.detail(placeId),
      fleetopsCacheKeys.orders.all(),
      fleetopsCacheKeys.lookups(),
    ]);
  }
}

export const fleetopsCache = new FleetopsCacheStore();
