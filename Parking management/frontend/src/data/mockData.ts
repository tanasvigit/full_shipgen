import type {
  User,
  ParkingTicket,
  DashboardStats,
  HardwareDevice,
  PricingRule,
  RevenueData,
  RecentEntry,
  AuditLog,
} from '../types';

// ── Users ────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'U001', name: 'Rajesh Kumar', email: 'admin@parkflow.com', role: 'admin', status: 'active', createdAt: '2025-01-15' },
  { id: 'U002', name: 'Priya Sharma', email: 'priya@parkflow.com', role: 'operator', status: 'active', createdAt: '2025-02-20' },
  { id: 'U003', name: 'Amit Patel', email: 'amit@parkflow.com', role: 'operator', status: 'active', createdAt: '2025-03-10' },
  { id: 'U007', name: 'Sunil Mehta', email: 'supervisor@parkflow.com', role: 'supervisor', status: 'active', createdAt: '2025-03-01' },
  { id: 'U004', name: 'Sneha Reddy', email: 'sneha@parkflow.com', role: 'admin', status: 'inactive', createdAt: '2025-04-05' },
  { id: 'U005', name: 'Vikram Singh', email: 'vikram@parkflow.com', role: 'operator', status: 'active', createdAt: '2025-05-12' },
  { id: 'U006', name: 'Ananya Gupta', email: 'ananya@parkflow.com', role: 'operator', status: 'inactive', createdAt: '2025-06-01' },
];

// ── Tickets ──────────────────────────────────────────────────
export const mockTickets: ParkingTicket[] = [
  { id: 'PK102391', vehicleNumber: 'AP31CD9988', category: '2 Wheeler', entryType: 'Paid Entry', amount: 20, status: 'Paid', paymentMethod: 'UPI', entryTime: '10:12 AM', operatorId: 'U002', floorNumber: 1, floorName: 'Floor 1', slotStatus: 'Occupied' },
  { id: 'PK102392', vehicleNumber: 'TS09XY4455', category: 'Heavy Vehicles', entryType: 'Paid Entry', amount: 100, status: 'Paid', paymentMethod: 'Cash', entryTime: '10:18 AM', operatorId: 'U002', floorNumber: 2, floorName: 'Floor 2', slotStatus: 'Occupied' },
  { id: 'PK102393', vehicleNumber: 'AP39AB1234', category: '4 Wheeler', entryType: 'Paid Entry', amount: 50, status: 'Paid', paymentMethod: 'UPI', entryTime: '10:22 AM', operatorId: 'U003', floorNumber: 1, floorName: 'Floor 1', slotStatus: 'Occupied' },
  { id: 'PK102394', vehicleNumber: 'KA05MN7890', category: '4 Wheeler', entryType: 'Paid Entry', amount: 50, status: 'Unpaid', paymentMethod: 'Cash', entryTime: '10:30 AM', operatorId: 'U002', floorNumber: 2, floorName: 'Floor 2', slotStatus: 'Occupied' },
  { id: 'PK102395', vehicleNumber: 'TN22AB3344', category: '2 Wheeler', entryType: 'Paid Entry', amount: 20, status: 'Paid', paymentMethod: 'Card', entryTime: '10:45 AM', operatorId: 'U003', floorNumber: 4, floorName: 'Basement', slotStatus: 'Occupied' },
  { id: 'PK102396', vehicleNumber: 'MH12QR5566', category: 'Heavy Vehicles', entryType: 'Paid Entry', amount: 100, status: 'Unpaid', paymentMethod: 'Cash', entryTime: '11:00 AM', operatorId: 'U002', floorNumber: 3, floorName: 'Floor 3', slotStatus: 'Occupied' },
  { id: 'PK102397', vehicleNumber: 'DL08ST7788', category: '4 Wheeler', entryType: 'Paid Entry', amount: 50, status: 'Exited', paymentMethod: 'UPI', entryTime: '08:15 AM', exitTime: '10:30 AM', operatorId: 'U003', floorNumber: 1, floorName: 'Floor 1', slotStatus: 'Available' },
  { id: 'PK102398', vehicleNumber: 'RJ14UV9900', category: '2 Wheeler', entryType: 'Free Entry', amount: 0, status: 'Paid', paymentMethod: 'Cash', entryTime: '11:15 AM', operatorId: 'U002', floorNumber: 4, floorName: 'Basement', slotStatus: 'Occupied' },
];

// ── Dashboard Stats ──────────────────────────────────────────
export const mockStats: DashboardStats = {
  vehiclesInside: 248,
  todayEntries: 1240,
  todayExits: 1102,
  revenueToday: 48500,
  occupiedSlots: 248,
  totalSlots: 320,
  twoWheelerCount: 112,
  fourWheelerCount: 96,
};

// ── Hardware ─────────────────────────────────────────────────
export const mockHardware: HardwareDevice[] = [
  { id: 'HW002', name: 'Exit QR Scanner', type: 'QR Scanner', status: 'Online', lastPing: '1 min ago', location: 'Main Gate Exit' },
  { id: 'HW003', name: 'Boom Barrier', type: 'Boom Barrier', status: 'Online', lastPing: '30 sec ago', location: 'Main Gate' },
  { id: 'HW004', name: 'Thermal Printer', type: 'Thermal Printer', status: 'Offline', lastPing: '15 min ago', location: 'Operator Desk' },
  { id: 'HW005', name: 'Network Controller', type: 'Network Controller', status: 'Online', lastPing: '5 sec ago', location: 'Server Room' },
];

// ── Pricing ──────────────────────────────────────────────────
export const mockPricing: PricingRule[] = [
  { id: 'PR001', category: '2 Wheeler', basePrice: 20, perHour: 10, maxDaily: 100, isActive: true },
  { id: 'PR002', category: '4 Wheeler', basePrice: 50, perHour: 20, maxDaily: 300, isActive: true },
  { id: 'PR003', category: 'Heavy Vehicles', basePrice: 100, perHour: 50, maxDaily: 500, isActive: true },
  { id: 'PR004', category: 'Free Entry', basePrice: 0, perHour: 0, maxDaily: 0, isActive: true },
];

// ── Revenue Chart Data ───────────────────────────────────────
export const mockRevenueData: RevenueData[] = [
  { day: 'M', revenue: 32000 },
  { day: 'T', revenue: 28000 },
  { day: 'W', revenue: 35000 },
  { day: 'T', revenue: 42000 },
  { day: 'F', revenue: 55000 },
  { day: 'S', revenue: 48500 },
  { day: 'S', revenue: 38000 },
];

// ── Recent Entries ───────────────────────────────────────────
export const mockRecentEntries: RecentEntry[] = [
  { vehicle: 'AP39AB1234', category: '4 Wheeler', time: '10:12 AM' },
  { vehicle: 'AP31CD9988', category: '2 Wheeler', time: '10:18 AM' },
  { vehicle: 'TS09XY4455', category: 'Heavy Vehicles', time: '10:22 AM' },
  { vehicle: 'KA05MN7890', category: '4 Wheeler', time: '10:28 AM' },
  { vehicle: 'TN22AB3344', category: '2 Wheeler', time: '10:35 AM' },
];

// ── Audit Logs ───────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'AL001', action: 'User Login', user: 'Rajesh Kumar', role: 'admin', timestamp: '2026-05-11 09:00 AM', details: 'Admin logged in from 192.168.1.10' },
  { id: 'AL002', action: 'Ticket Created', user: 'Priya Sharma', role: 'operator', timestamp: '2026-05-11 10:12 AM', details: 'Ticket PK102391 created for AP31CD9988' },
  { id: 'AL003', action: 'Pricing Updated', user: 'Rajesh Kumar', role: 'admin', timestamp: '2026-05-11 10:15 AM', details: '4 Wheeler base price changed from ₹40 to ₹50' },
  { id: 'AL004', action: 'Payment Collected', user: 'Amit Patel', role: 'operator', timestamp: '2026-05-11 10:22 AM', details: 'Payment ₹50 collected for PK102393' },
  { id: 'AL005', action: 'Hardware Restart', user: 'Rajesh Kumar', role: 'admin', timestamp: '2026-05-11 10:30 AM', details: 'Thermal Printer restarted' },
  { id: 'AL006', action: 'User Created', user: 'Rajesh Kumar', role: 'admin', timestamp: '2026-05-11 11:00 AM', details: 'New operator Vikram Singh added' },
];
