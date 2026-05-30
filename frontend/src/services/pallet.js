import { authorizedHostRequest, unwrapEntity, unwrapList } from "@/lib/api";
import { env } from "@/lib/env";
import { getEntityWithFallback, getListWithFallback, mutateWithFallback } from "@/services/httpUtils";

const palletRoot = () => env.MODULE_ROOT_PALLET;
const palletPath = (suffix) => `${palletRoot()}/${String(suffix).replace(/^\/+/, "")}`;

export const palletService = {
  async listWarehouses(params) {
    return getListWithFallback("/warehouses", ["warehouses"], palletPath("warehouses"), { params });
  },
  async getWarehouse(id) {
    return getEntityWithFallback(`/warehouses/${id}`, ["warehouse"], palletPath(`warehouses/${id}`));
  },
  async createWarehouse(payload) {
    const data = await mutateWithFallback("post", "/warehouses", payload, palletPath("warehouses"));
    return unwrapEntity(data, ["warehouse"]);
  },
  async patchWarehouse(id, payload) {
    const data = await mutateWithFallback("patch", `/warehouses/${id}`, payload, palletPath(`warehouses/${id}`));
    return unwrapEntity(data, ["warehouse"]);
  },

  async listInventories(params) {
    return getListWithFallback("/inventories", ["inventories", "inventory"], palletPath("inventories"), { params });
  },
  async createInventory(payload) {
    const data = await mutateWithFallback("post", "/inventories", payload, palletPath("inventories"));
    return unwrapEntity(data, ["inventory"]);
  },
  async patchInventory(id, payload) {
    const data = await mutateWithFallback("patch", `/inventories/${id}`, payload, palletPath(`inventories/${id}`));
    return unwrapEntity(data, ["inventory"]);
  },

  async listStockAdjustments(params) {
    return getListWithFallback(
      "/stock-adjustments",
      ["stock_adjustments", "stockAdjustments"],
      palletPath("stock-adjustments"),
      { params },
    );
  },
  async createStockAdjustment(payload) {
    const data = await mutateWithFallback("post", "/stock-adjustments", payload, palletPath("stock-adjustments"));
    return unwrapEntity(data, ["stock_adjustment", "stockAdjustment"]);
  },

  async listAudits(params) {
    return getListWithFallback("/audits", ["audits"], palletPath("audits"), { params });
  },

  async listSuppliers(params) {
    return getListWithFallback("/suppliers", ["suppliers"], palletPath("suppliers"), { params });
  },
  async createSupplier(payload) {
    const data = await mutateWithFallback("post", "/suppliers", payload, palletPath("suppliers"));
    return unwrapEntity(data, ["supplier"]);
  },

  async listPurchaseOrders(params) {
    return getListWithFallback(
      "/purchase-orders",
      ["purchase_orders", "purchaseOrders"],
      palletPath("purchase-orders"),
      { params },
    );
  },
  async createPurchaseOrder(payload) {
    const data = await mutateWithFallback("post", "/purchase-orders", payload, palletPath("purchase-orders"));
    return unwrapEntity(data, ["purchase_order", "purchaseOrder"]);
  },
  async patchPurchaseOrder(id, payload) {
    const data = await mutateWithFallback(
      "patch",
      `/purchase-orders/${id}`,
      payload,
      palletPath(`purchase-orders/${id}`),
    );
    return unwrapEntity(data, ["purchase_order", "purchaseOrder"]);
  },

  async listProducts(params) {
    return getListWithFallback("/products", ["products"], palletPath("products"), { params });
  },
};
