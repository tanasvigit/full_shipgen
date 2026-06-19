/** Shared yard layout constants (no service imports — safe for any module). */

/** Fallback total yard capacity when no capacity config exists in backend. */
export const YARD_CAPACITY = 72;

/** Map zone definitions (A–F) used by Yard Map and Control Tower. */
export const YARD_ZONE_DEFS = [
  { code: "A", name: "Loading", capacity: 24, color: "#16A34A", purpose: "Outbound loading staging and active load lanes." },
  { code: "B", name: "Unloading", capacity: 24, color: "#2563EB", purpose: "Inbound unloading and put-away staging." },
  { code: "C", name: "Documentation", capacity: 12, color: "#64748B", purpose: "Pre-gate documentation and scheduled arrivals." },
  { code: "D", name: "Hazardous", capacity: 8, color: "#DC2626", purpose: "Hazmat and chemical cargo isolation." },
  { code: "E", name: "Cold Chain", capacity: 10, color: "#0EA5E9", purpose: "Pharma and refrigerated flows." },
  { code: "F", name: "Emergency Holding", capacity: 6, color: "#D97706", purpose: "Approaching vehicles, overflow, and exceptional holds." },
];
