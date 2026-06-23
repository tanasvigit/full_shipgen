import type { User, UserRole } from '../types';
import { apiRequest } from './client';

export function listUsers(search?: string): Promise<User[]> {
  const query = search ? `?${new URLSearchParams({ search }).toString()}` : '';
  return apiRequest<User[]>(`/users${query}`);
}

export function createUser(payload: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status?: 'active' | 'inactive';
}): Promise<User> {
  return apiRequest<User>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(
  userId: string,
  payload: Partial<{
    name: string;
    email: string;
    password: string;
    role: UserRole;
    status: 'active' | 'inactive';
  }>,
): Promise<User> {
  return apiRequest<User>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(userId: string): Promise<void> {
  return apiRequest<void>(`/users/${userId}`, { method: 'DELETE' });
}
