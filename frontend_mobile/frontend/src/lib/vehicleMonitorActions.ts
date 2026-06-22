export type VehicleMonitorRow = {
  id: string;
  plate: string;
  transporter: string;
  driver: string;
  status: string;
  zone: string;
  dockCode: string;
  vehicleType: string;
  category: string;
};

export type VehicleMonitorCounts = {
  total: number;
  inYard: number;
  waiting: number;
  loading: number;
  exitHolding: number;
};

export const VEHICLE_MONITOR_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "inYard", label: "In yard" },
  { key: "waiting", label: "Waiting" },
  { key: "loading", label: "Loading" },
  { key: "exitHolding", label: "Exit holding" },
] as const;

export type VehicleMonitorCategory = (typeof VEHICLE_MONITOR_CATEGORIES)[number]["key"];

const EXITED = new Set(["EXITED", "CANCELLED"]);

export function computeVehicleMonitorCounts(rows: VehicleMonitorRow[]): VehicleMonitorCounts {
  return {
    total: rows.length,
    inYard: rows.filter((row) => !EXITED.has(row.status.toUpperCase())).length,
    waiting: rows.filter((row) => row.status.toUpperCase() === "WAITING").length,
    loading: rows.filter((row) => ["READY_FOR_LOADING", "LOADING"].includes(row.status.toUpperCase())).length,
    exitHolding: rows.filter((row) => ["EXIT_HOLDING", "EXIT_VERIFIED"].includes(row.status.toUpperCase())).length,
  };
}

export function filterVehicleMonitorRows(
  rows: VehicleMonitorRow[],
  category: VehicleMonitorCategory,
  search: string,
) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (category === "inYard" && EXITED.has(row.status.toUpperCase())) return false;
    if (category === "waiting" && row.status.toUpperCase() !== "WAITING") return false;
    if (category === "loading" && !["READY_FOR_LOADING", "LOADING"].includes(row.status.toUpperCase())) {
      return false;
    }
    if (
      category === "exitHolding" &&
      !["EXIT_HOLDING", "EXIT_VERIFIED"].includes(row.status.toUpperCase())
    ) {
      return false;
    }
    if (!query) return true;
    const haystack = [row.plate, row.transporter, row.driver, row.status, row.zone, row.dockCode, row.vehicleType]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
