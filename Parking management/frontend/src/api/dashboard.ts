import type { DashboardStats, FacilityOccupancySummary, HardwareDevice, ParkingTicket } from '../types';
import type { AuditLog } from '../types';
import { apiRequest } from './client';
import { normalizeTicket } from './mappers';

interface AdminDashboardResponse {
  stats: DashboardStats;
  facilitySummary: FacilityOccupancySummary;
  hardware: HardwareDevice[];
  auditLogs: AuditLog[];
  recentTickets: ParkingTicket[];
}

interface SupervisorDashboardResponse {
  stats: DashboardStats;
  occupancyPercent: number;
  activeOperators: Array<{
    id: string;
    name: string;
    shift: string;
    ticketsIssued: number;
    status: string;
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    title: string;
    detail: string;
    time: string;
  }>;
  recentTickets: ParkingTicket[];
}

interface OperatorDashboardResponse {
  stats: DashboardStats;
  facilitySummary: FacilityOccupancySummary;
  ticketsToday: number;
  unpaidCount: number;
  upiCount: number;
  cashCount: number;
  recentTickets: ParkingTicket[];
}

function normalizeStats(stats: DashboardStats): DashboardStats {
  return {
    ...stats,
    revenueToday: Number(stats.revenueToday),
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const data = await apiRequest<AdminDashboardResponse>('/dashboard/admin');
  return {
    ...data,
    stats: normalizeStats(data.stats),
    recentTickets: data.recentTickets.map(normalizeTicket),
  };
}

export async function getSupervisorDashboard(): Promise<SupervisorDashboardResponse> {
  const data = await apiRequest<SupervisorDashboardResponse>('/dashboard/supervisor');
  return {
    ...data,
    stats: normalizeStats(data.stats),
    recentTickets: data.recentTickets.map(normalizeTicket),
  };
}

export async function getOperatorDashboard(): Promise<OperatorDashboardResponse> {
  const data = await apiRequest<OperatorDashboardResponse>('/dashboard/operator');
  return {
    ...data,
    stats: normalizeStats(data.stats),
    recentTickets: data.recentTickets.map(normalizeTicket),
  };
}
