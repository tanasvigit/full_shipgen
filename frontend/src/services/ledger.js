import { authorizedHostRequest, unwrapEntity, unwrapList } from "@/lib/api";
import { env } from "@/lib/env";
import { getEntityWithFallback, getListWithFallback, mutateWithFallback } from "@/services/httpUtils";

const ledgerRoot = () => env.MODULE_ROOT_LEDGER;
const ledgerPath = (suffix) => `${ledgerRoot()}/${String(suffix).replace(/^\/+/, "")}`;

async function ledgerGet(pathSuffix, params) {
  const { data } = await authorizedHostRequest("get", ledgerPath(pathSuffix), { params });
  return data?.data ?? data;
}

async function ledgerMutate(method, pathSuffix, payload) {
  const { data } = await authorizedHostRequest(method, ledgerPath(pathSuffix), { data: payload });
  return data;
}

export const ledgerService = {
  async listInvoices(params) {
    return getListWithFallback("/invoices", ["invoices"], ledgerPath("invoices"), { params });
  },
  async getInvoice(id, params) {
    return getEntityWithFallback(
      `/invoices/${id}`,
      ["invoice"],
      ledgerPath(`invoices/${id}`),
      { params },
    );
  },
  async createInvoice(payload) {
    const data = await mutateWithFallback("post", "/invoices", payload, ledgerPath("invoices"));
    return unwrapEntity(data, ["invoice"]);
  },
  async patchInvoice(id, payload) {
    const data = await mutateWithFallback("patch", `/invoices/${id}`, payload, ledgerPath(`invoices/${id}`));
    return unwrapEntity(data, ["invoice"]);
  },
  async recordInvoicePayment(id, body) {
    const data = await ledgerMutate("post", `invoices/${id}/record-payment`, body);
    return unwrapEntity(data, ["invoice"]);
  },
  async markInvoiceSent(id) {
    const data = await ledgerMutate("post", `invoices/${id}/mark-as-sent`, {});
    return unwrapEntity(data, ["invoice"]);
  },
  async sendInvoice(id) {
    const data = await ledgerMutate("post", `invoices/${id}/send`, {});
    return unwrapEntity(data, ["invoice"]);
  },

  async listWallets(params) {
    return getListWithFallback("/wallets", ["wallets"], ledgerPath("wallets"), { params });
  },
  async getWallet(id) {
    return getEntityWithFallback(`/wallets/${id}`, ["wallet"], ledgerPath(`wallets/${id}`));
  },

  async listTransactions(params) {
    return getListWithFallback("/transactions", ["transactions"], ledgerPath("transactions"), { params });
  },

  async listAccounts(params) {
    return getListWithFallback("/accounts", ["accounts"], ledgerPath("accounts"), { params });
  },
  async createAccount(payload) {
    const data = await mutateWithFallback("post", "/accounts", payload, ledgerPath("accounts"));
    return unwrapEntity(data, ["account"]);
  },

  async listJournals(params) {
    return getListWithFallback("/journals", ["journals"], ledgerPath("journals"), { params });
  },
  async createManualJournal(body) {
    const data = await ledgerMutate("post", "journals/manual", body);
    return unwrapEntity(data, ["journal"]) || data;
  },

  async getDashboard(params) {
    return ledgerGet("reports/dashboard", params);
  },
  async getCashFlow(params) {
    return ledgerGet("reports/cash-flow", params);
  },
};
