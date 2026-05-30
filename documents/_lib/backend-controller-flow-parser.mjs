/**
 * Controller method execution flow (static analysis).
 */

import path from 'node:path';
import { extractFunctionBody, parsePhpClassName } from './backend-php-utils.mjs';

const PRIORITY_CONTROLLERS = [
  'packages/fleetops/server/src/Http/Controllers/Internal/v1/OrderController.php',
  'packages/fleetops/server/src/Http/Controllers/Api/v1/OrderController.php',
  'packages/storefront/server/src/Http/Controllers/OrderController.php',
  'packages/core-api/src/Http/Controllers/Internal/v1/AuthController.php',
];

const STEP_PATTERNS = [
  { re: /Validator::make|validate\(/, step: 'Validate request', kind: 'validation' },
  { re: /DB::beginTransaction|->beginTransaction/, step: 'Begin DB transaction', kind: 'transaction' },
  { re: /DB::commit|->commit\(/, step: 'Commit transaction', kind: 'transaction' },
  { re: /DB::rollBack|->rollBack/, step: 'Rollback transaction', kind: 'transaction' },
  { re: /createRecordFromRequest|->create\(|::create\(/, step: 'Create / persist model', kind: 'model' },
  { re: /->update\(|updateRecord/, step: 'Update model', kind: 'model' },
  { re: /::dispatch|dispatch\(new/, step: 'Dispatch job', kind: 'dispatch' },
  { re: /event\s*\(/, step: 'Fire domain event', kind: 'event' },
  { re: /broadcast\s*\(/, step: 'Broadcast realtime update', kind: 'broadcast' },
  { re: /Cache::|->remember\(/, step: 'Cache read/write', kind: 'cache' },
  { re: /Resource::|new \w+Resource/, step: 'Return API resource', kind: 'response' },
  { re: /response\(\)->json|return \$/ , step: 'Return HTTP response', kind: 'response' },
  { re: /Excel::|Export/, step: 'Export data', kind: 'export' },
  { re: /integratedVendor|ServiceQuote/, step: 'Integrated vendor / quote resolution', kind: 'service' },
  { re: /Activity::|->process\(/, step: 'Flow / activity transition', kind: 'workflow' },
];

function analyzeMethodBody(body, methodName) {
  const steps = [];
  const seen = new Set();
  for (const { re, step, kind } of STEP_PATTERNS) {
    if (re.test(body) && !seen.has(step)) {
      seen.add(step);
      steps.push({ order: steps.length + 1, step, kind });
    }
  }
  if (!steps.length) {
    steps.push({ order: 1, step: 'Execute controller logic', kind: 'generic' });
  }
  return { method: methodName, steps, lineCount: body.split('\n').length };
}

function parseControllerFile(content, relPath) {
  const className = parsePhpClassName(content) || relPath;
  const methods = [];
  const re = /public\s+function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[\w\\|?]+)?\s*\{/g;
  let m;
  while ((m = re.exec(content))) {
    const name = m[1];
    if (name.startsWith('__')) continue;
    const body = extractFunctionBody(content, name);
    if (!body || body.length < 5) continue;
    methods.push({
      ...analyzeMethodBody(body, name),
      className,
      relPath,
    });
  }
  return { className, relPath, methods };
}

/**
 * @param {(p: string) => string|null} readSafe
 * @param {string} repoRoot
 * @param {string[]} allControllerPaths
 */
export function buildControllerFlows(readSafe, repoRoot, allControllerPaths) {
  const flows = [];
  const prioritySet = new Set(
    PRIORITY_CONTROLLERS.filter((p) => readSafe(p) != null)
  );

  for (const rel of allControllerPaths) {
    const isPriority =
      prioritySet.has(rel) ||
      PRIORITY_CONTROLLERS.some((p) => rel.includes(p.replace(/\\/g, '/'))) ||
      rel.includes('OrderController') ||
      rel.includes('Payment') ||
      rel.includes('Checkout') ||
      rel.includes('DriverController');

    if (!isPriority && flows.length > 80) continue;

    const content = readSafe(rel);
    if (!content) continue;
    const parsed = parseControllerFile(content, rel);
    const significant = parsed.methods.filter(
      (m) =>
        ['createRecord', 'updateRecord', 'dispatch', 'cancel', 'checkout', 'assign'].some(
          (n) => m.method.includes(n)
        ) || m.lineCount > 40
    );
    if (!significant.length && !isPriority) continue;

    flows.push({
      ...parsed,
      methods: isPriority ? parsed.methods.filter((m) => m.method !== 'onAfterUpdate') : significant.slice(0, 8),
      priority: isPriority,
    });
  }

  flows.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

  return {
    flows: flows.slice(0, 35),
    stats: {
      controllers: flows.length,
      methods: flows.reduce((n, f) => n + f.methods.length, 0),
    },
  };
}
