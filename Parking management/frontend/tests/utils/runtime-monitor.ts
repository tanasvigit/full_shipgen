import { expect, type Page, type TestInfo } from '@playwright/test';

type Pattern = string | RegExp;

interface RuntimeIssue {
  kind: 'console' | 'pageerror' | 'response' | 'requestfailed';
  message: string;
  url?: string;
  status?: number;
  method?: string;
}

interface AllowedResponseRule {
  pattern: Pattern;
  statuses?: number[];
}

interface AllowedConsoleRule {
  pattern: Pattern;
  types?: string[];
}

function matches(pattern: Pattern, value: string): boolean {
  if (typeof pattern === 'string') {
    return value.includes(pattern);
  }

  return pattern.test(value);
}

export class RuntimeMonitor {
  private readonly issues: RuntimeIssue[] = [];

  private readonly allowedResponses: AllowedResponseRule[] = [];

  private readonly allowedRequestFailures: Pattern[] = [];

  private readonly allowedConsoleMessages: AllowedConsoleRule[] = [];

  constructor(page: Page) {
    page.on('console', (message) => {
      if (message.type() !== 'error') {
        return;
      }

      if (
        this.allowedConsoleMessages.some(
          (rule) =>
            matches(rule.pattern, message.text()) &&
            (rule.types === undefined || rule.types.includes(message.type())),
        )
      ) {
        return;
      }

      this.issues.push({
        kind: 'console',
        message: message.text(),
        url: page.url(),
      });
    });

    page.on('pageerror', (error) => {
      this.issues.push({
        kind: 'pageerror',
        message: error.message,
        url: page.url(),
      });
    });

    page.on('requestfailed', (request) => {
      const url = request.url();

      if (request.resourceType() === 'websocket') {
        return;
      }

      if (this.allowedRequestFailures.some((pattern) => matches(pattern, url))) {
        return;
      }

      this.issues.push({
        kind: 'requestfailed',
        message: request.failure()?.errorText ?? 'Request failed',
        url,
        method: request.method(),
      });
    });

    page.on('response', (response) => {
      if (response.ok()) {
        return;
      }

      const request = response.request();
      const resourceType = request.resourceType();
      const url = response.url();
      const status = response.status();

      if (status === 304) {
        return;
      }

      if (!['document', 'fetch', 'xhr', 'script', 'stylesheet'].includes(resourceType)) {
        return;
      }

      if (
        this.allowedResponses.some(
          (rule) =>
            matches(rule.pattern, url) && (rule.statuses === undefined || rule.statuses.includes(status)),
        )
      ) {
        return;
      }

      this.issues.push({
        kind: 'response',
        message: response.statusText(),
        url,
        status,
        method: request.method(),
      });
    });
  }

  allowResponse(pattern: Pattern, statuses?: number[]) {
    this.allowedResponses.push({ pattern, statuses });
  }

  allowRequestFailure(pattern: Pattern) {
    this.allowedRequestFailures.push(pattern);
  }

  allowConsole(pattern: Pattern, types?: string[]) {
    this.allowedConsoleMessages.push({ pattern, types });
  }

  async assertClean(testInfo: TestInfo) {
    if (this.issues.length === 0) {
      return;
    }

    await testInfo.attach('runtime-issues', {
      body: JSON.stringify(this.issues, null, 2),
      contentType: 'application/json',
    });

    expect(
      this.issues,
      `Unexpected runtime issues were detected:\n${JSON.stringify(this.issues, null, 2)}`,
    ).toEqual([]);
  }
}
