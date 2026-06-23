import fs from 'node:fs/promises';
import path from 'node:path';
import { request, type FullConfig } from '@playwright/test';
import { writeStorageStateForRole } from './utils/auth';
import { testEnv, toApiBaseURL } from './utils/env';

export default async function globalSetup(config: FullConfig) {
  await fs.mkdir(testEnv.authDir, { recursive: true });
  await fs.mkdir(testEnv.htmlReportDir, { recursive: true });
  await fs.mkdir(testEnv.artifactsDir, { recursive: true });
  await fs.mkdir(path.dirname(testEnv.jsonReportPath), { recursive: true });

  const apiContext = await request.newContext({
    baseURL: toApiBaseURL(),
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  });

  try {
    await Promise.all([
      writeStorageStateForRole(apiContext, 'admin'),
      writeStorageStateForRole(apiContext, 'supervisor'),
      writeStorageStateForRole(apiContext, 'operator'),
    ]);
  } finally {
    await apiContext.dispose();
  }

  config.metadata ??= {};
  config.metadata.baseURL = testEnv.baseURL;
  config.metadata.apiURL = testEnv.apiURL;
}
