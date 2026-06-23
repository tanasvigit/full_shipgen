import type { User } from '../types';
import { apiRequest, getToken, setToken } from './client';

export interface MeResponse extends User {
  permissions: string[];
}

export async function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me');
}

export async function login(email: string, password: string): Promise<MeResponse> {
  const response = await apiRequest<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setToken(response.access_token);
  return fetchMe();
}

/** Exchange Shipgen IAM session for a PMS JWT when embedded in the console. */
export async function platformLogin(platformAccessToken: string): Promise<MeResponse> {
  const response = await apiRequest<{ access_token: string }>('/auth/platform-login', {
    method: 'POST',
    headers: { Authorization: `Bearer ${platformAccessToken}` },
    body: JSON.stringify({}),
  });

  setToken(response.access_token);
  return fetchMe();
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore logout failures and clear local session anyway.
  }

  setToken(null);
}

export async function restoreSession(): Promise<MeResponse | null> {
  if (!getToken()) {
    return null;
  }

  try {
    return await fetchMe();
  } catch {
    setToken(null);
    return null;
  }
}
