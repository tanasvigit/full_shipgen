import { apiClient, authorizedHostRequest, unwrapEntity, unwrapList } from "@/lib/api";
import { env } from "@/lib/env";
import { getEntityWithFallback, getListWithFallback, mutateWithFallback } from "@/services/httpUtils";

const sfRoot = () => env.MODULE_ROOT_STOREFRONT;

const sfPath = (suffix) => `${sfRoot()}/${String(suffix).replace(/^\/+/, "")}`;

export const storefrontService = {
  async listProducts(params) {
    return getListWithFallback("/products", ["products"], sfPath("products"), { params });
  },
  async getProduct(id) {
    return getEntityWithFallback(`/products/${id}`, ["product"], sfPath(`products/${id}`));
  },
  async createProduct(payload) {
    const data = await mutateWithFallback("post", "/products", payload, sfPath("products"));
    return unwrapEntity(data, ["product"]);
  },
  async patchProduct(id, payload) {
    const data = await mutateWithFallback("patch", `/products/${id}`, payload, sfPath(`products/${id}`));
    return unwrapEntity(data, ["product"]);
  },
  async deleteProduct(id) {
    await mutateWithFallback("delete", `/products/${id}`, null, sfPath(`products/${id}`));
  },

  async listCatalogs(params) {
    return getListWithFallback("/catalogs", ["catalogs"], sfPath("catalogs"), { params });
  },
  async createCatalog(payload) {
    const data = await mutateWithFallback("post", "/catalogs", payload, sfPath("catalogs"));
    return unwrapEntity(data, ["catalog"]);
  },
  async patchCatalog(id, payload) {
    const data = await mutateWithFallback("patch", `/catalogs/${id}`, payload, sfPath(`catalogs/${id}`));
    return unwrapEntity(data, ["catalog"]);
  },

  async listCustomers(params) {
    return getListWithFallback("/customers", ["customers"], sfPath("customers"), { params });
  },
  async getCustomer(id) {
    return getEntityWithFallback(`/customers/${id}`, ["customer"], sfPath(`customers/${id}`));
  },
  async createCustomer(payload) {
    const data = await mutateWithFallback("post", "/customers", payload, sfPath("customers"));
    return unwrapEntity(data, ["customer"]);
  },
  async patchCustomer(id, payload) {
    const data = await mutateWithFallback("patch", `/customers/${id}`, payload, sfPath(`customers/${id}`));
    return unwrapEntity(data, ["customer"]);
  },

  async listNetworks(params) {
    return getListWithFallback("/networks", ["networks"], sfPath("networks"), { params });
  },
  async createNetwork(payload) {
    const data = await mutateWithFallback("post", "/networks", payload, sfPath("networks"));
    return unwrapEntity(data, ["network"]);
  },
  async patchNetwork(id, payload) {
    const data = await mutateWithFallback("patch", `/networks/${id}`, payload, sfPath(`networks/${id}`));
    return unwrapEntity(data, ["network"]);
  },

  async listStores(params) {
    return getListWithFallback("/stores", ["stores"], sfPath("stores"), { params });
  },

  /** Console metrics (requires `store` uuid). */
  async getMetrics(params) {
    try {
      const { data } = await authorizedHostRequest("get", sfPath("actions/metrics"), { params });
      return data?.metrics || data || {};
    } catch (err) {
      try {
        const { data } = await apiClient.get("/actions/metrics", { params });
        return data?.metrics || data || {};
      } catch {
        throw err;
      }
    }
  },

  async sendPushNotification(payload) {
    try {
      const { data } = await authorizedHostRequest("post", sfPath("actions/send-push-notification"), { data: payload });
      return data;
    } catch (err) {
      const { data } = await apiClient.post("/actions/send-push-notification", payload);
      return data;
    }
  },

  /** Coupons / promotions collections are not registered on storefront internal routes in this repo. */
  async listCoupons(params) {
    try {
      return await getListWithFallback("/coupons", ["coupons"], sfPath("coupons"), { params });
    } catch {
      return [];
    }
  },
  async createCoupon(payload) {
    const data = await mutateWithFallback("post", "/coupons", payload, sfPath("coupons"));
    return unwrapEntity(data, ["coupon"]);
  },

  async listPromotions(params) {
    try {
      return await getListWithFallback("/promotions", ["promotions", "campaigns"], sfPath("promotions"), { params });
    } catch {
      return [];
    }
  },

  // —— Storefront v1 cart / checkout (consumer API, same auth + company headers) ——

  async retrieveCart(uniqueId) {
    const suffix = uniqueId ? `storefront/v1/carts/${uniqueId}` : "storefront/v1/carts";
    const { data } = await authorizedHostRequest("get", suffix);
    return unwrapEntity(data, ["cart"]);
  },

  async addCartItem(cartId, productPublicId, payload = {}) {
    const { data } = await authorizedHostRequest("post", `storefront/v1/carts/${cartId}/${productPublicId}`, {
      data: payload,
    });
    return unwrapEntity(data, ["cart"]);
  },

  async updateCartItem(cartId, lineItemId, payload = {}) {
    const { data } = await authorizedHostRequest("put", `storefront/v1/carts/${cartId}/${lineItemId}`, {
      data: payload,
    });
    return unwrapEntity(data, ["cart"]);
  },

  async removeCartItem(cartId, lineItemId) {
    const { data } = await authorizedHostRequest("delete", `storefront/v1/carts/${cartId}/${lineItemId}`);
    return unwrapEntity(data, ["cart"]);
  },

  async emptyCart(cartId) {
    const { data } = await authorizedHostRequest("put", `storefront/v1/carts/${cartId}/empty`);
    return unwrapEntity(data, ["cart"]);
  },
};
