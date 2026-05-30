/**
 * Operational observability: logging, metrics, health, error tracking.
 */

import { walkPhpFiles } from './backend-php-utils.mjs';

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildObservabilityCatalog(repoRoot, packages, readSafe) {
  const areas = [];
  const silentAsync = [];

  const loggingConfig = readSafe('api/config/logging.php') || readSafe('packages/core-api/config/logging.php');
  const sentryConfig =
    readSafe('api/config/sentry.php') ||
    (readSafe('composer.json')?.includes('sentry') ? 'Sentry SDK in composer' : null);

  areas.push({
    area: 'API request logs',
    logging: 'LogApiRequests middleware → LogApiRequest job',
    metrics: 'api_request_logs table',
    alerts: 'purge:api-logs scheduled',
  });
  areas.push({
    area: 'Webhooks',
    logging: 'LogSuccessfulWebhook / LogFailedWebhook listeners',
    metrics: 'webhook_request_logs',
    alerts: 'purge:webhook-logs scheduled',
  });
  areas.push({
    area: 'Scheduled tasks',
    logging: 'storeOutputInDb() on schedule',
    metrics: 'monitored_scheduled_tasks',
    alerts: 'Spatie schedule monitor',
  });
  areas.push({
    area: 'Queue failures',
    logging: 'failed_jobs table',
    metrics: 'Horizon optional',
    alerts: 'Manual / ops',
  });
  areas.push({
    area: 'Telemetry',
    logging: 'telemetry:ping daily',
    metrics: 'Fleetbase telemetry ping',
    alerts: '—',
  });

  if (sentryConfig) {
    areas.push({
      area: 'Exception tracking',
      logging: 'Sentry Laravel integration',
      metrics: 'Sentry issues',
      alerts: 'Sentry project rules',
    });
  }

  const healthRoutes = [];
  for (const pkg of packages) {
    const routes = readSafe(pkg.routesFile);
    if (routes?.match(/health|status|ping/i)) {
      healthRoutes.push({ package: pkg.label, note: 'health/status route present' });
    }
  }

  let jobCount = 0;
  let jobsWithFailed = 0;
  for (const pkg of packages) {
    for (const rel of walkPhpFiles(repoRoot, `${pkg.srcRoot}/Jobs`)) {
      jobCount++;
      const c = readSafe(rel);
      if (c?.includes('function failed(')) jobsWithFailed++;
      else if (c?.includes('ShouldQueue')) silentAsync.push(rel);
    }
  }

  return {
    areas,
    healthRoutes,
    loggingChannels: loggingConfig?.match(/'(\w+)'\s*=>\s*\[/)?.[1] || 'stack',
    stats: {
      areas: areas.length,
      jobs: jobCount,
      jobsWithFailedHandler: jobsWithFailed,
      silentAsyncJobs: silentAsync.length,
    },
    silentAsync: silentAsync.slice(0, 15),
  };
}
