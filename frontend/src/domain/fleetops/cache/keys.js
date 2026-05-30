/** Canonical cache key factory — keeps invalidation predictable. */

export const fleetopsCacheKeys = {
  orders: {
    all: () => ["fleetops", "orders"],
    detail: (id) => ["fleetops", "orders", String(id)],
    meta: (id) => ["fleetops", "orders", String(id), "meta"],
    activity: (id) => ["fleetops", "orders", String(id), "activity"],
    files: (id) => ["fleetops", "orders", String(id), "files"],
  },
  drivers: {
    all: () => ["fleetops", "drivers"],
    detail: (id) => ["fleetops", "drivers", String(id)],
  },
  vehicles: {
    all: () => ["fleetops", "vehicles"],
    detail: (id) => ["fleetops", "vehicles", String(id)],
  },
  fleets: {
    all: () => ["fleetops", "fleets"],
    detail: (id) => ["fleetops", "fleets", String(id)],
  },
  places: {
    all: () => ["fleetops", "places"],
    detail: (id) => ["fleetops", "places", String(id)],
  },
  schedule: {
    items: () => ["fleetops", "schedule-items"],
  },
  lookups: () => ["fleetops", "lookups"],
};
