import { apiClient, unwrapEntity, unwrapList, unwrapListPage } from "@/lib/api";
import {
  buildDriverPayload,
  buildFleetPayload,
  buildOrderPayload,
  buildPlacePayload,
  buildScheduleItemPayload,
  buildVehiclePayload,
} from "@/lib/fleetops/payloads";
import { buildOrderConfigPayload } from "@/lib/fleetops/orderConfig";

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
  serviceRates: ["service-rates", "service_rates"],
  routes: ["routes"],
  settingsNavigator: ["fleet-ops/settings/navigator", "settings/navigator"],
  settingsNotifications: ["fleet-ops/settings/notifications", "settings/notifications"],
  settingsRouting: ["fleet-ops/settings/routing", "settings/routing"],
  settingsOrchestrator: ["fleet-ops/settings/orchestrator", "settings/orchestrator"],
  settingsScheduling: ["fleet-ops/settings/scheduling", "settings/scheduling"],
  settingsBranding: ["fleet-ops/settings/branding", "settings/branding"],
  settingsAvatars: ["fleet-ops/settings/avatars", "settings/avatars"],
  customFields: ["custom-fields", "custom_fields"],
  reports: ["reports"],
};

const toPayloadKey = (entityKey) => entityKey.replace(/([A-Z])/g, "_$1").toLowerCase();
const DAY3_STORE_KEY = "fleetops_day3_store_v1";

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

const tryCandidates = async (candidates, method, path = "", payload) => {
  let lastError;
  for (const candidate of candidates) {
    try {
      const endpoint = `/${candidate}${path}`;
      const response = await apiClient.request({ method, url: endpoint, data: payload });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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
      }
    }
  }
  throw lastError;
};

const tryOrderTransition = async (orderId, kind) => {
  let lastError;
  const id = String(orderId);
  const bodyVariants =
    kind === "dispatch"
      ? [{ order_uuid: id, id, order: id }, { orders: [id] }]
      : [{ order_uuid: id, id, order: id }, { orders: [id] }];

  for (const candidate of RESOURCES.orders) {
    if (kind === "dispatch") {
      for (const body of bodyVariants) {
        for (const method of ["patch", "post"]) {
          try {
            const response = await apiClient.request({
              method,
              url: `/${candidate}/dispatch`,
              data: body,
            });
            return response.data;
          } catch (error) {
            lastError = error;
          }
        }
      }
      for (const method of ["patch", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/${id}/dispatch`,
            data: {},
          });
          return response.data;
        } catch (error) {
          lastError = error;
        }
      }
    } else {
      for (const method of ["delete"]) {
        try {
          const response = await apiClient.delete(`/${candidate}/${id}/cancel`);
          return response.data;
        } catch (error) {
          lastError = error;
        }
      }
      for (const body of bodyVariants) {
        for (const method of ["patch", "post"]) {
          try {
            const response = await apiClient.request({
              method,
              url: `/${candidate}/cancel`,
              data: body,
            });
            return response.data;
          } catch (error) {
            lastError = error;
          }
        }
      }
    }
  }
  throw lastError;
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
      for (const method of ["patch", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/${id}/schedule`,
            data: body,
          });
          return unwrapEntity(response.data, ["order"]);
        } catch (error) {
          lastError = error;
        }
      }
      try {
        const response = await apiClient.patch(`/${candidate}/schedule`, body);
        return unwrapEntity(response.data, ["order"]);
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
    for (const id of ids) {
      try {
        await this.scheduleOrder(id, scheduleOptions);
        successful.push(id);
      } catch (error) {
        failed.push({ id, error });
      }
    }
    return { successful, failed };
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
  async getOrder(orderId, params) {
    const payload = await tryCandidates(RESOURCES.orders, "get", `/${orderId}`, undefined);
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
    const payload = await tryCandidatesMutate(RESOURCES.orders, `/${orderId}`, patch);
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
    let lastError;
    for (const candidate of RESOURCES.orders) {
      for (const method of ["patch", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/${id}/start`,
            data: {},
          });
          return unwrapEntity(response.data, ["order"]);
        } catch (error) {
          lastError = error;
        }
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/start`,
            data: { order_uuid: id, id },
          });
          return unwrapEntity(response.data, ["order"]);
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError;
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
      const payload = await tryCandidates(RESOURCES.orders, "get", `/${id}/next-activity`);
      return unwrapEntity(payload, ["activity", "next_activity"]);
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
    let lastError;
    for (const candidate of RESOURCES.orders) {
      for (const method of ["patch", "post"]) {
        try {
          const response = await apiClient.request({
            method,
            url: `/${candidate}/${id}/update-activity`,
            data: body,
          });
          return unwrapEntity(response.data, ["order", "activity"]);
        } catch (error) {
          lastError = error;
        }
      }
    }
    throw lastError;
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
    return [
      { orderconfig: payload },
      { order_config: payload },
      payload,
    ];
  },

  async getOrderConfig(configId) {
    const id = String(configId);
    const payload = await tryCandidates(RESOURCES.orderConfigs, "get", `/${id}`);
    return unwrapEntity(payload, ["order_config", "orderConfig", "orderconfig"]);
  },

  async createOrderConfig(values) {
    let lastError;
    for (const body of this._wrapOrderConfigBody(values)) {
      try {
        const payload = await tryCandidates(RESOURCES.orderConfigs, "post", "", body);
        return unwrapEntity(payload, ["order_config", "orderConfig", "orderconfig"]);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  },

  async updateOrderConfig(configId, values) {
    const id = String(configId);
    let lastError;
    for (const body of this._wrapOrderConfigBody(values)) {
      try {
        const payload = await tryCandidatesMutate(RESOURCES.orderConfigs, `/${id}`, body);
        return unwrapEntity(payload, ["order_config", "orderConfig", "orderconfig"]);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
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
    try {
      const response = await apiClient.get("/orders/statuses", { params, loading: false });
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
    return { ids, orders: ids };
  },

  async bulkDispatch(orderIds) {
    const body = this._orderIdsBody(orderIds);
    let lastError;
    for (const candidate of RESOURCES.orders) {
      try {
        const response = await apiClient.post(`/${candidate}/bulk-dispatch`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
      try {
        const response = await apiClient.patch(`/${candidate}/bulk-dispatch`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
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

  async listDrivers(params) {
    const payload = await tryCandidates(RESOURCES.drivers, "get", "", undefined);
    return unwrapList(payload, ["drivers"]);
  },
  async getDriver(driverId) {
    const payload = await tryCandidates(RESOURCES.drivers, "get", `/${driverId}`);
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

  async listVehicles(params) {
    const payload = await tryCandidates(RESOURCES.vehicles, "get", "", undefined);
    return unwrapList(payload, ["vehicles"]);
  },
  async getVehicle(vehicleId) {
    const payload = await tryCandidates(RESOURCES.vehicles, "get", `/${vehicleId}`);
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

  async listFleets(params) {
    const payload = await tryCandidates(RESOURCES.fleets, "get", "", undefined);
    return unwrapList(payload, ["fleets"]);
  },
  async getFleet(fleetId) {
    const payload = await tryCandidates(RESOURCES.fleets, "get", `/${fleetId}`);
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

  async listContacts(params = {}) {
    return fleetopsService.listContact();
  },

  async listVendors(params = {}) {
    return fleetopsService.listVendor();
  },

  async attachDeviceToVehicle(vehicleId, deviceId) {
    const body = { device_uuid: deviceId, device_id: deviceId };
    return tryCandidatesMutate(RESOURCES.vehicles, `/${vehicleId}/devices`, body).catch(async () => {
      const payload = await tryCandidates(RESOURCES.devices, "patch", `/${deviceId}`, {
        vehicle_uuid: vehicleId,
        vehicle_id: vehicleId,
      });
      return unwrapEntity(payload, ["device"]);
    });
  },

  async detachDeviceFromVehicle(vehicleId, deviceId) {
    return tryCandidates(RESOURCES.vehicles, "delete", `/${vehicleId}/devices/${deviceId}`).catch(async () => {
      await tryCandidatesMutate(RESOURCES.devices, `/${deviceId}`, { vehicle_uuid: null, vehicle_id: null });
    });
  },

  async listVehicleDevices(vehicleId) {
    try {
      const payload = await tryCandidates(RESOURCES.vehicles, "get", `/${vehicleId}/devices`);
      return unwrapList(payload, ["devices"]);
    } catch {
      const all = await fleetopsService.listDevice();
      return all.filter(
        (d) =>
          String(d.vehicle_uuid || d.vehicle_id || "") === String(vehicleId),
      );
    }
  },

  async listVehicleWorkOrders(vehicleId) {
    const all = await fleetopsService.listWorkOrder();
    return all.filter(
      (wo) =>
        String(wo.vehicle_uuid || wo.vehicle_id || "") === String(vehicleId),
    );
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
    return fleetopsService.updateDriver(driverId, { vendorId, facilitator_uuid: vendorId });
  },

  async assignVendorToDriverViaVendor(vendorId, driverId) {
    return fleetopsService.assignDriverToVendor(vendorId, driverId);
  },

  async listServiceAreas() {
    const store = readDay3Store();
    return store.serviceAreas || [];
  },

  async getServiceArea(id) {
    const store = readDay3Store();
    return (store.serviceAreas || []).find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async createServiceArea(values = {}) {
    const store = readDay3Store();
    const row = { uuid: `sa-${Date.now()}`, status: "active", ...values };
    const serviceAreas = [...(store.serviceAreas || []), row];
    writeDay3Store({ ...store, serviceAreas });
    return row;
  },

  async updateServiceArea(id, values = {}) {
    const store = readDay3Store();
    const serviceAreas = (store.serviceAreas || []).map((row) =>
      String(row.uuid || row.id) === String(id) ? { ...row, ...values } : row,
    );
    writeDay3Store({ ...store, serviceAreas });
    return serviceAreas.find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async deleteServiceArea(id) {
    const store = readDay3Store();
    const serviceAreas = (store.serviceAreas || []).filter((row) => String(row.uuid || row.id) !== String(id));
    writeDay3Store({ ...store, serviceAreas });
  },

  async createScheduleItem(formValues) {
    const { schedulesService } = await import("@/services/schedules");
    return schedulesService.createScheduleItem(buildScheduleItemPayload(formValues));
  },

  async listRoutes(params = {}) {
    try {
      const payload = await tryCandidates(RESOURCES.routes, "get", "", undefined);
      return unwrapList(payload, ["routes"]);
    } catch {
      return [];
    }
  },

  async getRoute(routeId) {
    const payload = await tryCandidates(RESOURCES.routes, "get", `/${routeId}`);
    return unwrapEntity(payload, ["route"]);
  },

  async createRoute(body = {}) {
    const payload = await tryCandidates(RESOURCES.routes, "post", "", { route: body });
    return unwrapEntity(payload, ["route"]);
  },

  async optimizeRoutes(body = {}) {
    const orderIds = body.orders || body.order_ids || body.order_uuids || [];
    if (orderIds.length) {
      return this.runOrchestrator({
        mode: body.mode || "optimize_routes",
        order_ids: orderIds,
        options: { engine: body.engine || "greedy", ...body.options },
        prior_assignments: body.prior_assignments,
      });
    }
    let lastError;
    try {
      const response = await apiClient.post("/routes/optimize", body);
      return response.data;
    } catch (error) {
      lastError = error;
    }
    for (const candidate of RESOURCES.routes) {
      try {
        const response = await apiClient.post(`/${candidate}/optimize`, body);
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
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
    const payload = await tryCandidates(RESOURCES.serviceRates, "post", "", { service_rate: values });
    return unwrapEntity(payload, ["service_rate", "serviceRate"]);
  },

  async updateServiceRate(id, values) {
    const payload = await tryCandidatesMutate(RESOURCES.serviceRates, `/${id}`, { service_rate: values });
    return unwrapEntity(payload, ["service_rate", "serviceRate"]);
  },

  async deleteServiceRate(id) {
    await tryCandidates(RESOURCES.serviceRates, "delete", `/${id}`);
  },

  /** Nearest active driver heuristic (G010). */
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
    const store = readDay3Store();
    const zones = store.serviceAreaZones || [];
    if (!serviceAreaId) return zones;
    return zones.filter((zone) => String(zone.service_area_uuid || zone.serviceAreaId) === String(serviceAreaId));
  },

  async getServiceAreaZone(id) {
    const store = readDay3Store();
    return (store.serviceAreaZones || []).find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async createServiceAreaZone(values = {}) {
    const store = readDay3Store();
    const row = { uuid: `saz-${Date.now()}`, status: "active", ...values };
    const serviceAreaZones = [...(store.serviceAreaZones || []), row];
    writeDay3Store({ ...store, serviceAreaZones });
    return row;
  },

  async updateServiceAreaZone(id, values = {}) {
    const store = readDay3Store();
    const serviceAreaZones = (store.serviceAreaZones || []).map((row) =>
      String(row.uuid || row.id) === String(id) ? { ...row, ...values } : row,
    );
    writeDay3Store({ ...store, serviceAreaZones });
    return serviceAreaZones.find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async deleteServiceAreaZone(id) {
    const store = readDay3Store();
    const serviceAreaZones = (store.serviceAreaZones || []).filter((row) => String(row.uuid || row.id) !== String(id));
    writeDay3Store({ ...store, serviceAreaZones });
  },

  async getServiceAreaGeometry(id) {
    const area = await this.getServiceArea(id);
    return area?.geometry || area?.polygon || null;
  },

  async saveServiceAreaGeometry(id, geometry) {
    return this.updateServiceArea(id, { geometry, polygon: geometry });
  },

  async deleteServiceAreaGeometry(id) {
    await this.saveServiceAreaGeometry(id, null);
  },

  async listSettingsSection(sectionKey, params = {}) {
    const store = readDay3Store();
    const settings = store.settings || {};
    return settings[sectionKey] || {};
  },

  async saveSettingsSection(sectionKey, values = {}) {
    const store = readDay3Store();
    const settings = { ...(store.settings || {}), [sectionKey]: values };
    writeDay3Store({ ...store, settings });
    return values;
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
    const rows = await this.listOrders().catch(() => []);
    return rows.find((row) => String(row.public_id || row.publicId || "").toLowerCase() === number.toLowerCase()) || null;
  },

  async listCustomField() {
    const store = readDay3Store();
    return store.customFields || [];
  },

  async getCustomField(id) {
    const all = await this.listCustomField();
    return all.find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async createCustomField(values = {}) {
    const store = readDay3Store();
    const row = { uuid: `cf-${Date.now()}`, status: "active", ...values };
    const customFields = [...(store.customFields || []), row];
    writeDay3Store({ ...store, customFields });
    return row;
  },

  async updateCustomField(id, values = {}) {
    const store = readDay3Store();
    const customFields = (store.customFields || []).map((row) =>
      String(row.uuid || row.id) === String(id) ? { ...row, ...values } : row,
    );
    writeDay3Store({ ...store, customFields });
    return customFields.find((row) => String(row.uuid || row.id) === String(id)) || null;
  },

  async deleteCustomField(id) {
    const store = readDay3Store();
    const customFields = (store.customFields || []).filter((row) => String(row.uuid || row.id) !== String(id));
    writeDay3Store({ ...store, customFields });
  },
};

attachGenericCrud(fleetopsService, "vendor", RESOURCES.vendors, "vendor", ["vendors"]);
attachGenericCrud(fleetopsService, "integratedVendor", RESOURCES.integratedVendors, "integrated_vendor", [
  "integrated_vendors",
  "integratedVendors",
]);
attachGenericCrud(fleetopsService, "contact", RESOURCES.contacts, "contact", ["contacts"]);
attachGenericCrud(fleetopsService, "customer", RESOURCES.customers, "customer", ["customers"]);
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
attachGenericCrud(fleetopsService, "equipment", RESOURCES.equipment, "equipment", ["equipment"]);
attachGenericCrud(fleetopsService, "part", RESOURCES.parts, "part", ["parts"]);
