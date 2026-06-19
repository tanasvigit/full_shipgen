/**
 * Yard zone master — operational yard control APIs.
 */

import { parseListResponse, request } from "./ymsApi";
import { notifyYmsDataChanged } from "./gateManagementApi";

export const YARD_ZONE_TYPES = [
  "LOADING",
  "UNLOADING",
  "DOCUMENTATION",
  "WAITING_AREA",
  "STAGING",
  "HAZMAT",
  "COLD_CHAIN",
  "EMERGENCY_HOLDING",
  "EXIT_HOLDING",
  "GATE_IN",
  "GATE_OUT",
  "CUSTOM",
];

export const YARD_ZONE_STATUSES = ["ACTIVE", "FULL", "BLOCKED", "MAINTENANCE"];

export const MAP_ZONE_COLORS = {
  A: "#16A34A",
  B: "#2563EB",
  C: "#64748B",
  D: "#DC2626",
  E: "#0EA5E9",
  F: "#D97706",
};

export const TYPE_COLORS = {
  LOADING: "#16A34A",
  UNLOADING: "#2563EB",
  DOCUMENTATION: "#64748B",
  WAITING_AREA: "#8B5CF6",
  STAGING: "#6366F1",
  HAZMAT: "#DC2626",
  COLD_CHAIN: "#0EA5E9",
  EMERGENCY_HOLDING: "#D97706",
  EXIT_HOLDING: "#F59E0B",
  GATE_IN: "#059669",
  GATE_OUT: "#475569",
  CUSTOM: "#64748B",
};

export function zoneDisplayColor(zone) {
  if (zone?.map_code && MAP_ZONE_COLORS[zone.map_code]) return MAP_ZONE_COLORS[zone.map_code];
  return TYPE_COLORS[zone?.zone_type] || "#64748B";
}

export function mapZoneRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.map_code || row.zone_code,
    zoneCode: row.zone_code,
    name: row.zone_name,
    zoneType: row.zone_type,
    capacity: row.max_capacity,
    maxCapacity: row.max_capacity,
    status: row.status,
    description: row.description,
    remarks: row.remarks,
    mapCode: row.map_code,
    linkedDockId: row.linked_dock_id,
    isMandatory: row.is_mandatory,
    occupied: row.currentOccupancy ?? 0,
    currentOccupancy: row.currentOccupancy ?? 0,
    free: row.availableSlots ?? Math.max(0, (row.max_capacity || 0) - (row.currentOccupancy || 0)),
    availableSlots: row.availableSlots ?? 0,
    pct: row.occupancyPct ?? 0,
    occupancyPct: row.occupancyPct ?? 0,
    vehiclesPresent: row.vehiclesPresent || [],
    purpose: row.description || row.zone_type?.replace(/_/g, " "),
    color: zoneDisplayColor(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listZones(params = {}) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status) qs.set("status", params.status);
  if (params.zone_type) qs.set("zone_type", params.zone_type);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.skip != null) qs.set("skip", String(params.skip));
  const suffix = qs.toString() ? `?${qs}` : "";
  const data = await request(`/yard/zones${suffix}`);
  return parseListResponse(data).map(mapZoneRow);
}

export async function fetchYardZonesBundle() {
  const [zones, dashboard] = await Promise.all([
    listZones({ limit: 500 }),
    request("/yard/dashboard"),
  ]);
  return { zones, dashboard };
}

export async function getZone(zoneId) {
  const row = await request(`/yard/zones/${zoneId}`);
  return mapZoneRow(row);
}

export async function createZone(payload) {
  const row = await request("/yard/zones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  notifyYmsDataChanged();
  return mapZoneRow(row);
}

export async function updateZone(zoneId, payload) {
  const row = await request(`/yard/zones/${zoneId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  notifyYmsDataChanged();
  return mapZoneRow(row);
}

export async function deleteZone(zoneId) {
  await request(`/yard/zones/${zoneId}`, { method: "DELETE" });
  notifyYmsDataChanged();
}

export async function moveVehicleToZone(vehicleId, zoneId, reason) {
  const result = await request(`/yard/move-vehicle/${vehicleId}`, {
    method: "POST",
    body: JSON.stringify({ zone_id: zoneId, reason, created_by: "yard-ui" }),
  });
  notifyYmsDataChanged();
  return result;
}

export async function getVehicleZoneHistory(vehicleId, limit = 50) {
  return request(`/yard/vehicle-history/${vehicleId}?limit=${limit}`);
}

export default {
  YARD_ZONE_TYPES,
  YARD_ZONE_STATUSES,
  fetchYardZonesBundle,
  getZone,
  createZone,
  updateZone,
  deleteZone,
  moveVehicleToZone,
  getVehicleZoneHistory,
  mapZoneRow,
  zoneDisplayColor,
};
