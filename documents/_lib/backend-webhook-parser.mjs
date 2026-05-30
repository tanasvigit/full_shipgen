/**
 * Inbound/outbound webhook contracts from routes, controllers, config.
 */

import { parseRoutesFile, getRouteMeta } from './backend-route-parser.mjs';
import { parsePhpClassName, extractFunctionBody } from './backend-php-utils.mjs';

const SAMPLE_TELEMATICS = {
  correlation_id: 'uuid',
  provider: 'samsara',
  position: { lat: 37.77, lng: -122.42, speed: 45 },
  device_id: 'device-123',
};

const SAMPLE_OUTBOUND_WEBHOOK = {
  event: 'order.dispatched',
  company_uuid: 'company-uuid',
  source: 'api',
  data: { id: 'ord_abc', status: 'dispatched' },
};

/**
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildWebhookCatalog(packages, readSafe) {
  const inbound = [];
  const outbound = [];

  for (const pkg of packages) {
    const routesContent = readSafe(pkg.routesFile);
    if (!routesContent) continue;
    const routes = parseRoutesFile(routesContent, {
      basePrefix: pkg.routePrefix ?? '',
      rootNamespace: `${pkg.namespace}\\Http\\Controllers`,
    });

    for (const route of routes) {
      if (!route.path.includes('webhook')) continue;
      const auth = route.path.includes('telematics')
        ? 'X-Webhook-Signature + X-Idempotency-Key'
        : 'varies';
      inbound.push({
        provider: route.path.includes('telematics') ? 'telematics/{providerKey}' : 'custom',
        endpoint: route.path,
        methods: route.methods.join('|'),
        auth,
        handler: route.handlerString,
        events: route.path.includes('telematics') ? 'position ingest, device events' : '—',
        package: pkg.label,
        samplePayload: route.path.includes('telematics') ? SAMPLE_TELEMATICS : {},
        signatureVerification: route.path.includes('telematics')
          ? 'provider->validateWebhookSignature()'
          : '—',
        idempotency: 'IdempotencyManager + X-Idempotency-Key header',
        retryBehavior: 'Provider retries; duplicate → 200 duplicate',
      });
    }
  }

  const telemContent = readSafe(
    'packages/fleetops/server/src/Http/Controllers/TelematicWebhookController.php'
  );
  if (telemContent) {
    const handle = extractFunctionBody(telemContent, 'handle');
    inbound.push({
      provider: 'TelematicWebhookController (multi-provider)',
      endpoint: '/v1/webhooks/telematics/{providerKey}',
      methods: 'ANY',
      auth: 'X-Webhook-Signature, optional idempotency',
      handler: 'TelematicWebhookController@handle',
      events: 'GPS/telemetry ingest per provider registry',
      package: 'FleetOps',
      samplePayload: SAMPLE_TELEMATICS,
      signatureVerification: 'validateWebhookSignature on raw body',
      idempotency: 'IdempotencyManager::isDuplicate',
      retryBehavior: 'Log + JSON status',
      notes: handle.slice(0, 300).replace(/\s+/g, ' '),
    });
  }

  const whConfig = readSafe('packages/core-api/config/webhook-server.php');
  const tries = whConfig?.match(/'tries'\s*=>\s*(\d+)/)?.[1] || '3';
  const timeout = whConfig?.match(/'timeout_in_seconds'\s*=>\s*(\d+)/)?.[1] || '5';

  outbound.push({
    provider: 'Fleetbase outbound (Spatie webhook-server)',
    endpoint: 'Customer-configured WebhookEndpoint URL',
    auth: 'Signature header (DefaultSigner)',
    payload: SAMPLE_OUTBOUND_WEBHOOK,
    events: 'ResourceLifecycleEvent + FleetOps lifecycle events',
    listener: 'SendResourceLifecycleWebhook (queued)',
    tries,
    timeout,
    queue: whConfig?.match(/'queue'\s*=>\s*env\('WEBHOOK_SERVER_QUEUE'\)/) ? 'WEBHOOK_SERVER_QUEUE' : 'default',
    retryBehavior: `Exponential backoff, ${tries} tries`,
    logs: 'webhook_request_logs',
  });

  // Stripe / payment from routes grep
  for (const pkg of packages) {
    const routesContent = readSafe(pkg.routesFile);
    if (!routesContent) continue;
    if (routesContent.includes('stripe')) {
      outbound.push({
        provider: 'Stripe Connect (FleetOps PaymentController)',
        endpoint: '/int/v1/fleet-ops/payments/* (console)',
        auth: 'Stripe session + company context',
        payload: { type: 'checkout.session', account: 'acct_xxx' },
        events: 'Connect onboarding, checkout sessions',
        package: pkg.label,
        notes: 'Not classic webhooks — Stripe API + Connect',
      });
    }
  }

  const ledgerStripe = readSafe('packages/ledger/server/src/Listeners/HandleSuccessfulPayment.php');
  if (ledgerStripe) {
    inbound.push({
      provider: 'Stripe (Ledger)',
      endpoint: 'Stripe webhook → HandleSuccessfulPayment listener',
      auth: 'Stripe signature (verify in listener)',
      payload: { type: 'payment_intent.succeeded' },
      events: 'payment success, refunds',
      package: 'Ledger',
      listener: 'HandleSuccessfulPayment (ShouldQueue)',
    });
  }

  return {
    inbound,
    outbound,
    stats: {
      inboundEndpoints: inbound.length,
      outboundPatterns: outbound.length,
    },
  };
}
