/**
 * SocketCluster / broadcasting runtime from config and known channel patterns.
 */

const CHANNEL_CATALOG = [
  {
    channel: 'company.{company_uuid}',
    producer: 'Order/notification broadcasts',
    consumer: 'Console Ember app (socket service)',
    auth: 'Sanctum session + company scope',
    payload: 'order updates, chat, notifications',
    package: 'core-api / fleetops',
  },
  {
    channel: 'driver.{driver_uuid}',
    producer: 'FleetOps dispatch / tracking',
    consumer: 'Navigator driver app',
    auth: 'Driver session',
    payload: 'assignments, pings, route updates',
    package: 'fleetops',
  },
  {
    channel: 'test',
    producer: 'POST settings/test-socket',
    consumer: 'Admin socket config UI',
    auth: 'Admin session',
    payload: 'diagnostic events',
    package: 'core-api',
  },
  {
    channel: 'order.{order_uuid}',
    producer: 'Order lifecycle events / tracking',
    consumer: 'Console order detail / live map',
    auth: 'fleetbase.protected',
    payload: 'status, ETA, position',
    package: 'fleetops',
  },
  {
    channel: 'live/coordinates',
    producer: 'GET /int/v1/fleet-ops/live/coordinates',
    consumer: 'Console live map',
    auth: 'fleetbase.protected',
    payload: 'driver/vehicle positions (HTTP poll + socket)',
    package: 'fleetops',
  },
];

/**
 * @param {(p: string) => string|null} readSafe
 */
export function buildRealtimeCatalog(readSafe) {
  const broadcastConfig = readSafe('packages/core-api/config/broadcasting.connections.php');
  const socketcluster = {
    driver: 'socketcluster',
    host: 'SOCKETCLUSTER_HOST (default socket)',
    port: 'SOCKETCLUSTER_PORT (8000)',
    path: '/socketcluster/',
    secure: 'SOCKETCLUSTER_SECURE',
  };

  if (broadcastConfig) {
    const host = broadcastConfig.match(/'host'\s*=>\s*env\('SOCKETCLUSTER_HOST',\s*'([^']+)'\)/)?.[1];
    const port = broadcastConfig.match(/'port'\s*=>\s*env\('SOCKETCLUSTER_PORT',\s*(\d+)\)/)?.[1];
    const path = broadcastConfig.match(/'path'\s*=>\s*env\('SOCKETCLUSTER_PATH',\s*'([^']+)'\)/)?.[1];
    if (host) socketcluster.host = host;
    if (port) socketcluster.port = port;
    if (path) socketcluster.path = path;
  }

  const consoleEnv = readSafe('console/config/environment.js');
  const bootstrapNote = consoleEnv
    ? 'Ember console loads socketcluster-client; runtime-config maps SOCKETCLUSTER_* env vars'
    : 'See console/config/environment.js socket block';

  const producers = [];
  const notifyListener = readSafe('packages/fleetops/server/src/Listeners/NotifyOrderEvent.php');
  if (notifyListener) {
    producers.push({
      class: 'NotifyOrderEvent',
      queued: true,
      role: 'Push order notifications to socket/broadcast',
    });
  }

  return {
    transport: socketcluster,
    bootstrapNote,
    channels: CHANNEL_CATALOG,
    producers,
    mermaid: `flowchart LR
  subgraph API
    EV[Domain Events]
    L[Queued Listeners]
    BR[Broadcast driver socketcluster]
  end
  subgraph SocketCluster
    SC[SocketCluster broker]
  end
  subgraph Clients
    CON[Console Ember]
    NAV[Navigator]
  end
  EV --> L --> BR --> SC
  SC --> CON
  SC --> NAV`,
    stats: {
      catalogChannels: CHANNEL_CATALOG.length,
      broadcastDriver: 'socketcluster',
    },
  };
}
