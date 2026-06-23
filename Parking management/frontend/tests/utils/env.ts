import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type AppRole = 'admin' | 'supervisor' | 'operator';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const frontendDir = path.resolve(currentDir, '../..');
const backendDir = path.resolve(frontendDir, '../backend');

function readBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export const testEnv = {
  frontendDir,
  backendDir,
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
  apiURL: process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8000/api/v1',
  backendHealthURL: process.env.PLAYWRIGHT_BACKEND_HEALTH_URL ?? 'http://127.0.0.1:8000/health',
  authDir: path.join(frontendDir, 'tests', '.auth'),
  htmlReportDir: path.join(frontendDir, 'tests', 'reports', 'html'),
  jsonReportPath: path.join(frontendDir, 'tests', 'reports', 'json', 'results.json'),
  markdownReportPath: path.join(frontendDir, 'tests', 'reports', 'bug-report.md'),
  artifactsDir: path.join(frontendDir, 'tests', 'reports', 'test-results'),
  useExistingServers: readBoolean('PLAYWRIGHT_USE_EXISTING_SERVERS', !process.env.CI),
  startFrontend: readBoolean('PLAYWRIGHT_START_FRONTEND', true),
  startBackend: readBoolean('PLAYWRIGHT_START_BACKEND', true),
};

export function toApiBaseURL(): string {
  return testEnv.apiURL.endsWith('/') ? testEnv.apiURL : `${testEnv.apiURL}/`;
}

export function authStatePath(role: AppRole): string {
  return path.join(testEnv.authDir, `${role}.json`);
}

export function toAppOrigin(): string {
  return new URL(testEnv.baseURL).origin;
}
