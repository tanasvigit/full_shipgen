import type { HardwareDevice } from '../types';
import { apiRequest } from './client';

export function listHardware(): Promise<HardwareDevice[]> {
  return apiRequest<HardwareDevice[]>('/hardware');
}

export function restartHardware(deviceId: string): Promise<HardwareDevice> {
  return apiRequest<HardwareDevice>(`/hardware/${deviceId}/restart`, { method: 'POST' });
}
