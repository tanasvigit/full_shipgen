export type CallableQueueOption = {
  id: string;
  queueNumber: string;
  status: string;
  plate: string;
  vehicleId?: string;
};

export function buildCallableQueueEntries(
  queueEntries: Record<string, unknown>[],
  vehicles: Record<string, unknown>[],
): CallableQueueOption[] {
  const vehicleMap = new Map(vehicles.map((row) => [String(row.id), row]));
  return queueEntries
    .filter((q) => {
      const status = String(q.status || "").toUpperCase();
      return ["WAITING", "CHECKED_IN", "CALLED"].includes(status) && !q.dock_id;
    })
    .map((q) => {
      const vehicle = q.vehicle_id ? vehicleMap.get(String(q.vehicle_id)) : null;
      return {
        id: String(q.id),
        queueNumber: String(q.queue_number || "—"),
        status: String(q.status || ""),
        plate: vehicle?.vehicle_number ? String(vehicle.vehicle_number) : "—",
        vehicleId: q.vehicle_id ? String(q.vehicle_id) : undefined,
      };
    })
    .sort((a, b) => a.queueNumber.localeCompare(b.queueNumber, undefined, { numeric: true }));
}
