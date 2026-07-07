import { apiClient, unwrapEntity, unwrapList, unwrapListPage } from "@/lib/api";
import { parseApiError } from "@/lib/errors";
import {
  buildDriverPayload,
  buildFleetPayload,
  buildOrderPayload,
  buildPlacePayload,
  buildScheduleItemPayload,
  buildVehiclePayload,
} from "@/lib/fleetops/payloads";
import { buildOrderConfigPayload } from "@/lib/fleetops/orderConfig";
import { CRUD_IMPORT_EXPORT_RESOURCES } from "@/lib/fleetops/crudImportExport";
import { toMultiPolygonGeoJson, toZoneBorderGeoJson } from "@/lib/fleetops/geofence";
import { FLEETOPS_SETTINGS_LOADERS, FLEETOPS_SETTINGS_SAVERS } from "@/lib/fleetops/settingsApi";
import { orchestratorOrderEligibility } from "@/lib/fleetops/orchestratorImport";
import {
  buildCustomFieldApiPayload,
  buildCustomFieldGroupPayload,
  customFieldMatchesEntity,
  mapCustomFieldGroupRow,
  normalizeEntityFor,
} from "@/lib/fleetops/customFieldPayloads";
import {
  buildDeviceApiPayload,
  buildEntityApiPayload,
  buildPayloadApiPayload,
  buildPurchaseRateApiPayload,
  buildSensorApiPayload,
  buildTelematicApiPayload,
  buildTrackingNumberApiPayload,
  buildTrackingStatusApiPayload,
  isUuid,
  deviceVehicleId,
  isDeviceAttachedToVehicle,
  recordMatchesTelematic,
  enrichLiveVehicles,
} from "@/lib/fleetops/connectivityResourcePayloads";
import { buildServiceRateApiPayload } from "@/lib/fleetops/serviceRatePayloads";
import { FLEETOPS_MORPH, warrantyPayload } from "@/lib/fleetops/maintenancePayloads";
import { orgStorage } from "@/lib/storage";
import { filesService } from "@/services/files";

const RESOURCES = {
  orders: ["orders"],
  drivers: ["drivers"],
  vehicles: ["vehicles"],
  places: ["places"],
  fleets: ["fleets"],
  orderConfigs: ["order-configs", "order_configs"],
  contacts: ["contacts"],
  vendors: ["vendors"],
  integratedVendors: ["integrated-vendors", "integrated_vendors"],
  customers: ["customers"],
  fuelReports: ["fuel-reports", "fuel_reports"],
  issues: ["issues"],
  devices: ["devices"],
  sensors: ["sensors"],
  telematics: ["telematics"],
  deviceEvents: ["device-events", "device_events"],
  maintenanceSchedules: ["maintenance-schedules", "maintenance_schedules"],
  maintenances: ["maintenances"],
  workOrders: ["work-orders", "work_orders"],
  equipment: ["equipment"],
  parts: ["parts"],
  serviceAreas: ["service-areas", "service_areas"],
  serviceAreaZones: ["service-area-zones", "service_area_zones", "zones"],
  vehicleDevices: ["vehicle-devices", "vehicle_devices"],
  serviceRates: ["service-rates", "service_rates"],
  routes: ["routes"],
  settingsNavigator: ["fleet-ops/settings/navigator", "settings/navigator"],
  settingsNotifications: ["fleet-ops/settings/notifications", "settings/notifications"],
  settingsRouting: ["fleet-ops/settings/routing-settings", "settings/routing-settings"],
  settingsOrchestrator: ["fleet-ops/settings/orchestrator", "settings/orchestrator"],
  settingsScheduling: ["fleet-ops/settings/scheduling", "settings/scheduling"],
  settingsBranding: ["fleet-ops/settings/branding", "settings/branding"],
  settingsAvatars: ["fleet-ops/settings/avatars", "settings/avatars"],
  zones: ["zones"],
  customFields: ["custom-fields", "custom_fields"],
  categories: ["categories"],
  reports: ["reports"],
  positions: ["positions"],
  warranties: ["warranties"],
  payloads: ["payloads"],
  entities: ["entities"],
  proofs: ["proofs"],
  purchaseRates: ["purchase-rates", "purchase_rates"],
  serviceQuotes: ["service-quotes", "service_quotes"],
  trackingNumbers: ["tracking-numbers", "tracking_numbers"],
  trackingStatuses: ["tracking-statuses", "tracking_statuses"],
};

const toPayloadKey = (entityKey) => entityKey.replace(/([A-Z])/g, "_$1").toLowerCase();
const DAY3_STORE_KEY = "fleetops_day3_store_v1";
const DEVICE_CACHE_TTL_MS = 30_000;
let liveDeviceCache = { at: 0, rows: [] };

const readDay3Store = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DAY3_STORE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeDay3Store = (next) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DAY3_STORE_KEY, JSON.stringify(next));
};

const getCachedDevices = async () => {
  const now = Date.now();
  if (now - liveDeviceCache.at < DEVICE_CACHE_TTL_MS && Array.isArray(liveDeviceCache.rows)) {
    return liveDeviceCache.rows;
  }
  const rows = await fleetopsService.listDevice().catch(() => []);
  liveDeviceCache = { at: now, rows };
  return rows;
};

const attachGenericCrud = (service, methodPrefix, candidates, entityKey, listKeys) => {
  const payloadKey = toPayloadKey(entityKey);
  const list = Array.isArray(listKeys) ? listKeys : [listKeys, `${entityKey}s`];
  const cap = methodPrefix.charAt(0).toUpperCase() + methodPrefix.slice(1);

  service[`list${cap}`] = async () => {
    try {
      const payload = await tryCandidates(candidates, "get", "", undefined);
      return unwrapList(payload, list);
    } catch {
      return [];
    }
  };

  service[`get${cap}`] = async (id) => {
    const payload = await tryCandidates(candidates, "get", `/${id}`);
    return unwrapEntity(payload, [entityKey, payloadKey]);
  };

  service[`create${cap}`] = async (formValues = {}) => {
    const body = { [payloadKey]: formValues, ...formValues };
    const payload = await tryCandidates(candidates, "post", "", body);
    return unwrapEntity(payload, [entityKey, payloadKey]);
  };

  service[`update${cap}`] = async (id, formValues = {}) => {
    const body = { [payloadKey]: formValues, ...formValues };
    const payload = await tryCandidatesMutate(candidates, `/${id}`, body);
    return unwrapEntity(payload, [entityKey, payloadKey]);
  };

  service[`delete${cap}`] = async (id) => {
    await tryCandidates(candidates, "delete", `/${id}`);
  };
};

const shouldTryNextCandidate = (error) => {
  const status = error?.response?.status;
  if (!status) return true;
  if (status >= 500) return false;
  if (status === 400) return false;
  return status === 404 || status === 405;
};

/** Pull human-readable messages from Fleetbase error envelopes. */
const getApiErrorText = (error) => parseApiError(error, "");

const ORDER_TRANSITION_IDEMPOTENT = {
  dispatch: ["order has already been dispatched"],
  cancel: ["order was canceled", "order has already been canceled", "order has already been cancelled"],
  start: ["order has already been started"],
};

const isIdempotentOrderTransitionError = (kind, error) => {
  const text = getApiErrorText(error).toLowerCase();
  return (ORDER_TRANSITION_IDEMPOTENT[kind] || []).some((phrase) => text.includes(phrase));
};

/** Internal next-activity returns an array of Activity objects. */
const normalizeNextActivity = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) {
    const first = payload.find((item) => item && typeof item === "object");
    return first || null;
  }
  if (Array.isArray(payload?.activities)) {
    return payload.activities[0] || null;
  }
  return unwrapEntity(payload, ["activity", "next_activity"]);
};

const tryCandidates = async (candidates, method, path = "", payload) => {
  let lastError;
  for (const candidate of candidates) {
    try {
      const endpoint = `/${candidate}${path}`;
      const response = await apiClient.request({ method, url: endpoint, data: payload });
      return response.data;
    } catch (error) {
      lastError = error;
      if (!shouldTryNextCandidate(error)) {
        throw error;
      }
    }
  }
  throw lastError;
};

const tryCandidatesQuery = async (candidates, method, path = "", payload, params = {}) => {
  let lastError;
  for (const candidate of candidates) {
    try {
      const endpoint = `/${candidate}${path}`;
      const response = await apiClient.request({ method, url: endpoint, data: payload, params });
      return response.data;
    } catch (error) {
      lastError = error;
      if (!shouldTryNextCandidate(error)) {
        throw error;
      }
    }
  }
  throw lastError;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const tryCandidatesMutate = async (candidates, path = "", payload) => {
  let lastError;
  for (const candidate of candidates) {
    for (const method of ["patch", "put"]) {
      try {
        const response = await apiClient.request({
          method,
          url: `/${candidate}${path}`,
          data: payload,
        });
        return response.data;
      } catch (error) {
        lastError = error;
        if (!shouldTryNextCandidate(error)) {
          throw error;
        }
      }
    }
  }
  throw lastError;
};

/** Try legacy /telematics/action then canonical /telematics/{id}/action. */
async function tryTelematicAction(method, telematicId, suffixPath, body = {}, params = {}) {
  const payload = {
    ...body,
    telematic: telematicId,
    telematic_uuid: telematicId,
  };
  const query = {
    ...params,
    telematic: telematicId,
    telematic_uuid: telematicId,
  };
  const paths = [suffixPath, `/${telematicId}${suffixPath}`];
  let lastError;
  for (const path of paths) {
    try {
      if (method === "get") {
        return await tryCandidatesQuery(RESOURCES.telematics, method, path, undefined, query);
      }
      return await tryCandidates(RESOURCES.telematics, method, path, payload);
    } catch (error) {
      lastError = error;
      if (!shouldTryNextTelematicPath(error)) {
        throw error;
      }
    }
  }
  throw lastError;
}

function shouldTryNextTelematicPath(error) {
  if (shouldTryNextCandidate(error)) return true;
  const status = error?.response?.status;
  if (status !== 400) return false;
  const msg = getApiErrorText(error).toLowerCase();
  return msg.includes("nothing to see") || msg.includes("telematic id is required");
}

/**
 * Internal order workflow transitions use PATCH /orders/{dispatch|cancel} with { order: id }.
 * Avoids retry storms (405/permission noise) from legacy fallback URLs.
 */
const tryOrderTransition = async (orderId, kind) => {
  const id = String(orderId);
  const path = kind === "dispatch" ? "/orders/dispatch" : "/orders/cancel";

  try {
    const response = await apiClient.patch(path, { order: id });
    return response.data;
  } catch (error) {
    if (isIdempotentOrderTransitionError(kind, error)) {
      return {
        status: "OK",
        message: kind === "dispatch" ? "Order was already dispatched" : "Order was already canceled",
        order: id,
      };
    }
    throw error;
  }
};

export const fleetopsService = {
  async listOrders(params = {}) {
    const { rows } = await this.listOrdersPage(params);
    return rows;
  },

  async listOrdersPage(params = {}) {
    try {
      const response = await apiClient.get("/orders", { params, loading: false });
      return unwrapListPage(response.data, ["orders"]);
    } catch {
      const payload = await tryCandidates(RESOURCES.orders, "get", "", undefined);
      const page = unwrapListPage(payload, ["orders"]);
      if (!params.page && !params.limit) return page;
      const start = (Math.max(1, Number(params.page) || 1) - 1) * (Number(params.limit) || 25);
      const slice = page.rows.slice(start, start + (Number(params.limit) || 25));
      return {
        rows: slice,
        meta: {
          total: page.rows.length,
          page: Number(params.page) || 1,
          perPage: Number(params.limit) || 25,
          lastPage: Math.max(1, Math.ceil(page.rows.length / (Number(params.limit) || 25))),
        },
      };
    }
  },

  async scheduleOrder(orderId, { scheduledAt, driverId, date, time, timezone } = {}) {
    const id = String(orderId);
    const body = {
      order: id,
      order_uuid: id,
      scheduled_at: scheduledAt,
      driver_id: driverId,
      date,
      time,
      timezone,
    };
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.patch(`/${candidate}/schedule`, body);
        const payload = response.data || {};
        return {
          ...unwrapEntity(payload, ["order"]),
          order_uuid: payload.order || id,
          scheduled_at: payload.scheduled_at || scheduledAt,
        };
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async bulkScheduleOrders(orderIds, scheduleOptions = {}) {
    const ids = (orderIds || []).map(String).filter(Boolean);
    const successful = [];
    const failed = [];
    const results = [];
    for (const id of ids) {
      try {
        const res = await this.scheduleOrder(id, scheduleOptions);
        successful.push(id);
        results.push({
          id,
          scheduledAt: res?.scheduled_at || scheduleOptions.scheduledAt,
        });
      } catch (error) {
        failed.push({ id, error });
      }
    }
    return { successful, failed, results, scheduledAt: scheduleOptions.scheduledAt };
  },

  async searchOrders(query, params = {}) {
    const q = String(query || "").trim();
    if (!q) return [];
    try {
      const response = await apiClient.get("/orders/search", {
        params: { query: q, ...params },
        loading: false,
      });
      return unwrapList(response.data, ["orders"]);
    } catch {
      const payload = await tryCandidates(RESOURCES.orders, "get", "/search", { query: q, ...params });
      return unwrapList(payload, ["orders"]);
    }
  },

  async listOrderTypes() {
    try {
      const response = await apiClient.get("/orders/types", { loading: false });
      const payload = response.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.types)) return payload.types;
      return unwrapList(payload, ["types"]);
    } catch {
      try {
        const payload = await tryCandidates(RESOURCES.orders, "get", "/types");
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.types)) return payload.types;
        return unwrapList(payload, ["types"]);
      } catch {
        return [];
      }
    }
  },

  async optimizeOrderRoute(orderId) {
    const id = String(orderId);
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.post(`/${candidate}/${id}/optimize`, {});
        return unwrapEntity(response.data, ["order"]);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },
  async getOrder(orderId, params = {}) {
    const withParam = params.with ?? "driverAssigned,vehicleAssigned";
    const queryParams = {
      ...params,
      with: Array.isArray(withParam) ? withParam.join(",") : withParam,
    };
    const payload = await tryCandidatesQuery(RESOURCES.orders, "get", `/${orderId}`, undefined, queryParams);
    return unwrapEntity(payload, ["order"]);
  },
  async createOrder(formValues, options) {
    const data = buildOrderPayload(formValues, options);
    const payload = await tryCandidates(RESOURCES.orders, "post", "", data);
    return unwrapEntity(payload, ["order"]);
  },
  async updateOrder(orderId, formValues, options) {
    const data = options?.partial ? formValues : buildOrderPayload(formValues, options);
    const payload = await tryCandidatesMutate(RESOURCES.orders, `/${orderId}`, data);
    return unwrapEntity(payload, ["order"]);
  },

  async patchOrder(orderId, patch) {
    const body = patch?.order != null ? patch : { order: patch };
    const payload = await tryCandidatesMutate(RESOURCES.orders, `/${orderId}`, body);
    return unwrapEntity(payload, ["order"]);
  },
  async deleteOrder(orderId) {
    await tryCandidates(RESOURCES.orders, "delete", `/${orderId}`);
  },
  async dispatchOrder(orderId) {
    const payload = await tryOrderTransition(orderId, "dispatch");
    return unwrapEntity(payload, ["order"]);
  },
  async cancelOrder(orderId) {
    const payload = await tryOrderTransition(orderId, "cancel");
    if (payload == null || (typeof payload === "object" && Object.keys(payload).length === 0)) {
      return null;
    }
    return unwrapEntity(payload, ["order"]);
  },

  async startOrder(orderId) {
    const id = String(orderId);
    try {
      const response = await apiClient.patch("/orders/start", { order: id });
      return unwrapEntity(response.data, ["order"]);
    } catch (error) {
      if (isIdempotentOrderTransitionError("start", error)) {
        return { status: "OK", message: "Order was already started", order: id };
      }
      throw error;
    }
  },

  async completeOrder(orderId) {
    const id = String(orderId);
    let lastError;
    for (const candidate of RESOURCES.orders) {
      for (const method of ["patch", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/${id}/complete`,
            data: {},
          });
          return unwrapEntity(response.data, ["order"]);
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError;
  },

  async getNextActivity(orderId) {
    const id = String(orderId);
    try {
      const response = await apiClient.get(`/orders/next-activity/${id}`);
      return normalizeNextActivity(response.data);
    } catch {
      return null;
    }
  },

  async updateOrderActivity(orderId, activityPayload) {
    const id = String(orderId);
    const body =
      typeof activityPayload === "string"
        ? { activity: activityPayload, code: activityPayload }
        : activityPayload;
    const response = await apiClient.patch(`/orders/update-activity/${id}`, body);
    return unwrapEntity(response.data, ["order", "activity"]);
  },

  async getOrderEta(orderId) {
    const id = String(orderId);
    try {
      const payload = await tryCandidates(RESOURCES.orders, "get", `/${id}/eta`);
      return unwrapEntity(payload, ["eta", "data"]);
    } catch {
      return null;
    }
  },

  async getOrderTracker(orderId) {
    const id = String(orderId);
    try {
      const payload = await tryCandidates(RESOURCES.orders, "get", `/${id}/tracker`);
      return unwrapEntity(payload, ["tracker", "data"]);
    } catch {
      return null;
    }
  },

  async listOrderComments(orderId) {
    const id = String(orderId);
    try {
      const payload = await tryCandidates(RESOURCES.orders, "get", `/${id}/comments`);
      return unwrapList(payload, ["comments"]);
    } catch {
      return [];
    }
  },

  async createOrderComment(orderId, content) {
    const id = String(orderId);
    const bodies = [
      { comment: { content, subject_uuid: id, subject_type: "order" } },
      { content, subject_uuid: id, subject_type: "order" },
      { comment: { content } },
      { content },
    ];
    let lastError;
    for (const body of bodies) {
      try {
        const response = await apiClient.post(`/orders/${id}/comments`, body);
        return unwrapEntity(response.data, ["comment"]);
      } catch (error) {
        lastError = error;
      }
      try {
        const response = await apiClient.post("/comments", body);
        return unwrapEntity(response.data, ["comment"]);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  _wrapOrderConfigBody(values) {
    const payload = buildOrderConfigPayload(values);
    // FleetOps OrderConfigController validates $request->input('orderConfig').
    return { orderConfig: payload };
  },

  async getOrderConfig(configId) {
    const id = String(configId);
    const payload = await tryCandidates(RESOURCES.orderConfigs, "get", `/${id}`);
    return unwrapEntity(payload, ["order_config", "orderConfig", "orderconfig"]);
  },

  async createOrderConfig(values) {
    const body = this._wrapOrderConfigBody(values);
    const payload = await tryCandidates(RESOURCES.orderConfigs, "post", "", body);
    return unwrapEntity(payload, ["order_config", "orderConfig", "orderconfig"]);
  },

  async updateOrderConfig(configId, values) {
    const id = String(configId);
    const body = this._wrapOrderConfigBody(values);
    const payload = await tryCandidatesMutate(RESOURCES.orderConfigs, `/${id}`, body);
    return unwrapEntity(payload, ["order_config", "orderConfig", "orderconfig"]);
  },

  async deleteOrderConfig(configId) {
    const id = String(configId);
    await tryCandidates(RESOURCES.orderConfigs, "delete", `/${id}`);
  },

  async duplicateOrderConfig(configId) {
    const existing = await this.getOrderConfig(configId);
    const base = existing?.name || existing?.key || "config";
    const key = `${existing?.key || base}_${Date.now()}`.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    return this.createOrderConfig({
      name: `${base} (copy)`,
      key,
      description: existing?.description,
      type: existing?.type,
      flow: existing?.flow,
      meta: existing?.meta,
      enabled: true,
    });
  },

  async getDefaultOrderConfig() {
    try {
      const response = await apiClient.get("/order-configs", {
        params: { limit: 1, sort: "created_at" },
        loading: false,
      });
      const list = unwrapList(response.data, ["order_configs", "orderConfigs", "order-configs"]);
      if (list[0]) return list[0];
    } catch {
      /* fall through */
    }
    const list = await this.listOrderConfigs();
    return list[0] || null;
  },

  async listActivities(params = {}) {
    try {
      const response = await apiClient.get("/activities", { params, loading: false });
      return unwrapList(response.data, ["activities"]);
    } catch {
      return [];
    }
  },

  async listOrderConfigs(params) {
    try {
      const payload = await tryCandidates(RESOURCES.orderConfigs, "get", "", undefined);
      return unwrapList(payload, ["order_configs", "orderConfigs", "order-configs"]);
    } catch {
      return [];
    }
  },

  async getOrderStatuses(params = {}) {
    const query = {
      include_order_config_activities: false,
      ...params,
    };
    try {
      const response = await apiClient.get("/orders/statuses", { params: query, loading: false });
      const raw = response.data;
      if (Array.isArray(raw)) return raw.filter(Boolean);
      return unwrapList(raw, ["statuses", "data"]);
    } catch {
      try {
        const payload = await tryCandidates(RESOURCES.orders, "get", "/statuses", undefined);
        if (Array.isArray(payload)) return payload.filter(Boolean);
        return unwrapList(payload, ["statuses", "data"]);
      } catch {
        return [];
      }
    }
  },

  _orderIdsBody(orderIds) {
    const ids = (orderIds || []).map((id) => String(id)).filter(Boolean);
    return { ids };
  },

  async bulkDispatch(orderIds) {
    const body = this._orderIdsBody(orderIds);
    const response = await apiClient.post("/orders/bulk-dispatch", body);
    return response.data;
  },

  async bulkCancel(orderIds) {
    const body = this._orderIdsBody(orderIds);
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.patch(`/${candidate}/bulk-cancel`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async bulkAssignDriver(orderIds, driverId) {
    const body = { ...this._orderIdsBody(orderIds), driver: String(driverId) };
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.patch(`/${candidate}/bulk-assign-driver`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async bulkDeleteOrders(orderIds) {
    const body = this._orderIdsBody(orderIds);
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.delete(`/${candidate}/bulk-delete`, { data: body });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async assignDriverToOrder(orderId, { driverId, vehicleId } = {}) {
    const patch = {};
    if (driverId) patch.driver_assigned_uuid = driverId;
    if (vehicleId) patch.vehicle_assigned_uuid = vehicleId;
    return this.patchOrder(orderId, patch);
  },

  async unassignDriverFromOrder(orderId) {
    return this.patchOrder(orderId, {
      driver_assigned_uuid: null,
      vehicle_assigned_uuid: null,
    });
  },

  async saveOrderRoute(orderId, routePayload) {
    const id = String(orderId);
    const body = routePayload?.pickup || routePayload?.dropoff ? routePayload : { route: routePayload };
    let lastError;
    for (const candidate of RESOURCES.orders) {
      for (const method of ["patch", "put"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/route/${id}`,
            data: body,
          });
          return unwrapEntity(response.data, ["order", "route"]);
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError;
  },

  async getOrderLabel(orderId, format = "base64") {
    const id = String(orderId);
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.get(`/${candidate}/label/${id}`, {
          params: { format },
          loading: false,
        });
        const payload = response.data;
        if (typeof payload === "string") return payload;
        return payload?.data || payload?.label || payload?.pdf || payload;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async exportOrders(params = {}) {
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.get(`/${candidate}/export`, {
          params,
          responseType: "blob",
          loading: false,
        });
        return response.data;
      } catch (error) {
        lastError = error;
      }
      try {
        const response = await apiClient.post(`/${candidate}/export`, params, {
          responseType: "blob",
          loading: false,
        });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async importOrdersFromFiles(fileUuids, options = {}) {
    const body = {
      files: fileUuids,
      country: options.country,
      disk: options.disk,
    };
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.post(`/${candidate}/process-imports`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async listDrivers(params = {}) {
    try {
      const response = await apiClient.get("/drivers", { params, loading: false });
      return unwrapList(response.data, ["drivers"]);
    } catch {
      const payload = await tryCandidatesQuery(RESOURCES.drivers, "get", "", undefined, params);
      return unwrapList(payload, ["drivers"]);
    }
  },
  async getDriver(driverId, params = {}) {
    const payload = await tryCandidatesQuery(RESOURCES.drivers, "get", `/${driverId}`, undefined, params);
    return unwrapEntity(payload, ["driver"]);
  },
  async createDriver(formValues) {
    const payload = await tryCandidates(RESOURCES.drivers, "post", "", buildDriverPayload(formValues));
    return unwrapEntity(payload, ["driver"]);
  },
  async updateDriver(driverId, formValues) {
    const payload = await tryCandidatesMutate(RESOURCES.drivers, `/${driverId}`, buildDriverPayload(formValues));
    return unwrapEntity(payload, ["driver"]);
  },
  async deleteDriver(driverId) {
    await tryCandidates(RESOURCES.drivers, "delete", `/${driverId}`);
  },

  async listDriverScheduleItems(driverId) {
    try {
      const payload = await tryCandidates(RESOURCES.drivers, "get", `/${driverId}/schedule-items`);
      return unwrapList(payload, ["schedule_items", "scheduleItems"]);
    } catch {
      return [];
    }
  },

  async listDriverAvailabilities(driverId) {
    try {
      const payload = await tryCandidates(RESOURCES.drivers, "get", `/${driverId}/availabilities`);
      return unwrapList(payload, ["availabilities"]);
    } catch {
      return [];
    }
  },

  async getDriverHosStatus(driverId) {
    try {
      const payload = await tryCandidates(RESOURCES.drivers, "get", `/${driverId}/hos-status`);
      return payload?.hos_status || payload?.status || payload;
    } catch {
      return null;
    }
  },

  async getDriverActiveShift(driverId) {
    try {
      const payload = await tryCandidates(RESOURCES.drivers, "get", `/${driverId}/active-shift`);
      return unwrapEntity(payload, ["shift", "schedule_item", "active_shift"]);
    } catch {
      return null;
    }
  },

  async createDriverAvailability(driverId, body = {}) {
    const payload = await tryCandidatesMutate(RESOURCES.drivers, `/${driverId}/availabilities`, body);
    return unwrapEntity(payload, ["availability"]);
  },

  async assignDriverToFleet(fleetId, driverId) {
    const body = { fleet: String(fleetId), driver: String(driverId) };
    const response = await apiClient.post("/fleets/assign-driver", body);
    return response.data;
  },

  async removeDriverFromFleet(fleetId, driverId) {
    const body = { fleet: String(fleetId), driver: String(driverId) };
    const response = await apiClient.post("/fleets/remove-driver", body);
    return response.data;
  },

  async assignVehicleToFleet(fleetId, vehicleId) {
    const body = { fleet: String(fleetId), vehicle: String(vehicleId) };
    const response = await apiClient.post("/fleets/assign-vehicle", body);
    return response.data;
  },

  async removeVehicleFromFleet(fleetId, vehicleId) {
    const body = { fleet: String(fleetId), vehicle: String(vehicleId) };
    const response = await apiClient.post("/fleets/remove-vehicle", body);
    return response.data;
  },

  async assignDriverToVendor(vendorId, driverId) {
    const response = await apiClient.post(`/vendors/${vendorId}/assign-driver`, { driver: String(driverId) });
    return response.data;
  },

  async removeDriverFromVendor(vendorId, driverId) {
    const response = await apiClient.post(`/vendors/${vendorId}/remove-driver`, { driver: String(driverId) });
    return response.data;
  },

  async geocodeQuery(params = {}) {
    const response = await apiClient.get("/geocoder/query", { params, loading: false });
    return response.data;
  },

  async geocodeReverse(params = {}) {
    const response = await apiClient.get("/geocoder/reverse", { params, loading: false });
    return response.data;
  },

  async lookupPlace(query, params = {}) {
    const response = await apiClient.get("/places/lookup", {
      params: { query, ...params },
      loading: false,
    });
    return response.data;
  },

  async resetCustomerCredentials(customerId, body = {}) {
    const response = await apiClient.post("/customers/reset-credentials", {
      customer: String(customerId),
      customer_uuid: String(customerId),
      ...body,
    });
    return response.data;
  },

  async listIntegratedVendorProviders() {
    try {
      const response = await apiClient.get("/integrated-vendors/supported", { loading: false });
      return unwrapList(response.data, ["providers", "integrated_vendors"]);
    } catch {
      try {
        const rows = await fleetopsService.listIntegratedVendor();
        return [...new Set(rows.map((r) => r.provider || r.name).filter(Boolean))];
      } catch {
        return [];
      }
    }
  },

  async getPlaceMeta(placeId) {
    const place = await this.getPlace(placeId);
    return place?.meta || {};
  },

  async updatePlaceMeta(placeId, metaPatch) {
    const place = await this.getPlace(placeId);
    const meta = { ...(place?.meta || {}), ...metaPatch };
    return this.updatePlace(placeId, { meta });
  },

  async listVehicles(params = {}) {
    try {
      const response = await apiClient.get("/vehicles", { params, loading: false });
      return unwrapList(response.data, ["vehicles"]);
    } catch {
      const payload = await tryCandidatesQuery(RESOURCES.vehicles, "get", "", undefined, params);
      return unwrapList(payload, ["vehicles"]);
    }
  },
  async getVehicle(vehicleId, params = {}) {
    const payload = await tryCandidatesQuery(RESOURCES.vehicles, "get", `/${vehicleId}`, undefined, params);
    return unwrapEntity(payload, ["vehicle"]);
  },
  async createVehicle(formValues) {
    const payload = await tryCandidates(RESOURCES.vehicles, "post", "", buildVehiclePayload(formValues));
    return unwrapEntity(payload, ["vehicle"]);
  },
  async updateVehicle(vehicleId, formValues) {
    const payload = await tryCandidatesMutate(RESOURCES.vehicles, `/${vehicleId}`, buildVehiclePayload(formValues));
    return unwrapEntity(payload, ["vehicle"]);
  },
  async deleteVehicle(vehicleId) {
    await tryCandidates(RESOURCES.vehicles, "delete", `/${vehicleId}`);
  },

  async listPlaces(params) {
    const payload = await tryCandidates(RESOURCES.places, "get", "", undefined);
    return unwrapList(payload, ["places"]);
  },
  async getPlace(placeId) {
    const payload = await tryCandidates(RESOURCES.places, "get", `/${placeId}`);
    return unwrapEntity(payload, ["place"]);
  },
  async createPlace(formValues) {
    const payload = await tryCandidates(RESOURCES.places, "post", "", buildPlacePayload(formValues));
    return unwrapEntity(payload, ["place"]);
  },
  async updatePlace(placeId, formValues) {
    const payload = await tryCandidatesMutate(RESOURCES.places, `/${placeId}`, buildPlacePayload(formValues));
    return unwrapEntity(payload, ["place"]);
  },
  async deletePlace(placeId) {
    await tryCandidates(RESOURCES.places, "delete", `/${placeId}`);
  },

  async listFleets(params = {}) {
    const payload = await tryCandidatesQuery(RESOURCES.fleets, "get", "", undefined, params);
    return unwrapList(payload, ["fleets"]);
  },
  async getFleet(fleetId, params = {}) {
    const payload = await tryCandidatesQuery(RESOURCES.fleets, "get", `/${fleetId}`, undefined, params);
    return unwrapEntity(payload, ["fleet"]);
  },
  async createFleet(formValues) {
    const payload = await tryCandidates(RESOURCES.fleets, "post", "", buildFleetPayload(formValues));
    return unwrapEntity(payload, ["fleet"]);
  },
  async updateFleet(fleetId, formValues) {
    const payload = await tryCandidatesMutate(RESOURCES.fleets, `/${fleetId}`, buildFleetPayload(formValues));
    return unwrapEntity(payload, ["fleet"]);
  },
  async deleteFleet(fleetId) {
    await tryCandidates(RESOURCES.fleets, "delete", `/${fleetId}`);
  },

  async duplicateFleet(fleetApi) {
    const source = fleetApi || {};
    const mapped = {
      name: `${source.name || "Fleet"} (copy)`,
      task: source.task,
      color: source.color,
      status: source.status || "active",
      serviceAreaId: source.service_area_uuid || source.service_area?.uuid,
      zoneId: source.zone_uuid || source.zone?.uuid,
      vendorId: source.vendor_uuid || source.vendor?.uuid,
      parentFleetId: source.parent_fleet_uuid || source.parent_fleet?.uuid,
    };
    return this.createFleet(mapped);
  },

  async listContacts(params = {}) {
    return fleetopsService.listContact(params);
  },

  async listVendors(params = {}) {
    return fleetopsService.listVendor(params);
  },

  async queryCustomers(params = {}) {
    const payload = await tryCandidatesQuery(["query/customers", ...RESOURCES.customers], "get", "", undefined, {
      limit: 500,
      ...params,
    });
    const direct = unwrapList(payload, ["customers", "data"]);
    if (direct.length) return direct;
    if (payload?.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
      return unwrapList(payload.data, ["customers", "data"]);
    }
    return [];
  },

  async queryFacilitators(params = {}) {
    const payload = await tryCandidatesQuery(["query/facilitators", "facilitators"], "get", "", undefined, {
      limit: 500,
      ...params,
    });
    return unwrapList(payload, ["facilitators"]);
  },

  async attachDeviceToVehicle(vehicleId, deviceId) {
    const attachFields = {
      attachable_uuid: vehicleId,
      attachable_type: FLEETOPS_MORPH.vehicle,
    };
    const body = { device: attachFields, ...attachFields };
    return tryCandidatesMutate(RESOURCES.devices, `/${deviceId}`, body);
  },

  async detachDeviceFromVehicle(vehicleId, deviceId) {
    const clearFields = { attachable_uuid: null, attachable_type: null };
    const body = { device: clearFields, ...clearFields };
    return tryCandidatesMutate(RESOURCES.devices, `/${deviceId}`, body);
  },

  async listVehicleDevices(vehicleId) {
    try {
      const payload = await tryCandidates(RESOURCES.vehicles, "get", `/${vehicleId}/devices`);
      return unwrapList(payload, ["devices"]);
    } catch {
      const all = await fleetopsService.listDevice();
      const needle = String(vehicleId || "");
      return all.filter((d) => String(deviceVehicleId(d) || "") === needle);
    }
  },

  async listVehicleWorkOrders(vehicleId) {
    const all = await fleetopsService.listWorkOrder();
    const id = String(vehicleId || "");
    return all.filter((wo) => {
      const candidates = [
        wo.vehicle_uuid,
        wo.vehicle_id,
        wo.target_uuid,
        wo.target?.uuid,
        wo.target?.id,
        wo.target?.public_id,
      ].map((v) => String(v || ""));
      return candidates.some((v) => v && v === id);
    });
  },

  async updateIssueStatus(issueId, status) {
    return fleetopsService.updateIssue(issueId, { status });
  },

  async updateWorkOrderStatus(workOrderId, status) {
    return fleetopsService.updateWorkOrder(workOrderId, { status });
  },

  async assignOrderToDriver(driverId, orderId) {
    return fleetopsService.assignDriverToOrder(orderId, { driverId });
  },

  async assignVehicleToDriver(driverId, vehicleId) {
    return fleetopsService.updateDriver(driverId, { vehicleId });
  },

  async assignVendorToDriver(driverId, vendorId) {
    return fleetopsService.assignVendorToDriverViaVendor(vendorId, driverId);
  },

  async assignVendorToDriverViaVendor(vendorId, driverId) {
    return fleetopsService.assignDriverToVendor(vendorId, driverId);
  },

  async listServiceAreas() {
    try {
      const payload = await tryCandidates(RESOURCES.serviceAreas, "get", "", undefined);
      const rows = unwrapList(payload, ["service_areas", "serviceAreas"]);
      if (rows.length) return rows;
    } catch {
      /* fallback */
    }
    const store = readDay3Store();
    return store.serviceAreas || [];
  },

  async listServiceArea() {
    return this.listServiceAreas();
  },

  async getServiceArea(id) {
    try {
      const payload = await tryCandidates(RESOURCES.serviceAreas, "get", `/${id}`);
      const row = unwrapEntity(payload, ["service_area", "serviceArea"]);
      if (row) return row;
    } catch {
      /* fallback */
    }
    const store = readDay3Store();
    return (store.serviceAreas || []).find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async createServiceArea(values = {}) {
    try {
      const payload = await tryCandidates(RESOURCES.serviceAreas, "post", "", { service_area: values, ...values });
      return unwrapEntity(payload, ["service_area", "serviceArea"]);
    } catch {
      const store = readDay3Store();
      const row = { uuid: `sa-${Date.now()}`, status: "active", ...values };
      const serviceAreas = [...(store.serviceAreas || []), row];
      writeDay3Store({ ...store, serviceAreas });
      return row;
    }
  },

  async updateServiceArea(id, values = {}) {
    try {
      const payload = await tryCandidatesMutate(RESOURCES.serviceAreas, `/${id}`, { service_area: values, ...values });
      return unwrapEntity(payload, ["service_area", "serviceArea"]);
    } catch {
      const store = readDay3Store();
      const serviceAreas = (store.serviceAreas || []).map((row) =>
        String(row.uuid || row.id) === String(id) ? { ...row, ...values } : row,
      );
      writeDay3Store({ ...store, serviceAreas });
      return serviceAreas.find((row) => String(row.uuid || row.id) === String(id)) || null;
    }
  },

  async deleteServiceArea(id) {
    try {
      await tryCandidates(RESOURCES.serviceAreas, "delete", `/${id}`);
      return;
    } catch {
      const store = readDay3Store();
      const serviceAreas = (store.serviceAreas || []).filter((row) => String(row.uuid || row.id) !== String(id));
      writeDay3Store({ ...store, serviceAreas });
    }
  },

  async createScheduleItem(formValues) {
    const { schedulesService } = await import("@/services/schedules");
    return schedulesService.createScheduleItem(buildScheduleItemPayload(formValues));
  },

  async listRoutes(params = {}) {
    try {
      const query = { with: "order", ...params };
      const payload = await tryCandidatesQuery(RESOURCES.routes, "get", "", undefined, query);
      return unwrapList(payload, ["routes"]);
    } catch {
      return [];
    }
  },

  async getRoute(routeId, params = {}) {
    const query = { with: "order", ...params };
    const payload = await tryCandidatesQuery(RESOURCES.routes, "get", `/${routeId}`, undefined, query);
    return unwrapEntity(payload, ["route"]);
  },

  async createRoute(body = {}) {
    const payload = await tryCandidates(RESOURCES.routes, "post", "", { route: body });
    return unwrapEntity(payload, ["route"]);
  },

  async optimizeRoutes(body = {}) {
    const { resolveOrderIdsFromRoute } = await import("@/lib/fleetops/routing/resolveOrderIdsFromRoute");

    let orderIds = (body.orders || body.order_ids || body.order_uuids || []).filter(Boolean).map(String);

    if (!orderIds.length && body.route) {
      orderIds = resolveOrderIdsFromRoute(body.route);
    }

    if (!orderIds.length && body.route_uuid) {
      const route = await this.getRoute(body.route_uuid);
      orderIds = resolveOrderIdsFromRoute(route);
    }

    if (!orderIds.length) {
      throw new Error("No orders linked to this route. Link an order or re-plan from Orders.");
    }

    return this.runOrchestrator({
      mode: body.mode || "optimize_routes",
      order_ids: orderIds,
      options: { engine: body.engine || "greedy", ...body.options },
      prior_assignments: body.prior_assignments,
    });
  },

  async updateRoute(routeId, body = {}) {
    const payload = await tryCandidatesMutate(RESOURCES.routes, `/${routeId}`, { route: body, ...body });
    return unwrapEntity(payload, ["route"]);
  },

  async deleteRoute(routeId) {
    await tryCandidates(RESOURCES.routes, "delete", `/${routeId}`);
  },

  async getRoutingSettings() {
    try {
      const payload = await tryCandidates(RESOURCES.settingsRouting, "get", "", undefined);
      return payload?.routing || payload?.settings || payload || {};
    } catch {
      return {};
    }
  },

  async listOrchestratorOrders(params = {}) {
    const response = await apiClient.get("/fleet-ops/orchestrator/orders", { params, loading: false });
    return unwrapList(response.data, ["orders"]);
  },

  async getOrchestratorEngines() {
    const response = await apiClient.get("/fleet-ops/orchestrator/engines", { loading: false });
    const data = response.data;
    if (Array.isArray(data?.engines)) return data.engines;
    if (Array.isArray(data)) return data;
    return [];
  },

  async getOrchestratorOrderConfigFields() {
    const response = await apiClient.get("/fleet-ops/orchestrator/order-config-fields", { loading: false });
    return response.data?.order_configs || response.data?.configs || unwrapList(response.data, ["order_configs", "configs"]);
  },

  async runOrchestrator(body = {}) {
    const response = await apiClient.post("/fleet-ops/orchestrator/run", body, { loading: false });
    return response.data;
  },

  async runOrchestratorPreview(body = {}) {
    const response = await apiClient.get("/fleet-ops/orchestrator/preview", { params: body, loading: false }).catch(async () => {
      const post = await apiClient.post("/fleet-ops/orchestrator/run", body, { loading: false });
      return post;
    });
    return response.data;
  },

  async runOrchestratorCommit(body = {}) {
    const response = await apiClient.post("/fleet-ops/orchestrator/commit", body, { loading: false });
    return response.data;
  },

  async importOrchestratorOrders(body = {}) {
    const response = await apiClient.post("/fleet-ops/orchestrator/import-orders", body, { loading: false });
    return response.data;
  },

  async validateOrchestratorPoolOrders(orderIds = []) {
    const ids = [...new Set((orderIds || []).map((id) => String(id).trim()).filter(Boolean))];
    const results = [];

    for (const id of ids) {
      try {
        const order = await this.getOrder(id, {
          with: "payload,payload.pickup,payload.dropoff,payload.waypoints,trackingNumber,trackingStatuses",
        });
        const reason = orchestratorOrderEligibility(order);
        results.push(reason ? { id: order.public_id || id, ok: false, reason } : { id: order.public_id || id, ok: true });
      } catch {
        results.push({ id, ok: false, reason: "Order not found." });
      }
    }

    return results;
  },

  async listServiceRates(params = {}) {
    try {
      const payload = await tryCandidates(RESOURCES.serviceRates, "get", "", undefined);
      return unwrapList(payload, ["service_rates", "serviceRates"]);
    } catch {
      return [];
    }
  },

  async getServiceRate(id) {
    const payload = await tryCandidates(RESOURCES.serviceRates, "get", `/${id}`);
    return unwrapEntity(payload, ["service_rate", "serviceRate"]);
  },

  async createServiceRate(values) {
    const payload = await tryCandidates(RESOURCES.serviceRates, "post", "", {
      service_rate: buildServiceRateApiPayload(values),
    });
    return unwrapEntity(payload, ["service_rate", "serviceRate"]);
  },

  async updateServiceRate(id, values) {
    const payload = await tryCandidatesMutate(RESOURCES.serviceRates, `/${id}`, {
      service_rate: buildServiceRateApiPayload(values),
    });
    return unwrapEntity(payload, ["service_rate", "serviceRate"]);
  },

  async deleteServiceRate(id) {
    await tryCandidates(RESOURCES.serviceRates, "delete", `/${id}`);
  },

  /** Legacy client-side fallback when orchestrator best-fit is unavailable. */
  suggestBestDriver(drivers = [], order = {}) {
    const active = drivers.filter((d) =>
      ["online", "active", "on_duty", "available"].includes(String(d.status || "").toLowerCase()),
    );
    if (!active.length) return null;
    const drop = order?.dropoff || order?.payload?.dropoff;
    if (!drop?.lat || !drop?.lng) return active[0];
    let best = active[0];
    let bestDist = Infinity;
    for (const d of active) {
      const lat = d.location?.lat ?? d.latitude;
      const lng = d.location?.lng ?? d.longitude;
      if (lat == null || lng == null) continue;
      const dist = (Number(lat) - Number(drop.lat)) ** 2 + (Number(lng) - Number(drop.lng)) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = d;
      }
    }
    return best;
  },

  async listServiceAreaZones(serviceAreaId) {
    try {
      const payload = await tryCandidatesQuery(RESOURCES.zones, "get", "", undefined, {
        service_area: serviceAreaId,
        service_area_id: serviceAreaId,
      });
      const rows = unwrapList(payload, ["zones", "service_area_zones"]);
      if (rows.length || serviceAreaId) return rows;
    } catch {
      /* fallback */
    }
    const store = readDay3Store();
    const zones = store.serviceAreaZones || [];
    if (!serviceAreaId) return zones;
    return zones.filter((zone) => String(zone.service_area_uuid || zone.serviceAreaId) === String(serviceAreaId));
  },

  async listZone() {
    try {
      const payload = await tryCandidates(RESOURCES.zones, "get", "", undefined);
      return unwrapList(payload, ["zones"]);
    } catch {
      return [];
    }
  },

  async createServiceAreaZone(values = {}) {
    const zone = { ...values };
    if (values.border != null) {
      zone.border = toZoneBorderGeoJson(values.border);
    } else {
      delete zone.border;
    }
    try {
      const payload = await tryCandidates(RESOURCES.zones, "post", "", { zone, ...zone });
      return unwrapEntity(payload, ["zone"]);
    } catch {
      const store = readDay3Store();
      const row = { uuid: `saz-${Date.now()}`, status: "active", ...values };
      const serviceAreaZones = [...(store.serviceAreaZones || []), row];
      writeDay3Store({ ...store, serviceAreaZones });
      return row;
    }
  },

  async updateServiceAreaZone(id, values = {}) {
    const zone = { ...values };
    if (values.border != null) {
      zone.border = toZoneBorderGeoJson(values.border);
    } else {
      delete zone.border;
    }
    try {
      const payload = await tryCandidatesMutate(RESOURCES.zones, `/${id}`, { zone, ...zone });
      return unwrapEntity(payload, ["zone"]);
    } catch {
      const store = readDay3Store();
      const serviceAreaZones = (store.serviceAreaZones || []).map((row) =>
        String(row.uuid || row.id) === String(id) ? { ...row, ...values } : row,
      );
      writeDay3Store({ ...store, serviceAreaZones });
      return serviceAreaZones.find((row) => String(row.uuid || row.id) === String(id)) || null;
    }
  },

  async deleteServiceAreaZone(id) {
    try {
      await tryCandidates(RESOURCES.zones, "delete", `/${id}`);
    } catch {
      const store = readDay3Store();
      const serviceAreaZones = (store.serviceAreaZones || []).filter((row) => String(row.uuid || row.id) !== String(id));
      writeDay3Store({ ...store, serviceAreaZones });
    }
  },

  async getServiceAreaZone(id) {
    try {
      const payload = await tryCandidates(RESOURCES.zones, "get", `/${id}`);
      return unwrapEntity(payload, ["zone"]);
    } catch {
      const store = readDay3Store();
      return (store.serviceAreaZones || []).find((row) => String(row.uuid || row.id) === String(id)) || null;
    }
  },

  async getServiceAreaGeometry(id) {
    const area = await this.getServiceArea(id);
    return area?.border || area?.geometry || area?.polygon || null;
  },

  async saveServiceAreaGeometry(id, geometry) {
    const border = geometry ? toMultiPolygonGeoJson(geometry) : null;
    const body = { service_area: { border }, border };
    const payload = await tryCandidatesMutate(RESOURCES.serviceAreas, `/${id}`, body);
    return unwrapEntity(payload, ["service_area", "serviceArea"]);
  },

  async deleteServiceAreaGeometry(id) {
    await this.saveServiceAreaGeometry(id, null);
  },

  async listSettingsSection(sectionKey) {
    const loader = FLEETOPS_SETTINGS_LOADERS[sectionKey];
    const strict = sectionKey === "notifications";
    if (loader) {
      try {
        return await loader();
      } catch (err) {
        if (strict || import.meta.env.PROD) throw err;
      }
    }
    const store = readDay3Store();
    return store.settings?.[sectionKey] || {};
  },

  async saveSettingsSection(sectionKey, values = {}) {
    const saver = FLEETOPS_SETTINGS_SAVERS[sectionKey];
    const strict = sectionKey === "notifications";
    if (saver) {
      try {
        const saved = await saver(values);
        const store = readDay3Store();
        writeDay3Store({ ...store, settings: { ...(store.settings || {}), [sectionKey]: saved || values } });
        return saved || values;
      } catch (err) {
        if (strict || import.meta.env.PROD) throw err;
      }
    }
    const store = readDay3Store();
    const settings = { ...(store.settings || {}), [sectionKey]: values };
    writeDay3Store({ ...store, settings });
    return values;
  },

  async getNotificationSettings() {
    const response = await apiClient.get("/fleet-ops/settings/notification-settings", { loading: false });
    const data = response.data ?? {};
    return data.notificationSettings && typeof data.notificationSettings === "object"
      ? data.notificationSettings
      : {};
  },

  async saveNotificationSettings(notificationSettings) {
    const response = await apiClient.post("/fleet-ops/settings/notification-settings", {
      notificationSettings,
    });
    const data = response.data ?? {};
    if (data.status && data.status !== "ok") {
      const err = new Error(data.message || "Failed to save notification settings");
      err.friendlyMessage = err.message;
      throw err;
    }
    return notificationSettings;
  },

  async getFleetOpsMetrics() {
    const response = await apiClient.get("/fleet-ops/metrics/", { loading: false });
    return response.data?.metrics || response.data || {};
  },

  /** Bounded snapshot for Command Center — avoids unbounded list scans on dashboard boot. */
  async loadDashboardSnapshot({ ordersLimit = 100, driversLimit = 200 } = {}) {
    const [orders, drivers, metrics] = await Promise.all([
      this.listOrders({ limit: ordersLimit }).catch(() => []),
      this.listDrivers({ limit: driversLimit }).catch(() => []),
      this.getFleetOpsMetrics().catch(() => null),
    ]);
    return { orders, drivers, metrics };
  },

  async getTenantBranding() {
    try {
      const response = await apiClient.get("/settings/branding", { loading: false, silent: true });
      const brand = response.data?.brand || response.data?.branding;
      if (!brand || typeof brand !== "object") return null;
      const mapped = {
        logoUrl: brand.logo_url || brand.logoUrl || "",
        iconUrl: brand.icon_url || brand.iconUrl || "",
        defaultTheme: brand.default_theme || brand.defaultTheme,
        primaryColor: brand.primary_color || brand.primaryColor,
        accentColor: brand.accent_color || brand.accentColor,
        productName: brand.product_name || brand.productName,
      };
      return Object.fromEntries(Object.entries(mapped).filter(([, v]) => v != null && v !== ""));
    } catch {
      return null;
    }
  },

  async saveTenantBranding(values = {}) {
    try {
      const response = await apiClient.post(
        "/settings/branding",
        {
          brand: {
            logo_uuid: values.logoUuid || values.logo_uuid,
            icon_uuid: values.iconUuid || values.icon_uuid,
            default_theme: values.defaultTheme || values.default_theme,
          },
        },
        { loading: false, silent: true },
      );
      const brand = response.data?.brand;
      if (brand && typeof brand === "object") {
        return {
          ...values,
          logoUrl: brand.logo_url || values.logoUrl,
          iconUrl: brand.icon_url || values.iconUrl,
          defaultTheme: brand.default_theme || values.defaultTheme,
        };
      }
      return values;
    } catch {
      return values;
    }
  },

  async listPositions(params = {}) {
    try {
      const payload = await tryCandidatesQuery(RESOURCES.positions, "get", "", undefined, params);
      return unwrapList(payload, ["positions"]);
    } catch {
      try {
        const response = await apiClient.get("/fleet-ops/positions", { params, loading: false });
        return unwrapList(response.data, ["positions"]);
      } catch {
        return [];
      }
    }
  },

  async replayPositions(body = {}) {
    const response = await apiClient.post("/fleet-ops/positions/replay", body);
    return response.data || {};
  },

  async getNotificationRegistry() {
    const response = await apiClient.get("/fleet-ops/settings/notification-registry", { loading: false });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.registry)) return data.registry;
    return [];
  },

  async getNotificationNotifiables() {
    const response = await apiClient.get("/fleet-ops/settings/notification-notifiables", { loading: false });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.notifiables)) return data.notifiables;
    return [];
  },

  async getOrchestratorCardFields() {
    const response = await apiClient.get("/fleet-ops/settings/orchestrator-card-fields", { loading: false });
    return response.data || {};
  },

  async saveOrchestratorCardFields(values = {}) {
    const response = await apiClient.post("/fleet-ops/settings/orchestrator-card-fields", values);
    return response.data || values;
  },

  async getNavigatorLinkApp() {
    const response = await apiClient.get("/fleet-ops/navigator/get-link-app", { loading: false });
    return response.data || {};
  },

  async hasStripeConnectAccount() {
    const response = await apiClient.get("/fleet-ops/payments/has-stripe-connect-account", { loading: false });
    return Boolean(response.data?.has_account ?? response.data?.connected);
  },

  async getStripeAccountSession() {
    const response = await apiClient.post("/fleet-ops/payments/stripe-account-session", {});
    return response.data || {};
  },

  async listGeofenceEvents(params = {}) {
    const response = await apiClient.get("/geofences/events", { params, loading: false });
    return unwrapList(response.data, ["events", "geofence_events"]);
  },

  async listGeofenceInventory(params = {}) {
    const response = await apiClient.get("/geofences/inventory", { params, loading: false });
    return unwrapList(response.data, ["inventory", "items"]);
  },

  async getGeofenceDwellReport(params = {}) {
    const response = await apiClient.get("/geofences/dwell-report", { params, loading: false });
    return response.data || {};
  },

  async getGeofenceDriverHistory(driverUuid, params = {}) {
    const response = await apiClient.get(`/geofences/driver/${driverUuid}/history`, { params, loading: false });
    return unwrapList(response.data, ["history", "events"]);
  },

  async listCustomFieldGroups() {
    const payload = await tryCandidatesQuery(RESOURCES.categories, "get", "", undefined, {
      for: "custom_field_group",
      limit: 200,
    });
    const rows = unwrapList(payload, ["categories"]);
    return rows
      .filter((row) => String(row?.for || "").toLowerCase() === "custom_field_group")
      .map(mapCustomFieldGroupRow);
  },

  async createCustomFieldGroup(values = {}) {
    const body = buildCustomFieldGroupPayload(values);
    const payload = await tryCandidates(RESOURCES.categories, "post", "", body);
    return mapCustomFieldGroupRow(unwrapEntity(payload, ["category"]));
  },

  async listCustomFieldsForEntity(entityType) {
    const type = normalizeEntityFor(entityType);
    if (!type) return [];

    try {
      const payload = await tryCandidatesQuery(RESOURCES.customFields, "get", "", undefined, {
        for: type,
        limit: 200,
      });
      const rows = unwrapList(payload, ["custom_fields", "customFields"]);
      if (rows.length) return rows;
    } catch {
      /* filter full list below */
    }

    const all = await this.listCustomField();
    return all.filter((field) => customFieldMatchesEntity(field, type));
  },

  async getReport(id) {
    const reports = await this.listReports();
    return reports.find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async listReports() {
    const store = readDay3Store();
    if (Array.isArray(store.reports) && store.reports.length > 0) return store.reports;
    const seed = [
      { uuid: "ops-health", name: "Ops health", status: "ready", description: "Operational summary for live fleet." },
      { uuid: "driver-utilization", name: "Driver utilization", status: "ready", description: "Driver engagement trends." }
    ];
    writeDay3Store({ ...store, reports: seed });
    return seed;
  },

  async runReport(id, filters = {}) {
    const rows = [
      { metric: "active_orders", value: 12 },
      { metric: "active_drivers", value: 8 },
      { metric: "active_vehicles", value: 10 },
      { metric: "active_routes", value: 6 },
    ];
    if (filters?.q) {
      return { rows: rows.filter((row) => String(row.metric).includes(String(filters.q))) };
    }
    return { rows };
  },

  async lookupTrackingOrder(trackingNumber) {
    const number = String(trackingNumber || "").trim();
    if (!number) return null;

    const response = await apiClient.get("/fleet-ops/lookup", {
      params: { tracking: number },
      loading: false,
      silent: true,
    });
    return unwrapEntity(response.data, ["order"]);
  },

  // --- Phase 4: Service rates ---
  async exportServiceRates(params = {}) {
    let lastError;
    for (const candidate of RESOURCES.serviceRates) {
      for (const method of ["get", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/export`,
            params: method === "get" ? params : undefined,
            data: method === "post" ? params : undefined,
            responseType: "blob",
            loading: false,
          });
          return response.data;
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError;
  },

  async getServiceRatesForRoute(routeId, params = {}) {
    const query = { route: routeId, route_id: routeId, ...params };
    const payload = await tryCandidatesQuery(RESOURCES.serviceRates, "get", "/for-route", undefined, query);
    return unwrapList(payload, ["service_rates", "serviceRates", "rates"]);
  },

  async bulkDeleteServiceRates(ids = []) {
    await tryCandidates(RESOURCES.serviceRates, "delete", "/bulk-delete", { ids, uuids: ids });
  },

  // --- Phase 4: Telematics ---
  async listTelematicProviders() {
    try {
      const payload = await tryCandidates(RESOURCES.telematics, "get", "/providers");
      return unwrapList(payload, ["providers"]);
    } catch {
      return [];
    }
  },

  async listTelematicLinkedDevices(telematicId, params = {}) {
    const id = telematicId || params.telematic || params.telematic_id || params.telematic_uuid;
    if (!id) return [];
    const resolvedId = (await resolveTelematicReference(id)) || (isUuid(id) ? id : null);
    if (resolvedId) {
      try {
        const payload = await tryCandidatesQuery(RESOURCES.telematics, "get", `/${resolvedId}/devices`);
        const fromApi = unwrapList(payload, ["data", "devices"]);
        if (fromApi.length) return fromApi;
      } catch {
        // fall through to client-side filter
      }
    }
    try {
      const all = await fleetopsService.listDevice();
      return all.filter((device) => recordMatchesTelematic(device, resolvedId || id));
    } catch {
      return [];
    }
  },

  async discoverTelematic(id, body = {}) {
    const telematicId = id || body.telematic || body.telematic_uuid;
    if (!telematicId) {
      throw new Error("Telematic id is required to discover devices");
    }
    return tryTelematicAction("post", telematicId, "/discover", body);
  },

  async linkTelematicDevice(telematicId, body = {}) {
    const id = telematicId || body.telematic || body.telematic_uuid;
    if (!id) {
      throw new Error("Telematic id is required to link a device");
    }
    const externalId = body.external_id ?? body.device_id ?? body.device;
    const deviceName = body.device_name ?? body.name ?? externalId;
    return tryTelematicAction("post", id, "/link-device", {
      external_id: externalId,
      device_name: deviceName,
      ...body,
    });
  },

  async testTelematicConnection(id, body = {}) {
    return tryTelematicAction("post", id, "/test-connection", body);
  },

  async testTelematicCredentials(key, body = {}) {
    const response = await tryCandidates(RESOURCES.telematics, "post", `/${key}/test-credentials`, body);
    return response;
  },

  // --- Phase 4: Live tracking ---
  async getLiveCoordinates(params = {}) {
    const response = await apiClient.get("/fleet-ops/live/coordinates", { params, loading: false });
    return unwrapList(response.data, ["coordinates", "data"]);
  },

  async getLiveDrivers(params = {}) {
    const response = await apiClient.get("/fleet-ops/live/drivers", { params, loading: false });
    return unwrapList(response.data, ["drivers", "data"]);
  },

  async getLiveVehicles(params = {}, options = {}) {
    const response = await apiClient.get("/fleet-ops/live/vehicles", { params, loading: false });
    const vehicles = unwrapList(response.data, ["vehicles", "data"]);
    const driversPromise =
      options.drivers != null
        ? Promise.resolve(options.drivers)
        : apiClient
            .get("/fleet-ops/live/drivers", { params, loading: false })
            .then((r) => unwrapList(r.data, ["drivers", "data"]))
            .catch(() => []);
    const [devices, drivers] = await Promise.all([getCachedDevices(), driversPromise]);
    return enrichLiveVehicles(vehicles, { devices, drivers });
  },

  async getLiveOrders(params = {}) {
    const response = await apiClient.get("/fleet-ops/live/orders", { params, loading: false });
    return unwrapList(response.data, ["orders", "data"]);
  },

  async getLiveRoutes(params = {}) {
    const response = await apiClient.get("/fleet-ops/live/routes", { params, loading: false });
    return unwrapList(response.data, ["routes", "data"]);
  },

  async getLivePlaces(params = {}) {
    const response = await apiClient.get("/fleet-ops/live/places", { params, loading: false });
    return unwrapList(response.data, ["places", "data"]);
  },

  // --- Phase 4: Maintenance schedules ---
  async pauseMaintenanceSchedule(id) {
    return tryCandidates(RESOURCES.maintenanceSchedules, "post", `/${id}/pause`, {});
  },

  async resumeMaintenanceSchedule(id) {
    return tryCandidates(RESOURCES.maintenanceSchedules, "post", `/${id}/resume`, {});
  },

  async triggerMaintenanceSchedule(id) {
    return tryCandidates(RESOURCES.maintenanceSchedules, "post", `/${id}/trigger`, {});
  },

  async getMaintenanceScheduleIcal(id) {
    const response = await tryCandidatesQuery(
      RESOURCES.maintenanceSchedules,
      "get",
      `/${id}/ical`,
      undefined,
      {},
    );
    return response;
  },

  async getMaintenanceCalendarFeed(params = {}) {
    const response = await tryCandidatesQuery(
      RESOURCES.maintenanceSchedules,
      "get",
      "/calendar-feed",
      undefined,
      params,
    );
    return response;
  },

  // --- Phase 4: Maintenance line-items ---
  async addMaintenanceLineItem(maintenanceId, body = {}) {
    return tryCandidates(RESOURCES.maintenances, "post", `/${maintenanceId}/line-items`, body);
  },

  async updateMaintenanceLineItem(maintenanceId, index, body = {}) {
    return tryCandidatesMutate(RESOURCES.maintenances, `/${maintenanceId}/line-items/${index}`, body);
  },

  async removeMaintenanceLineItem(maintenanceId, index) {
    return tryCandidates(RESOURCES.maintenances, "delete", `/${maintenanceId}/line-items/${index}`);
  },

  // --- Phase 4: Work orders ---
  async sendWorkOrderEmail(workOrderId, body = {}) {
    return tryCandidates(RESOURCES.workOrders, "post", `/${workOrderId}/send`, body);
  },

  // --- Phase 4: Vehicle-devices admin ---
  async listVehicleDevicesAdmin(params = {}) {
    try {
      const payload = await tryCandidatesQuery(RESOURCES.vehicleDevices, "get", "", undefined, params);
      const rows = unwrapList(payload, ["vehicle_devices", "vehicleDevices"]);
      if (rows.length) return rows;
    } catch {
      // fall through
    }
    try {
      const devices = await fleetopsService.listDevice();
      return devices
        .filter((d) => isDeviceAttachedToVehicle(d))
        .map((d) => ({
          uuid: d.uuid || d.id,
          vehicle_uuid: deviceVehicleId(d),
          device_uuid: d.uuid || d.id,
        }));
    } catch {
      return [];
    }
  },

  // --- Phase 4: Generic import/export ---
  async exportResource(entityKey, params = {}) {
    const candidates = CRUD_IMPORT_EXPORT_RESOURCES[entityKey];
    if (!candidates) throw new Error(`Export not configured for ${entityKey}`);
    let lastError;
    for (const candidate of candidates) {
      for (const method of ["get", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/export`,
            params: method === "get" ? params : undefined,
            data: method === "post" ? params : undefined,
            responseType: "blob",
            loading: false,
          });
          return response.data;
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError;
  },

  async importResource(entityKey, fileOrUuid, options = {}) {
    const candidates = CRUD_IMPORT_EXPORT_RESOURCES[entityKey];
    if (!candidates) throw new Error(`Import not configured for ${entityKey}`);

    let fileUuids = [];
    if (typeof fileOrUuid === "string") {
      fileUuids = [fileOrUuid];
    } else if (Array.isArray(fileOrUuid)) {
      fileUuids = fileOrUuid.filter(Boolean);
    } else if (typeof File !== "undefined" && fileOrUuid instanceof File) {
      const uploaded = await filesService.upload(fileOrUuid);
      const uuid = uploaded?.id || uploaded?.uuid;
      if (!uuid) throw new Error("Upload did not return a file id.");
      fileUuids = [uuid];
    } else if (fileOrUuid?.uuid || fileOrUuid?.id) {
      fileUuids = [fileOrUuid.uuid || fileOrUuid.id];
    } else {
      throw new Error("Import requires a CSV or Excel file.");
    }

    const body = { files: fileUuids, ...options };
    let lastError;
    for (const candidate of candidates) {
      try {
        const response = await apiClient.post(`/${candidate}/import`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async bulkDeleteResource(entityKey, ids = []) {
    const candidates = CRUD_IMPORT_EXPORT_RESOURCES[entityKey];
    if (!candidates) throw new Error(`Bulk delete not configured for ${entityKey}`);
    const body = { ids, uuids: ids };
    let lastError;
    for (const candidate of candidates) {
      try {
        const response = await apiClient.delete(`/${candidate}/bulk-delete`, { data: body });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  downloadExportBlob: downloadBlob,

  // --- Phase 4: Reports (local store + API fallback) ---
  async createReport(values = {}) {
    const store = readDay3Store();
    const row = {
      uuid: `report-${Date.now()}`,
      status: "draft",
      query: {},
      columns: ["metric", "value"],
      ...values,
    };
    const reports = [...(store.reports || []), row];
    writeDay3Store({ ...store, reports });
    return row;
  },

  async updateReport(id, values = {}) {
    const store = readDay3Store();
    const reports = (store.reports || []).map((row) =>
      String(row.uuid || row.id) === String(id) ? { ...row, ...values } : row,
    );
    writeDay3Store({ ...store, reports });
    return reports.find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async deleteReport(id) {
    const store = readDay3Store();
    const reports = (store.reports || []).filter((row) => String(row.uuid || row.id) !== String(id));
    writeDay3Store({ ...store, reports });
  },

  async listManifests(params = {}) {
    const response = await apiClient.get("/fleet-ops/manifests", { params, loading: false });
    return unwrapList(response.data, ["manifests"]);
  },

  async getManifest(id) {
    const response = await apiClient.get(`/fleet-ops/manifests/${id}`, { loading: false });
    return unwrapEntity(response.data, ["manifest"]);
  },

  async cancelManifest(id) {
    const response = await apiClient.post(`/fleet-ops/manifests/${id}/cancel`, {});
    return response.data || {};
  },

  async deleteManifest(id) {
    await apiClient.delete(`/fleet-ops/manifests/${id}`);
  },

  async getManifestStop(id) {
    const response = await apiClient.get(`/fleet-ops/manifest-stops/${id}`, { loading: false });
    return unwrapEntity(response.data, ["manifest_stop", "stop"]);
  },

  async updateManifestStop(id, values = {}) {
    const response = await apiClient.patch(`/fleet-ops/manifest-stops/${id}`, { manifest_stop: values, ...values });
    return unwrapEntity(response.data, ["manifest_stop", "stop"]);
  },

  async exportReport(id, params = {}) {
    const result = await this.runReport(id, params);
    const rows = result?.rows || [];
    const csv = [
      Object.keys(rows[0] || { metric: "", value: "" }).join(","),
      ...rows.map((r) => Object.values(r).join(",")),
    ].join("\n");
    return new Blob([csv], { type: "text/csv" });
  },
};

attachGenericCrud(fleetopsService, "vendor", RESOURCES.vendors, "vendor", ["vendors"]);
attachGenericCrud(fleetopsService, "integratedVendor", RESOURCES.integratedVendors, "integrated_vendor", [
  "integrated_vendors",
  "integratedVendors",
]);
attachGenericCrud(fleetopsService, "contact", RESOURCES.contacts, "contact", ["contacts"]);
attachGenericCrud(fleetopsService, "customer", RESOURCES.customers, "customer", ["customers"]);

fleetopsService.listContact = async (params = {}) => {
  const payload = await tryCandidatesQuery(RESOURCES.contacts, "get", "", undefined, params);
  return unwrapList(payload, ["contacts"]);
};

fleetopsService.listCustomer = async (params = {}) => {
  try {
    const rows = await fleetopsService.queryCustomers(params);
    if (rows.length) return rows;
  } catch {
    /* fallback to contacts filter */
  }
  const contacts = await fleetopsService.listContact({ type: "customer", limit: 500, ...params });
  return contacts.filter((row) => String(row?.type || "").toLowerCase() === "customer");
};

fleetopsService.getCustomer = (id) => fleetopsService.getContact(id);

fleetopsService.createCustomer = async (formValues = {}) => {
  const contact = { ...formValues, type: "customer" };
  const body = { contact, ...contact };
  const payload = await tryCandidates(RESOURCES.contacts, "post", "", body);
  return unwrapEntity(payload, ["contact", "customer"]);
};

fleetopsService.updateCustomer = async (id, formValues = {}) => {
  const contact = { ...formValues, type: formValues.type || "customer" };
  const body = { contact, ...contact };
  const payload = await tryCandidatesMutate(RESOURCES.contacts, `/${id}`, body);
  return unwrapEntity(payload, ["contact", "customer"]);
};

fleetopsService.deleteCustomer = (id) => fleetopsService.deleteContact(id);

fleetopsService.listServiceQuote = async (params = {}) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.serviceQuotes, "get", "", undefined, params);
    if (Array.isArray(payload)) return payload;
    return unwrapList(payload, ["service_quotes", "serviceQuotes"]);
  } catch {
    return [];
  }
};

fleetopsService.queryServiceQuotes = async (params = {}) => {
  if (!params?.payload && !params?.pickup) return [];
  return fleetopsService.listServiceQuote(params);
};

fleetopsService.getServiceQuote = async (id) => {
  const payload = await tryCandidates(RESOURCES.serviceQuotes, "get", `/${id}`);
  return unwrapEntity(payload, ["service_quote", "serviceQuote"]);
};

attachGenericCrud(fleetopsService, "fuelReport", RESOURCES.fuelReports, "fuel_report", ["fuel_reports", "fuelReports"]);
attachGenericCrud(fleetopsService, "issue", RESOURCES.issues, "issue", ["issues"]);
attachGenericCrud(fleetopsService, "device", RESOURCES.devices, "device", ["devices"]);
attachGenericCrud(fleetopsService, "sensor", RESOURCES.sensors, "sensor", ["sensors"]);
attachGenericCrud(fleetopsService, "telematic", RESOURCES.telematics, "telematic", ["telematics"]);
attachGenericCrud(fleetopsService, "deviceEvent", RESOURCES.deviceEvents, "device_event", [
  "device_events",
  "deviceEvents",
]);
attachGenericCrud(fleetopsService, "maintenanceSchedule", RESOURCES.maintenanceSchedules, "maintenance_schedule", [
  "maintenance_schedules",
  "maintenanceSchedules",
]);
attachGenericCrud(fleetopsService, "maintenance", RESOURCES.maintenances, "maintenance", ["maintenances"]);
attachGenericCrud(fleetopsService, "workOrder", RESOURCES.workOrders, "work_order", ["work_orders", "workOrders"]);
attachGenericCrud(fleetopsService, "equipment", RESOURCES.equipment, "equipment", ["equipment", "equipments"]);
attachGenericCrud(fleetopsService, "part", RESOURCES.parts, "part", ["parts"]);
attachGenericCrud(fleetopsService, "warranty", RESOURCES.warranties, "warranty", ["warranties"]);
attachGenericCrud(fleetopsService, "payload", RESOURCES.payloads, "payload", ["payloads"]);
fleetopsService.listPayload = async (params = {}) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.payloads, "get", "", undefined, {
      with: "pickup,dropoff",
      limit: 500,
      ...params,
    });
    return unwrapList(payload, ["payloads"]);
  } catch {
    return [];
  }
};
attachGenericCrud(fleetopsService, "entity", RESOURCES.entities, "entity", ["entities"]);
const genericGetEntity = fleetopsService.getEntity.bind(fleetopsService);
fleetopsService.getEntity = async (id) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.entities, "get", `/${id}`, undefined, {
      with: "payload",
    });
    return unwrapEntity(payload, ["entity"]);
  } catch {
    return genericGetEntity(id);
  }
};
attachGenericCrud(fleetopsService, "proof", RESOURCES.proofs, "proof", ["proofs"]);
const genericGetProof = fleetopsService.getProof.bind(fleetopsService);
fleetopsService.getProof = async (id) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.proofs, "get", `/${id}`, undefined, {
      with: "order,file,subject",
    });
    return unwrapEntity(payload, ["proof"]);
  } catch {
    return genericGetProof(id);
  }
};
fleetopsService.listProof = async (params = {}) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.proofs, "get", "", undefined, {
      with: "order,file,subject",
      limit: 500,
      ...params,
    });
    return unwrapList(payload, ["proofs"]);
  } catch {
    return [];
  }
};
attachGenericCrud(fleetopsService, "purchaseRate", RESOURCES.purchaseRates, "purchase_rate", [
  "purchase_rates",
  "purchaseRates",
]);
const genericGetPurchaseRate = fleetopsService.getPurchaseRate.bind(fleetopsService);
fleetopsService.getPurchaseRate = async (id) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.purchaseRates, "get", `/${id}`, undefined, {
      with: "serviceQuote,payload,order,customer",
    });
    return unwrapEntity(payload, ["purchase_rate", "purchaseRate"]);
  } catch {
    return genericGetPurchaseRate(id);
  }
};
fleetopsService.listPurchaseRate = async (params = {}) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.purchaseRates, "get", "", undefined, {
      with: "serviceQuote,payload,order,customer",
      limit: 500,
      ...params,
    });
    return unwrapList(payload, ["purchase_rates", "purchaseRates"]);
  } catch {
    return [];
  }
};
attachGenericCrud(fleetopsService, "trackingNumber", RESOURCES.trackingNumbers, "tracking_number", [
  "tracking_numbers",
  "trackingNumbers",
]);
const genericGetTrackingNumber = fleetopsService.getTrackingNumber.bind(fleetopsService);
fleetopsService.getTrackingNumber = async (id) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.trackingNumbers, "get", `/${id}`, undefined, {
      with: "owner",
    });
    return unwrapEntity(payload, ["tracking_number", "trackingNumber"]);
  } catch {
    return genericGetTrackingNumber(id);
  }
};
fleetopsService.listTrackingNumber = async (params = {}) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.trackingNumbers, "get", "", undefined, {
      with: "owner",
      limit: 500,
      ...params,
    });
    return unwrapList(payload, ["tracking_numbers", "trackingNumbers"]);
  } catch {
    return [];
  }
};
attachGenericCrud(fleetopsService, "trackingStatus", RESOURCES.trackingStatuses, "tracking_status", [
  "tracking_statuses",
  "trackingStatuses",
]);
const genericGetTrackingStatus = fleetopsService.getTrackingStatus.bind(fleetopsService);
fleetopsService.getTrackingStatus = async (id) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.trackingStatuses, "get", `/${id}`, undefined, {
      with: "trackingNumber",
    });
    return unwrapEntity(payload, ["tracking_status", "trackingStatus"]);
  } catch {
    return genericGetTrackingStatus(id);
  }
};
fleetopsService.listTrackingStatus = async (params = {}) => {
  try {
    const payload = await tryCandidatesQuery(RESOURCES.trackingStatuses, "get", "", undefined, {
      with: "trackingNumber",
      limit: 500,
      ...params,
    });
    return unwrapList(payload, ["tracking_statuses", "trackingStatuses"]);
  } catch {
    return [];
  }
};
attachGenericCrud(fleetopsService, "customField", RESOURCES.customFields, "custom_field", [
  "custom_fields",
  "customFields",
]);

fleetopsService.createCustomField = async (formValues = {}) => {
  const org = orgStorage.get();
  const companyUuid = org?.uuid || org?.id;
  const values = buildCustomFieldApiPayload(formValues, { companyUuid });
  const body = { custom_field: values, ...values };
  const payload = await tryCandidates(RESOURCES.customFields, "post", "", body);
  return unwrapEntity(payload, ["custom_field", "customField"]);
};

fleetopsService.updateCustomField = async (id, formValues = {}) => {
  const org = orgStorage.get();
  const companyUuid = org?.uuid || org?.id;
  const values = buildCustomFieldApiPayload(formValues, { companyUuid });
  const body = { custom_field: values, ...values };
  const payload = await tryCandidatesMutate(RESOURCES.customFields, `/${id}`, body);
  return unwrapEntity(payload, ["custom_field", "customField"]);
};

fleetopsService.listCustomField = async (params = {}) => {
  const payload = await tryCandidatesQuery(RESOURCES.customFields, "get", "", undefined, params);
  return unwrapList(payload, ["custom_fields", "customFields"]);
};

function wrapCrudPayload(entityKey, values) {
  const payloadKey = toPayloadKey(entityKey);
  return { [payloadKey]: values, ...values };
}

async function resolveTelematicReference(ref) {
  const needle = String(ref || "").trim();
  if (!needle) return null;
  if (isUuid(needle)) return needle;
  const rows = await fleetopsService.listTelematic();
  const match = rows.find((row) => row.uuid === needle || row.public_id === needle);
  return match?.uuid || null;
}

async function resolveDeviceReference(ref) {
  const needle = String(ref || "").trim();
  if (!needle) return null;
  if (isUuid(needle)) return needle;
  const rows = await fleetopsService.listDevice();
  const match = rows.find((row) => row.uuid === needle || row.public_id === needle);
  return match?.uuid || null;
}

async function resolvePlaceUuid(ref) {
  const needle = String(ref ?? "").trim();
  if (!needle) return undefined;
  const rows = await fleetopsService.listPlaces({ limit: 500 });
  const match = rows.find(
    (r) =>
      String(r.uuid || r.id) === needle ||
      String(r.public_id || r.publicId) === needle,
  );
  if (match?.uuid) return String(match.uuid);
  if (isUuid(needle)) return needle;
  return undefined;
}

async function resolvePayloadUuid(ref) {
  const needle = String(ref ?? "").trim();
  if (!needle) return undefined;
  const rows = await fleetopsService.listPayload();
  const match = rows.find(
    (r) =>
      String(r.uuid || r.id) === needle ||
      String(r.public_id || r.publicId) === needle,
  );
  if (match?.uuid) return String(match.uuid);
  if (isUuid(needle)) return needle;
  return undefined;
}

async function buildResolvedPayloadPayload(values = {}) {
  const [pickup_uuid, dropoff_uuid] = await Promise.all([
    values.pickup ? resolvePlaceUuid(values.pickup) : undefined,
    values.dropoff ? resolvePlaceUuid(values.dropoff) : undefined,
  ]);
  return buildPayloadApiPayload({ ...values, pickup_uuid, dropoff_uuid });
}

async function buildResolvedEntityPayload(values = {}) {
  const payload_uuid = values.payload
    ? await resolvePayloadUuid(values.payload)
    : values.payload_uuid;
  return buildEntityApiPayload({ ...values, payload_uuid });
}

const TRACKING_NUMBER_OWNER_TYPES = {
  order: "Fleetbase\\FleetOps\\Models\\Order",
  entity: "Fleetbase\\FleetOps\\Models\\Entity",
};

async function resolveOwnerReference(ref) {
  const needle = String(ref ?? "").trim();
  if (!needle) return {};
  const [orders, entities] = await Promise.all([
    fleetopsService.listOrders({ limit: 500 }).catch(() => []),
    fleetopsService.listEntity().catch(() => []),
  ]);
  const matchId = (row) =>
    [row?.public_id, row?.publicId, row?.uuid, row?.id].filter(Boolean).map(String).includes(needle);
  const order = orders.find(matchId);
  if (order?.uuid) {
    return {
      owner_uuid: String(order.uuid),
      owner_type: TRACKING_NUMBER_OWNER_TYPES.order,
      owner: order.public_id || order.publicId || needle,
    };
  }
  const entity = entities.find(matchId);
  if (entity?.uuid) {
    return {
      owner_uuid: String(entity.uuid),
      owner_type: TRACKING_NUMBER_OWNER_TYPES.entity,
      owner: entity.public_id || entity.publicId || needle,
    };
  }
  return { owner: needle };
}

async function buildResolvedTrackingNumberPayload(values = {}) {
  const ownerRef = await resolveOwnerReference(values.owner);
  return buildTrackingNumberApiPayload({ ...values, ...ownerRef });
}

async function resolveTrackingNumberUuid(ref) {
  const needle = String(ref ?? "").trim();
  if (!needle) return undefined;
  const rows = await fleetopsService.listTrackingNumber();
  const matchId = (row) =>
    [row?.public_id, row?.publicId, row?.tracking_number, row?.uuid, row?.id]
      .filter(Boolean)
      .map(String)
      .includes(needle);
  const match = rows.find(matchId);
  if (match?.uuid) return String(match.uuid);
  if (isUuid(needle)) return needle;
  return undefined;
}

async function buildResolvedTrackingStatusPayload(values = {}) {
  let tracking_number_uuid = values.tracking_number
    ? await resolveTrackingNumberUuid(values.tracking_number)
    : values.tracking_number_uuid;

  if (!tracking_number_uuid && values.order) {
    const orders = await fleetopsService.listOrders({ limit: 500 }).catch(() => []);
    const needle = String(values.order).trim();
    const order = orders.find((row) =>
      [row?.public_id, row?.publicId, row?.uuid, row?.id].filter(Boolean).map(String).includes(needle),
    );
    tracking_number_uuid =
      order?.tracking_number_uuid ||
      order?.tracking_number?.uuid ||
      (order?.tracking_number ? await resolveTrackingNumberUuid(order.tracking_number) : undefined);
  }

  return buildTrackingStatusApiPayload({ ...values, tracking_number_uuid });
}

async function resolveServiceQuoteUuid(ref) {
  const needle = String(ref ?? "").trim();
  if (!needle) return undefined;
  if (isUuid(needle)) return needle;

  // Never call queryServiceQuotes here — that endpoint mints new quotes on each request.
  try {
    const row = await fleetopsService.getServiceQuote(needle);
    if (row?.uuid) return String(row.uuid);
  } catch {
    // fall through
  }

  return undefined;
}

async function buildResolvedPurchaseRatePayload(values = {}) {
  const quoteRef = values.service_quote;
  const service_quote_uuid = isUuid(quoteRef)
    ? String(quoteRef)
    : quoteRef
      ? await resolveServiceQuoteUuid(quoteRef)
      : values.service_quote_uuid;
  const service_quote_public_id =
    values.service_quote_public_id ||
    (!isUuid(quoteRef) && quoteRef ? String(quoteRef) : undefined);
  // Send the customer public_id (contact_/vendor_) and let the backend resolve
  // customer_uuid + customer_type from the correct table — guessing the morph
  // type on the client mislabels vendors as contacts and breaks the relation.
  return buildPurchaseRateApiPayload({
    ...values,
    service_quote_uuid,
    service_quote_public_id,
    service_quote: quoteRef,
  });
}

async function buildResolvedDevicePayload(values = {}, options = {}) {
  const ref = values.telematic ?? values.telematic_uuid ?? values.telematic_public_id;
  const refText = String(ref ?? "").trim();

  if (values.telematic_uuid === null || ("telematic" in values && refText === "")) {
    return buildDeviceApiPayload({ ...values, telematic: "", telematic_uuid: null }, options);
  }

  if (refText) {
    const telematic_uuid = (await resolveTelematicReference(refText)) || (isUuid(refText) ? refText : null);
    if (!telematic_uuid) {
      throw new Error(`Telematic not found: ${refText}`);
    }
    return buildDeviceApiPayload({ ...values, telematic_uuid }, options);
  }

  return buildDeviceApiPayload(values, options);
}

async function buildResolvedSensorPayload(values = {}, options = {}) {
  const ref = values.device ?? values.device_uuid ?? values.device_public_id;
  let device_uuid = values.device_uuid;
  if (ref) {
    device_uuid = (await resolveDeviceReference(ref)) || (isUuid(ref) ? ref : null);
    if (!device_uuid) {
      throw new Error(`Device not found: ${ref}`);
    }
  }
  return buildSensorApiPayload({ ...values, device_uuid }, options);
}

async function mutateCrud(entityKey, method, id, values) {
  const candidates = {
    device: RESOURCES.devices,
    sensor: RESOURCES.sensors,
    telematic: RESOURCES.telematics,
    entity: RESOURCES.entities,
    payload: RESOURCES.payloads,
    trackingNumber: RESOURCES.trackingNumbers,
    trackingStatus: RESOURCES.trackingStatuses,
    purchaseRate: RESOURCES.purchaseRates,
    warranty: RESOURCES.warranties,
  }[entityKey];
  if (!candidates) throw new Error(`No mutate handler for ${entityKey}`);
  const payloadKey = toPayloadKey(entityKey);
  const body = wrapCrudPayload(entityKey, values);
  if (method === "post") {
    const payload = await tryCandidates(candidates, "post", "", body);
    return unwrapEntity(payload, [payloadKey, entityKey]);
  }
  const payload = await tryCandidatesMutate(candidates, `/${id}`, body);
  return unwrapEntity(payload, [payloadKey, entityKey]);
}

fleetopsService.createDevice = async (values = {}) =>
  mutateCrud("device", "post", null, await buildResolvedDevicePayload(values, { forCreate: true }));
fleetopsService.updateDevice = async (id, values = {}) =>
  mutateCrud("device", "patch", id, await buildResolvedDevicePayload(values));

fleetopsService.createSensor = async (values = {}) =>
  mutateCrud("sensor", "post", null, await buildResolvedSensorPayload(values, { forCreate: true }));
fleetopsService.updateSensor = async (id, values = {}) =>
  mutateCrud("sensor", "patch", id, await buildResolvedSensorPayload(values));

fleetopsService.createTelematic = async (values = {}) =>
  mutateCrud("telematic", "post", null, buildTelematicApiPayload(values, { forCreate: true }));
fleetopsService.updateTelematic = async (id, values = {}) =>
  mutateCrud("telematic", "patch", id, buildTelematicApiPayload(values));

fleetopsService.createEntity = async (values = {}) =>
  mutateCrud("entity", "post", null, await buildResolvedEntityPayload(values));
fleetopsService.updateEntity = async (id, values = {}) =>
  mutateCrud("entity", "patch", id, await buildResolvedEntityPayload(values));

fleetopsService.createPayload = async (values = {}) =>
  mutateCrud("payload", "post", null, await buildResolvedPayloadPayload(values));
fleetopsService.updatePayload = async (id, values = {}) =>
  mutateCrud("payload", "patch", id, await buildResolvedPayloadPayload(values));

fleetopsService.createTrackingNumber = async (values = {}) =>
  mutateCrud("trackingNumber", "post", null, await buildResolvedTrackingNumberPayload(values));
fleetopsService.updateTrackingNumber = async (id, values = {}) =>
  mutateCrud("trackingNumber", "patch", id, await buildResolvedTrackingNumberPayload(values));

fleetopsService.createTrackingStatus = async (values = {}) =>
  mutateCrud("trackingStatus", "post", null, await buildResolvedTrackingStatusPayload(values));
fleetopsService.updateTrackingStatus = async (id, values = {}) =>
  mutateCrud("trackingStatus", "patch", id, await buildResolvedTrackingStatusPayload(values));

fleetopsService.createPurchaseRate = async (values = {}) =>
  mutateCrud("purchaseRate", "post", null, await buildResolvedPurchaseRatePayload(values));
fleetopsService.updatePurchaseRate = async (id, values = {}) =>
  mutateCrud("purchaseRate", "patch", id, await buildResolvedPurchaseRatePayload(values));

fleetopsService.createWarranty = async (values = {}) =>
  mutateCrud("warranty", "post", null, warrantyPayload(values));
fleetopsService.updateWarranty = async (id, values = {}) =>
  mutateCrud("warranty", "patch", id, warrantyPayload(values));
