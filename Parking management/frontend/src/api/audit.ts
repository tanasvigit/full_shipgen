import type { AuditLog } from '../types';
import { apiRequest } from './client';

export function listAuditLogs(): Promise<AuditLog[]> {
  return apiRequest<AuditLog[]>('/audit-logs');
}
