export type YardZoneRow = {
  id: string;
  code: string;
  name: string;
  zoneType: string;
  status: string;
  capacity: number;
  occupied: number;
  available: number;
  utilizationPct: number;
};

export type YardMapSummary = {
  totalZones: number;
  currentOccupancy: number;
  totalCapacity: number;
  availableSlots: number;
  yardUtilizationPct: number;
  fullZones: number;
  blockedZones: number;
};

export function mapYardZoneRow(row: Record<string, unknown>): YardZoneRow {
  const capacity = Number(row.max_capacity ?? row.maxCapacity ?? 0);
  const occupied = Number(row.currentOccupancy ?? row.occupied ?? 0);
  const available = Number(row.availableSlots ?? Math.max(0, capacity - occupied));
  return {
    id: String(row.id),
    code: String(row.map_code || row.zone_code || row.zoneCode || "—"),
    name: String(row.zone_name || row.zoneName || row.name || "Zone"),
    zoneType: String(row.zone_type || row.zoneType || "").replace(/_/g, " "),
    status: String(row.status || "ACTIVE"),
    capacity,
    occupied,
    available,
    utilizationPct: Number(row.occupancyPct ?? (capacity ? Math.round((occupied / capacity) * 100) : 0)),
  };
}

export function mapYardMapSummary(row: Record<string, unknown>): YardMapSummary {
  return {
    totalZones: Number(row.totalZones ?? 0),
    currentOccupancy: Number(row.currentOccupancy ?? 0),
    totalCapacity: Number(row.totalCapacity ?? 0),
    availableSlots: Number(row.availableSlots ?? 0),
    yardUtilizationPct: Number(row.yardUtilizationPct ?? 0),
    fullZones: Number(row.fullZones ?? 0),
    blockedZones: Number(row.blockedZones ?? 0),
  };
}

export function filterYardZones(zones: YardZoneRow[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return zones;
  return zones.filter((zone) =>
    [zone.code, zone.name, zone.zoneType, zone.status].join(" ").toLowerCase().includes(query),
  );
}
