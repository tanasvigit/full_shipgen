import type { EntryType, ParkingTicket, PaymentMethod, VehicleCategory } from '../types';
import { apiRequest } from './client';
import { normalizeTicket } from './mappers';

export function listTickets(): Promise<ParkingTicket[]> {
  return apiRequest<ParkingTicket[]>('/tickets').then((tickets) => tickets.map(normalizeTicket));
}

export function searchTickets(query: string): Promise<ParkingTicket[]> {
  const params = new URLSearchParams({ query });
  return apiRequest<ParkingTicket[]>(`/tickets/search?${params.toString()}`).then((tickets) =>
    tickets.map(normalizeTicket),
  );
}

export function createTicket(payload: {
  vehicleNumber: string;
  category: VehicleCategory;
  entryType: EntryType;
  paymentMethod?: PaymentMethod;
  pay_now?: boolean;
}): Promise<ParkingTicket> {
  return apiRequest<ParkingTicket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(normalizeTicket);
}

export function collectPayment(ticketId: string, paymentMethod: PaymentMethod): Promise<ParkingTicket> {
  return apiRequest<ParkingTicket>(`/tickets/${ticketId}/payments`, {
    method: 'POST',
    body: JSON.stringify({ paymentMethod }),
  }).then(normalizeTicket);
}

export function getTicketQr(ticketId: string): Promise<{
  ticketId: string;
  vehicleNumber: string;
  amount: number | string;
  category: string;
  floorName?: string | null;
  floorNumber?: number | null;
  slotStatus?: string | null;
  qrPayload: string;
}> {
  return apiRequest(`/tickets/${ticketId}/qr`);
}
