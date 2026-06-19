// Static mock data for the Yard Management System
// All currency in INR (₹). Indian vehicle plate formats.

export const COMPANY = {
  name: "Bharat Logistics Pvt. Ltd.",
  facility: "Bhiwandi Mega Hub — Mumbai",
  facilityCode: "BHV-MUM-01",
  shift: "Day Shift A",
  operator: "Rohan Deshmukh",
  operatorRole: "Yard Controller",
};

export const KPI_HEADLINE = {
  vehiclesInYard: 47,
  vehiclesWaiting: 12,
  vehiclesLoading: 18,
  vehiclesExited: 134,
  yardOccupancyPct: 78,
  dockUtilizationPct: 82,
  avgWaitingMin: 38,
  avgTurnaroundMin: 96,
  detentionCostToday: 184500,
  fuelWastageLitres: 312,
  shipmentCompletionPct: 91,
  customerSatPct: 94,
};

// Throughput last 24h (hourly buckets)
export const THROUGHPUT_24H = [
  { h: "00", in: 2, out: 3 },
  { h: "02", in: 1, out: 2 },
  { h: "04", in: 3, out: 1 },
  { h: "06", in: 8, out: 4 },
  { h: "08", in: 14, out: 9 },
  { h: "10", in: 18, out: 12 },
  { h: "12", in: 11, out: 15 },
  { h: "14", in: 16, out: 14 },
  { h: "16", in: 13, out: 17 },
  { h: "18", in: 9, out: 11 },
  { h: "20", in: 6, out: 8 },
  { h: "22", in: 4, out: 5 },
];

export const YARD_OCCUPANCY_WEEK = [
  { day: "Mon", occ: 62, target: 75 },
  { day: "Tue", occ: 71, target: 75 },
  { day: "Wed", occ: 78, target: 75 },
  { day: "Thu", occ: 84, target: 75 },
  { day: "Fri", occ: 91, target: 75 },
  { day: "Sat", occ: 73, target: 75 },
  { day: "Sun", occ: 56, target: 75 },
];

export const DETENTION_BREAKDOWN = [
  { name: "Outside", value: 124000, fill: "#DC2626" },
  { name: "Contract", value: 42500, fill: "#D97706" },
  { name: "Company", value: 18000, fill: "#16A34A" },
];

export const VEHICLE_MIX = [
  { name: "Company", value: 42, fill: "#0F172A" },
  { name: "Contract", value: 31, fill: "#2563EB" },
  { name: "Outside", value: 27, fill: "#D97706" },
];

const TRANSPORTERS = [
  "VRL Logistics", "TCI Express", "Gati Ltd", "Allcargo", "Mahindra Logistics",
  "Safexpress", "Delhivery Freight", "Spoton", "BlackBuck", "Rivigo",
];

const DRIVERS = [
  "Suresh Yadav", "Ramesh Kumar", "Manoj Patil", "Iqbal Khan", "Vinod Sharma",
  "Anil Pawar", "Dilip Singh", "Mahesh Joshi", "Pradeep Rao", "Sunil Verma",
  "Ashok Reddy", "Kishore Naidu", "Bharat Mishra", "Mohan Tiwari", "Lakshman Iyer",
];

const PLATES = [
  "MH12AB1234", "MH14CD7821", "DL01EF3344", "GJ05GH9912", "KA03JK4501",
  "TN09LM6677", "UP32NO1029", "RJ14PQ5563", "HR55RS8841", "PB10TU2245",
  "WB02VW3398", "TS07XY4520", "AP09ZA1187", "MP04BC6634", "BR01DE5512",
  "OD22FG7799", "JH10HI3340", "KL11JK2266", "AS01LM4488", "CH04NO0921",
];

const VEHICLE_TYPES = ["32ft SXL", "20ft Container", "40ft HC", "Tanker", "Open Truck", "Reefer 20ft", "LCV", "Trailer 40ft"];

const MATERIALS = ["Cement Bags", "Steel Coils", "FMCG Cartons", "Pharma — Cold", "Chemicals — Cat B", "Rice Bags", "Auto Parts", "Textiles", "Electronics", "Hazmat — Class 3"];

function pick(arr, i) { return arr[i % arr.length]; }

function buildVehicle(i) {
  const cat = i % 5 === 0 ? "Outside" : i % 3 === 0 ? "Contract" : "Company";
  const statuses = ["EN_ROUTE", "APPROACHING", "CHECKED_IN", "WAITING", "DOCK_ASSIGNED", "LOADING", "UNLOADING", "EXITED", "SCHEDULED"];
  const status = statuses[i % statuses.length];
  const zones = ["A", "B", "C", "D", "E", "F"];
  return {
    id: `VEH-${1000 + i}`,
    plate: pick(PLATES, i),
    type: pick(VEHICLE_TYPES, i),
    category: cat,
    transporter: cat === "Company" ? "Bharat Logistics" : pick(TRANSPORTERS, i),
    driver: pick(DRIVERS, i),
    driverPhone: `+91 9${String(800000000 + i * 7919).slice(0, 9)}`,
    material: pick(MATERIALS, i),
    weightKg: 8000 + (i * 137) % 22000,
    appointment: `APT-${4500 + i}`,
    slot: `${(8 + (i % 10)).toString().padStart(2, "0")}:${(i * 7) % 60 < 10 ? "0" : ""}${(i * 7) % 60}`,
    gate: `G${1 + (i % 4)}`,
    zone: zones[i % zones.length],
    dock: i % 3 === 0 ? `D${1 + (i % 12)}` : null,
    status,
    arrivalTs: `2026-02-${10 + (i % 18)}T${(7 + (i % 10)).toString().padStart(2, "0")}:${((i * 11) % 60).toString().padStart(2, "0")}:00`,
    waitingMin: (i * 13) % 240,
    detentionCost: cat === "Outside" ? (i * 250) % 6500 : cat === "Contract" ? (i * 90) % 2400 : 0,
    priorityScore: 40 + (i * 7) % 60,
    eta: `${(i * 3) % 90} min`,
    distanceKm: (i * 4.3) % 120,
  };
}

export const VEHICLES = Array.from({ length: 60 }, (_, i) => buildVehicle(i));

export const APPOINTMENTS = Array.from({ length: 28 }, (_, i) => {
  const v = VEHICLES[i];
  return {
    id: `APT-${4500 + i}`,
    vehicleId: v.id,
    plate: v.plate,
    transporter: v.transporter,
    type: i % 2 === 0 ? "Loading" : "Unloading",
    material: v.material,
    slot: `${(7 + (i % 12)).toString().padStart(2, "0")}:${(i % 2 === 0 ? "00" : "30")}`,
    date: `2026-02-${15 + (i % 5)}`,
    gate: v.gate,
    dock: `D${1 + (i % 12)}`,
    status: ["SCHEDULED", "ARRIVED", "IN_PROGRESS", "COMPLETED", "DELAYED"][i % 5],
    createdBy: ["Production", "Warehouse", "Export", "Import", "Procurement"][i % 5],
  };
});

export const DOCKS = Array.from({ length: 16 }, (_, i) => {
  const types = ["General Cargo", "Pharma — Cold", "Refrigerated", "Chemicals", "Heavy Steel", "FMCG", "Hazmat", "Container"];
  const statuses = ["AVAILABLE", "OCCUPIED", "OCCUPIED", "DELAYED", "MAINTENANCE", "AVAILABLE"];
  const st = statuses[i % statuses.length];
  return {
    id: `D${i + 1}`,
    name: `Dock ${i + 1}`,
    type: types[i % types.length],
    status: st,
    currentVehicle: st === "OCCUPIED" || st === "DELAYED" ? VEHICLES[i % VEHICLES.length].plate : null,
    progressPct: st === "OCCUPIED" ? 30 + (i * 11) % 65 : st === "DELAYED" ? 50 + (i * 7) % 40 : 0,
    etaCloseMin: st === "OCCUPIED" ? 15 + (i * 5) % 60 : st === "DELAYED" ? 25 + (i * 4) % 80 : 0,
    equipment: ["Forklift", "Crane", "Reach Stacker", "Pallet Jack"][i % 4],
    laborTeam: `Team ${String.fromCharCode(65 + (i % 6))}`,
    utilizationPct: 55 + (i * 9) % 45,
  };
});

export const ZONES = [
  { code: "A", name: "Loading", capacity: 24, occupied: 19, color: "#16A34A" },
  { code: "B", name: "Unloading", capacity: 24, occupied: 17, color: "#2563EB" },
  { code: "C", name: "Documentation", capacity: 12, occupied: 4, color: "#64748B" },
  { code: "D", name: "Hazardous", capacity: 8, occupied: 3, color: "#DC2626" },
  { code: "E", name: "Cold Chain", capacity: 10, occupied: 6, color: "#0EA5E9" },
  { code: "F", name: "Emergency Holding", capacity: 6, occupied: 1, color: "#D97706" },
];

export const EQUIPMENT = [
  { id: "EQ-101", type: "Forklift", model: "Toyota 8FG25", status: "IN_USE", operator: "Suresh Y.", location: "Dock 3", battery: 78 },
  { id: "EQ-102", type: "Forklift", model: "Godrej GX300", status: "IDLE", operator: "—", location: "Zone A", battery: 92 },
  { id: "EQ-103", type: "Reach Stacker", model: "Kalmar DRG", status: "IN_USE", operator: "Ramesh K.", location: "Zone B", battery: 65 },
  { id: "EQ-104", type: "Crane", model: "TIL RT740", status: "MAINTENANCE", operator: "—", location: "Bay 2", battery: 0 },
  { id: "EQ-105", type: "Pallet Jack", model: "Manual", status: "IDLE", operator: "—", location: "Dock 5", battery: null },
  { id: "EQ-106", type: "Forklift", model: "Voltas DB30", status: "IN_USE", operator: "Manoj P.", location: "Dock 8", battery: 41 },
  { id: "EQ-107", type: "Reach Stacker", model: "Hyster RS46", status: "IN_USE", operator: "Iqbal K.", location: "Zone B", battery: 88 },
  { id: "EQ-108", type: "Crane", model: "ACE NX 14", status: "IDLE", operator: "—", location: "Bay 1", battery: 100 },
];

export const LABOR_TEAMS = [
  { id: "T-A", name: "Team A", shift: "06:00 — 14:00", members: 8, available: 8, assigned: "Dock 1, 2", status: "ON_DUTY" },
  { id: "T-B", name: "Team B", shift: "06:00 — 14:00", members: 7, available: 5, assigned: "Dock 3", status: "ON_DUTY" },
  { id: "T-C", name: "Team C", shift: "06:00 — 14:00", members: 10, available: 10, assigned: "Zone A", status: "ON_DUTY" },
  { id: "T-D", name: "Team D", shift: "14:00 — 22:00", members: 9, available: 0, assigned: "—", status: "OFF_DUTY" },
  { id: "T-E", name: "Team E", shift: "06:00 — 14:00", members: 6, available: 4, assigned: "Cold Chain", status: "ON_DUTY" },
  { id: "T-F", name: "Team F", shift: "22:00 — 06:00", members: 8, available: 0, assigned: "—", status: "OFF_DUTY" },
];

export const DETENTION_RECORDS = VEHICLES
  .filter((v) => v.detentionCost > 0)
  .slice(0, 18)
  .map((v) => ({
    id: `DET-${v.id}`,
    plate: v.plate,
    category: v.category,
    transporter: v.transporter,
    freeHours: 2,
    actualHours: 2 + Math.ceil(v.detentionCost / 1000),
    rate: 1000,
    cost: v.detentionCost,
    status: v.detentionCost > 3000 ? "Disputed" : "Approved",
    date: "2026-02-15",
  }));

export const AI_INSIGHTS = [
  {
    id: "AI-1",
    module: "Slot Optimizer",
    title: "Shift 17 outside vehicles to 02:00 - 04:00 window",
    impact: "Reduce avg waiting by 22 min",
    savings: 42000,
    confidence: 91,
    severity: "info",
  },
  {
    id: "AI-2",
    module: "Delay Predictor",
    title: "Dock 7 likely to delay next 3 slots",
    impact: "Reach Stacker EQ-104 in maintenance",
    savings: 0,
    confidence: 86,
    severity: "warning",
  },
  {
    id: "AI-3",
    module: "Vehicle Allocator",
    title: "Use Company fleet for Pune route — save ₹18,400",
    impact: "Company utilization 71% → 84%",
    savings: 18400,
    confidence: 94,
    severity: "success",
  },
  {
    id: "AI-4",
    module: "Cost Optimizer",
    title: "Consolidate 4 partial shipments to Surat",
    impact: "Avoid one outside vehicle hire",
    savings: 28500,
    confidence: 88,
    severity: "success",
  },
  {
    id: "AI-5",
    module: "Delay Predictor",
    title: "Yard congestion forecasted at 17:00 — Friday",
    impact: "Occupancy projected at 96%",
    savings: 0,
    confidence: 79,
    severity: "danger",
  },
];

export const VIRTUAL_QUEUE = VEHICLES
  .filter((v) => ["CHECKED_IN", "WAITING", "APPROACHING"].includes(v.status))
  .slice(0, 14)
  .sort((a, b) => b.priorityScore - a.priorityScore);

export const EVENTS_FEED = [
  { ts: "10:42", level: "info", msg: "VEH-1023 (MH12AB1234) checked in at Gate G1" },
  { ts: "10:39", level: "success", msg: "Dock 4 cleared — available for next vehicle" },
  { ts: "10:36", level: "warning", msg: "VEH-1009 detention crossed ₹3,000 threshold" },
  { ts: "10:31", level: "danger", msg: "EQ-104 reported maintenance — crane offline" },
  { ts: "10:28", level: "info", msg: "AI Optimizer suggested 3 slot adjustments" },
  { ts: "10:22", level: "success", msg: "VEH-1015 exited — TAT 78 min (under target)" },
  { ts: "10:18", level: "info", msg: "APT-4518 confirmed by transporter VRL" },
  { ts: "10:11", level: "warning", msg: "Zone A occupancy at 92%" },
];

export const TURNAROUND_TREND = [
  { day: "Mon", company: 58, contract: 84, outside: 102 },
  { day: "Tue", company: 61, contract: 89, outside: 98 },
  { day: "Wed", company: 55, contract: 81, outside: 95 },
  { day: "Thu", company: 64, contract: 92, outside: 110 },
  { day: "Fri", company: 67, contract: 95, outside: 118 },
  { day: "Sat", company: 53, contract: 79, outside: 88 },
  { day: "Sun", company: 49, contract: 74, outside: 81 },
];

export const KPI_TARGETS = [
  { metric: "Avg Waiting Time", value: "38 min", target: "30 min", trend: -8, status: "warning" },
  { metric: "Avg Turnaround", value: "96 min", target: "90 min", trend: -3, status: "warning" },
  { metric: "Dock Utilization", value: "82%", target: "85%", trend: 4, status: "info" },
  { metric: "Yard Occupancy", value: "78%", target: "75%", trend: 6, status: "success" },
  { metric: "Detention Today", value: "₹1.84L", target: "₹1.00L", trend: 12, status: "danger" },
  { metric: "Fuel Wastage", value: "312 L", target: "200 L", trend: 18, status: "danger" },
  { metric: "Shipment Completion", value: "91%", target: "95%", trend: -2, status: "warning" },
  { metric: "Cust. Satisfaction", value: "94%", target: "92%", trend: 3, status: "success" },
];

export const formatINR = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
};
