import { apiRequest, unwrapEntity } from "@/src/lib/api";

export type CreateFuelReportInput = {
  driver: string;
  odometer: number;
  volume: number;
  metric_unit?: string;
  amount?: number;
  location?: string;
};

export type UpdateFuelReportInput = {
  odometer?: number;
  volume?: number;
  metric_unit?: string;
  amount?: number;
  location?: string;
};

export const fuelReportsService = {
  async create(input: CreateFuelReportInput) {
    const payload = await apiRequest("/fuel-reports", {
      method: "POST",
      body: { fuel_report: input },
    });
    return unwrapEntity(payload, ["fuel_report", "fuelReport"]);
  },
  async update(id: string, input: UpdateFuelReportInput) {
    const payload = await apiRequest(`/fuel-reports/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: { fuel_report: input },
    });
    return unwrapEntity(payload, ["fuel_report", "fuelReport"]);
  },
};
