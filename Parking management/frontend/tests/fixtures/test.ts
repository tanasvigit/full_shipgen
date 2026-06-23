/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, request as playwrightRequest, type APIRequestContext, type TestInfo } from '@playwright/test';
import { loginViaUi, logoutViaUi } from '../utils/auth';
import { RuntimeMonitor } from '../utils/runtime-monitor';
import { testEnv, toApiBaseURL, type AppRole } from '../utils/env';

type AppFixture = {
  loginAs: (role: AppRole) => Promise<void>;
  logout: () => Promise<void>;
  unique: (prefix?: string) => string;
  annotate: (
    testInfo: TestInfo,
    metadata: {
      route?: string;
      page?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      coverage?: string[];
    },
  ) => void;
};

export const test = base.extend<{
  runtime: RuntimeMonitor;
  app: AppFixture;
  api: APIRequestContext;
}>({
  runtime: async ({ page }, useFixture, testInfo) => {
    const runtime = new RuntimeMonitor(page);
    runtime.allowRequestFailure('__vite_ping');

    await useFixture(runtime);
    await runtime.assertClean(testInfo);
  },

  app: async ({ page }, useFixture) => {
    await useFixture({
      loginAs: async (role) => loginViaUi(page, role),
      logout: async () => logoutViaUi(page),
      unique: (prefix = 'qa') =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      annotate: (testInfo, metadata) => {
        if (metadata.route) {
          testInfo.annotations.push({ type: 'route', description: metadata.route });
        }

        if (metadata.page) {
          testInfo.annotations.push({ type: 'page', description: metadata.page });
        }

        if (metadata.severity) {
          testInfo.annotations.push({ type: 'severity', description: metadata.severity });
        }

        for (const coverage of metadata.coverage ?? []) {
          testInfo.annotations.push({ type: 'coverage', description: coverage });
        }
      },
    });
  },

  api: async ({ baseURL }, useFixture) => {
    void baseURL;
    const api = await playwrightRequest.newContext({
      baseURL: toApiBaseURL(),
      extraHTTPHeaders: {
        Accept: 'application/json',
      },
    });

    await useFixture(api);
    await api.dispose();
  },
});

export { expect, testEnv };
