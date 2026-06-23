import type { Permission } from '../config/permissions';

// ── User & Auth ──────────────────────────────────────────────
export type UserRole = 'admin' | 'supervisor' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  reloadSession: () => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
}

// ── Parking ──────────────────────────────────────────────────
export type VehicleCategory = '2 Wheeler' | '4 Wheeler' | 'Heavy Vehicles';
export type EntryType = 'Paid Entry' | 'Free Entry';
export type PricingCategory = VehicleCategory | 'Free Entry';
export type PaymentMethod = 'Cash' | 'UPI' | 'Card';
export type TicketStatus = 'Paid' | 'Unpaid' | 'Exited';
export type ParkingSlotStatus = 'Occupied' | 'Available';
export type FloorOccupancyStatus = 'available' | 'partial' | 'full';
export type ParkingFloorCategoryKey = 'twoWheeler' | 'fourWheeler' | 'heavyVehicle';

export interface CategorySlotStats {
  capacity: number;
  occupied: number;
  available: number;
}

export interface ParkingFloor {
  id: string;
  floorNumber: number;
  floorName: string;
  twoWheeler: CategorySlotStats;
  fourWheeler: CategorySlotStats;
  heavyVehicle: CategorySlotStats;
  status: FloorOccupancyStatus;
}

export interface FacilityOccupancySummary {
  totalFloors: number;
  totalCapacity: number;
  totalOccupied: number;
  totalAvailable: number;
  occupancyPercent: number;
  twoWheeler: CategorySlotStats;
  fourWheeler: CategorySlotStats;
  heavyVehicle: CategorySlotStats;
}

export interface ParkingTicket {
  id: string;
  vehicleNumber: string;
  category: VehicleCategory;
  entryType: EntryType;
  amount: number;
  status: TicketStatus;
  paymentMethod: PaymentMethod;
  entryTime: string;
  exitTime?: string;
  operatorId: string;
  floorNumber?: number;
  floorName?: string;
  slotStatus?: ParkingSlotStatus;
}

// ── Stats ────────────────────────────────────────────────────
export interface DashboardStats {
  vehiclesInside: number;
  todayEntries: number;
  todayExits: number;
  revenueToday: number;
  occupiedSlots: number;
  totalSlots: number;
  twoWheelerCount: number;
  fourWheelerCount: number;
}

// ── Hardware ─────────────────────────────────────────────────
export type HardwareStatus = 'Online' | 'Offline';

export interface HardwareDevice {
  id: string;
  name: string;
  type: 'QR Scanner' | 'Thermal Printer' | 'Boom Barrier' | 'Network Controller';
  status: HardwareStatus;
  lastPing: string;
  location: string;
}

// ── Pricing ──────────────────────────────────────────────────
export interface PricingRule {
  id: string;
  category: PricingCategory;
  basePrice: number;
  perHour: number;
  maxDaily: number;
  isActive: boolean;
}

// ── Reports ──────────────────────────────────────────────────
export interface RevenueData {
  day: string;
  revenue: number;
}

export interface RecentEntry {
  vehicle: string;
  category: VehicleCategory;
  time: string;
}

// ── Audit ────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: UserRole;
  timestamp: string;
  details: string;
}

// ── Navigation ───────────────────────────────────────────────
export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

// ── Supervisor monitoring ────────────────────────────────────
export interface ActiveOperator {
  id: string;
  name: string;
  shift: string;
  ticketsIssued: number;
  status: 'Active' | 'On Break' | 'Offline';
}

export interface SupervisorAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  time: string;
}

export interface QrScanEvent {
  id: string;
  ticket: string;
  vehicle: string;
  action: 'Entry Scan' | 'Exit Scan';
  status: 'Valid' | 'Invalid';
  time: string;
}

export interface OperatorActivity {
  id: string;
  operator: string;
  action: string;
  ticketId: string;
  vehicle: string;
  time: string;
}

export interface RecentExit {
  vehicle: string;
  category: VehicleCategory;
  time: string;
  ticketId: string;
}
