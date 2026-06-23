import { apiRequest } from './client';

export function listActiveOperators() {
  return apiRequest<Array<{
    id: string;
    name: string;
    shift: string;
    ticketsIssued: number;
    status: string;
  }>>('/monitoring/operators');
}

export function listAlerts() {
  return apiRequest<Array<{
    id: string;
    severity: string;
    title: string;
    detail: string;
    time: string;
  }>>('/monitoring/alerts');
}

export function listQrScans() {
  return apiRequest<Array<{
    id: string;
    ticket: string;
    vehicle: string;
    action: string;
    status: string;
    time: string;
  }>>('/monitoring/qr-scans');
}

export function listEntries() {
  return apiRequest<Array<{
    vehicle: string;
    category: string;
    time: string;
    ticketId?: string | null;
  }>>('/monitoring/entries');
}

export function listExits() {
  return apiRequest<Array<{
    vehicle: string;
    category: string;
    time: string;
    ticketId?: string | null;
  }>>('/monitoring/exits');
}
