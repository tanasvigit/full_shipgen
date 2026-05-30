/**
 * Parses Laravel Job classes and schedule→job mappings.
 */

import path from 'node:path';
import { parsePhpClassName, extractFunctionBody, walkPhpFiles } from './backend-php-utils.mjs';

function parseJobFile(content, relPath) {
  const className = parsePhpClassName(content) || relPath;
  const shortName = className.split('\\').pop();

  const implementsQueue = /implements\s+ShouldQueue/.test(content);
  const usesQueueable = /use\s+Queueable/.test(content);

  const tries = content.match(/public\s+(?:int\s+)?\$tries\s*=\s*(\d+)/)?.[1];
  const timeout = content.match(/public\s+(?:int\s+)?\$timeout\s*=\s*(\d+)/)?.[1];
  const backoff = content.match(/public\s+(?:array\s+)?\$backoff\s*=\s*\[([^\]]+)\]/)?.[1];
  const queue = content.match(/\$this->onQueue\s*\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
  const connection = content.match(/\$this->onConnection\s*\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];

  const ctor = extractFunctionBody(content, '__construct');
  const payloadFields = [];
  for (const m of ctor.matchAll(/(?:public|protected)\s+(?:array|string|int)\s+\$(\w+)/g)) {
    payloadFields.push(m[1]);
  }
  for (const m of ctor.matchAll(/@param\s+\w+\s+\$(\w+)/g)) {
    if (!payloadFields.includes(m[1])) payloadFields.push(m[1]);
  }

  const handleBody = extractFunctionBody(content, 'handle');
  const sideEffects = [];
  if (/::dispatch|dispatch\(/.test(handleBody)) sideEffects.push('dispatches nested jobs');
  if (/event\(/.test(handleBody)) sideEffects.push('fires events');
  if (/Notification::|->notify\(/.test(handleBody)) sideEffects.push('sends notifications');
  if (/::create\(|->update\(|->save\(/.test(handleBody)) sideEffects.push('DB writes');

  const failedMethod = content.includes('function failed(') ? 'failed(Throwable)' : '—';

  return {
    className,
    shortName,
    relPath,
    queue: queue || 'default',
    connection: connection || 'default (QUEUE_CONNECTION)',
    implementsQueue,
    usesQueueable,
    tries: tries || (implementsQueue ? '3 (Laravel default)' : 'sync'),
    timeout: timeout || '—',
    backoff: backoff ? backoff.replace(/\s+/g, ' ').trim() : '—',
    payloadFields: payloadFields.length ? payloadFields : ['—'],
    middleware: content.match(/middleware\s*\(\s*\[([^\]]+)\]/)?.[1] || '—',
    chainedJobs: [...handleBody.matchAll(/([A-Z][\w]+Job)::dispatch/g)].map((m) => m[1]),
    failureBehavior: failedMethod,
    sideEffects,
    triggerSource: inferTrigger(content, relPath),
  };
}

function inferTrigger(content, relPath) {
  const short = path.basename(relPath, '.php');
  if (short === 'LogApiRequest') return 'Middleware LogApiRequests (fleetbase.api)';
  if (short === 'MaterializeSchedulesJob') return 'Scheduler dailyAt 01:00 (CoreServiceProvider)';
  if (short === 'ProcessAllocationJob') return 'Order auto-allocation / listeners';
  if (short.includes('Telematic')) return 'Telematics sync / webhooks';
  if (short.includes('Replay') || short.includes('Position')) return 'FleetOps tracking / replay API';
  return 'Application dispatch (search codebase)';
}

/**
 * Parse $schedule->... from provider boot closures.
 * @param {string} content
 * @param {string} file
 */
export function parseScheduleBlock(content, file) {
  const rows = [];
  const scheduleIdx = content.indexOf('$schedule->');
  if (scheduleIdx < 0) return rows;

  const block = content.slice(scheduleIdx, scheduleIdx + 8000);
  const lines = block.split('\n').slice(0, 40);

  for (const line of lines) {
    const cmd = line.match(/\$schedule->command\s*\(\s*['"]([^'"]+)['"]/);
    if (cmd) {
      const freq =
        line.match(/->(hourly|daily|twiceDaily|weekly|monthly|everyMinute|everyTenMinutes)\([^)]*\)/)?.[1] ||
        line.match(/->dailyAt\s*\(\s*['"]([^'"]+)['"]\s*\)/)?.[1] ||
        'scheduled';
      rows.push({
        type: 'command',
        target: cmd[1],
        frequency: freq,
        queue: 'sync (artisan)',
        purpose: cmd[1],
        file,
      });
      continue;
    }
    const job = line.match(/\$schedule->job\s*\(\s*new\s+\\?([\w\\]+)\(\)/);
    if (job) {
      const name = line.match(/->name\s*\(\s*['"]([^'"]+)['"]\s*\)/)?.[1];
      const freq =
        line.match(/->dailyAt\s*\(\s*['"]([^'"]+)['"]\s*\)/)?.[1] ||
        line.match(/->(hourly|daily)\(\)/)?.[1] ||
        'scheduled';
      rows.push({
        type: 'job',
        target: job[1],
        frequency: freq,
        queue: 'default',
        purpose: name || job[1].split('\\').pop(),
        file,
        withoutOverlapping: line.includes('withoutOverlapping'),
      });
    }
  }
  return rows;
}

/**
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 * @param {string} repoRoot
 */
export function buildJobCatalog(packages, readSafe, repoRoot) {
  const jobs = [];
  const schedules = [];
  const dispatchRefs = [];

  for (const pkg of packages) {
    const jobFiles = walkPhpFiles(repoRoot, path.join(pkg.srcRoot, 'Jobs'));
    for (const rel of jobFiles) {
      const content = readSafe(rel);
      if (!content || !/class\s+\w+/.test(content)) continue;
      jobs.push({ ...parseJobFile(content, rel), package: pkg.label, pkgId: pkg.id });
    }

    const providerDir = path.join(pkg.srcRoot, 'Providers');
    for (const rel of walkPhpFiles(repoRoot, providerDir)) {
      const content = readSafe(rel);
      if (!content) continue;
      schedules.push(...parseScheduleBlock(content, rel).map((s) => ({ ...s, package: pkg.label })));
    }
  }

  // Core triggers from known middleware
  const logMw = readSafe('packages/core-api/src/Http/Middleware/LogApiRequests.php');
  if (logMw) {
    dispatchRefs.push({
      source: 'LogApiRequests middleware',
      job: 'Fleetbase\\Jobs\\LogApiRequest',
      mode: logMw.includes('Bus::dispatch') ? 'async (queue)' : 'sync',
    });
  }

  const horizon = readSafe('packages/core-api/config/horizon.php');
  const queueConfig = readSafe('packages/core-api/config/queue.php') || readSafe('api/config/queue.php');

  return {
    jobs: jobs.sort((a, b) => a.className.localeCompare(b.className)),
    schedules: schedules.sort((a, b) => a.target.localeCompare(b.target)),
    dispatchRefs,
    queueTopology: summarizeQueues(jobs, queueConfig, horizon),
  };
}

function summarizeQueues(jobs, queueConfig, horizon) {
  const names = new Set(jobs.map((j) => j.queue).filter((q) => q !== 'default'));
  if (queueConfig?.includes('webhook')) names.add('webhooks (WEBHOOK_SERVER_QUEUE)');
  return {
    defaultConnection: 'redis/database per QUEUE_CONNECTION',
    namedQueues: [...names],
    horizonEnabled: horizon != null,
    retryOverview: 'Jobs implement ShouldQueue; failed jobs → failed_jobs table; webhook tries=3 with exponential backoff',
  };
}
