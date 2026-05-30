/**
 * Infrastructure runtime topology from docker-compose, Helm, env config.
 */

/**
 * @param {(p: string) => string|null} readSafe
 */
export function buildInfraTopology(readSafe) {
  const components = [];
  const compose = readSafe('docker-compose.yml');

  if (compose) {
    const serviceBlocks = compose.split(/^\s{2}(\w[\w-]*):\s*$/m).slice(1);
    for (let i = 0; i < serviceBlocks.length; i += 2) {
      const name = serviceBlocks[i];
      const block = serviceBlocks[i + 1] || '';
      if (!name || name === 'version') continue;
      const image =
        block.match(/image:\s*([^\n]+)/)?.[1]?.trim() ||
        block.match(/build:\s*\n\s+context:\s*([^\n]+)/)?.[1]?.trim() ||
        'build';
      const command = block.match(/command:\s*(\[[^\]]+\]|[^\n]+)/)?.[1]?.trim();
      const depends = [...block.matchAll(/depends_on:\s*\n((?:\s+-\s+\w+\n?)+)/g)];
      const depList = depends.length
        ? [...depends[0][1].matchAll(/-\s+(\w+)/g)].map((m) => m[1])
        : [];
      components.push({
        component: name,
        image: image.replace(/['"]/g, ''),
        dependsOn: depList.join(', ') || '—',
        purpose: inferPurpose(name, command),
        command: command || '—',
      });
    }
  }

  const helmValues = readSafe('infra/helm/values.yaml');
  const helmNotes = helmValues
    ? 'Chart: API, Redis, SocketCluster, ingress, HPA, install hooks'
    : 'See infra/helm/';

  const envGroups = [
    { group: 'Database', vars: ['DATABASE_URL', 'DB_HOST', 'DB_DATABASE', 'SANDBOX_DB_CONNECTION'] },
    { group: 'Cache/Queue', vars: ['REDIS_URL', 'CACHE_URL', 'QUEUE_CONNECTION', 'CACHE_DRIVER'] },
    { group: 'Realtime', vars: ['BROADCAST_DRIVER', 'SOCKETCLUSTER_HOST', 'SOCKETCLUSTER_PORT'] },
    { group: 'Storage', vars: ['FILESYSTEM_DISK', 'AWS_*', 'S3_*'] },
    { group: 'Observability', vars: ['SENTRY_LARAVEL_DSN', 'LOG_CHANNEL'] },
  ];

  return {
    components,
    helmNotes,
    envGroups,
    stats: { components: components.length },
    mermaid: buildTopologyMermaid(components),
  };
}

function inferPurpose(name, command) {
  const map = {
    cache: 'Redis — cache + queue backend',
    database: 'MySQL primary datastore',
    socket: 'SocketCluster websocket broker',
    scheduler: 'Cron / scheduled artisan commands',
    queue: 'Queue workers (artisan queue:work)',
    application: 'Laravel API (FrankenPHP/Octane)',
    console: 'Ember console static assets',
    httpd: 'Reverse proxy / TLS termination',
  };
  if (map[name]) return map[name];
  if (command?.includes('queue:work')) return 'Queue worker';
  if (command?.includes('crond')) return 'Scheduler';
  return 'Runtime service';
}

function buildTopologyMermaid(components) {
  const lines = ['flowchart TB'];
  const names = components.map((c) => c.component);
  for (const c of components) {
    const id = c.component.replace(/-/g, '_');
    lines.push(`  ${id}[${c.component}]`);
  }
  for (const c of components) {
    const id = c.component.replace(/-/g, '_');
    for (const dep of c.dependsOn.split(',').map((d) => d.trim()).filter(Boolean)) {
      if (names.includes(dep)) {
        lines.push(`  ${dep.replace(/-/g, '_')} --> ${id}`);
      }
    }
  }
  lines.push('  application --> database');
  lines.push('  application --> cache');
  lines.push('  application --> socket');
  lines.push('  queue --> cache');
  lines.push('  scheduler --> database');
  return lines.join('\n');
}
