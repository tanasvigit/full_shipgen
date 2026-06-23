import fs from 'node:fs/promises';
import path from 'node:path';
import type { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

interface MarkdownBugReporterOptions {
  outputFile?: string;
}

function annotationValue(test: TestCase, type: string): string | undefined {
  return test.annotations.find((annotation) => annotation.type === type)?.description;
}

function annotationValues(test: TestCase, type: string): string[] {
  return test.annotations
    .filter((annotation) => annotation.type === type)
    .map((annotation) => annotation.description)
    .filter((value): value is string => Boolean(value));
}

function attachmentPath(result: TestResult, name: string): string {
  const attachment = result.attachments.find(
    (item) => item.path && item.name.toLowerCase().includes(name.toLowerCase()),
  );

  if (!attachment?.path) {
    return 'n/a';
  }

  return path.relative(process.cwd(), attachment.path);
}

function firstError(result: TestResult): string {
  const message = result.errors[0]?.message ?? result.error?.message ?? 'No explicit error message recorded.';
  return message.split('\n').slice(0, 6).join('\n');
}

export default class MarkdownBugReporter implements Reporter {
  private suite?: Suite;

  private readonly latestResults = new Map<string, { test: TestCase; result: TestResult }>();

  constructor(private readonly options: MarkdownBugReporterOptions = {}) {}

  onBegin(_: FullConfig, suite: Suite) {
    this.suite = suite;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.latestResults.set(test.id, { test, result });
  }

  async onEnd() {
    if (!this.suite) {
      return;
    }

    const outputFile = this.options.outputFile ?? path.join('tests', 'reports', 'bug-report.md');
    const tests = this.suite.allTests();
    const total = tests.length;
    const passed = tests.filter((test) => test.outcome() === 'expected').length;
    const failed = tests.filter((test) => test.outcome() === 'unexpected').length;
    const flaky = tests.filter((test) => test.outcome() === 'flaky').length;
    const skipped = tests.filter((test) => test.outcome() === 'skipped').length;
    const routeCoverage = [...new Set(tests.flatMap((test) => annotationValues(test, 'route')))].sort();
    const uiCoverage = [...new Set(tests.flatMap((test) => annotationValues(test, 'coverage')))].sort();
    const failures = tests.filter((test) => ['unexpected', 'flaky'].includes(test.outcome()));

    const lines: string[] = [
      '# Playwright Bug Report',
      '',
      '## Summary',
      `- Total tests: ${total}`,
      `- Passed tests: ${passed}`,
      `- Failed tests: ${failed}`,
      `- Flaky tests: ${flaky}`,
      `- Skipped tests: ${skipped}`,
      '',
      '## Route Coverage',
      ...(routeCoverage.length > 0 ? routeCoverage.map((route) => `- ${route}`) : ['- No annotated routes captured']),
      '',
      '## UI Coverage',
      ...(uiCoverage.length > 0 ? uiCoverage.map((area) => `- ${area}`) : ['- No UI coverage annotations captured']),
      '',
      '## Bugs',
    ];

    if (failures.length === 0) {
      lines.push('- No failing or flaky tests were recorded in this run.');
    } else {
      for (const test of failures) {
        const latest = this.latestResults.get(test.id);
        const result = latest?.result;
        const route = annotationValue(test, 'route') ?? 'n/a';
        const page = annotationValue(test, 'page') ?? route;
        const severity = annotationValue(test, 'severity') ?? (route.includes('/auth') ? 'high' : 'medium');

        lines.push('');
        lines.push(`### ${test.title}`);
        lines.push(`- title: ${test.titlePath().slice(1).join(' > ')}`);
        lines.push(`- severity: ${severity}`);
        lines.push(`- route/page: ${page}`);
        lines.push('- reproduction steps:');
        lines.push(`  1. Run \`npm run test:e2e -- --grep "${test.title.replace(/"/g, '\\"')}"\`.`);
        if (route !== 'n/a') {
          lines.push(`  2. Open \`${route}\`.`);
        }
        lines.push(`  3. Execute the flow described by the test title: "${test.title}".`);
        lines.push('  4. Inspect the trace, video, and screenshot artifacts captured for the failure.');
        lines.push('- expected behavior: The annotated route and UI flow should complete without assertion, runtime, or network failures.');
        lines.push(`- actual behavior: ${result ? firstError(result) : 'No result payload was captured.'}`);
        lines.push(`- screenshot path: ${result ? attachmentPath(result, 'screenshot') : 'n/a'}`);
        lines.push(`- video path: ${result ? attachmentPath(result, 'video') : 'n/a'}`);
        lines.push(`- probable root cause: ${result ? firstError(result) : 'n/a'}`);
      }
    }

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, `${lines.join('\n')}\n`, 'utf8');
  }
}
