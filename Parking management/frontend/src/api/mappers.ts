import type { ParkingTicket } from '../types';

export function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

export function normalizeTicket(ticket: ParkingTicket): ParkingTicket {
  return {
    ...ticket,
    amount: toNumber(ticket.amount),
    paymentMethod: ticket.paymentMethod ?? 'Cash',
  };
}
