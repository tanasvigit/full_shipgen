/**
 * Parses Laravel EventServiceProvider $listen maps and ServiceProvider $observers.
 */

import path from 'node:path';

function shortClass(fqcn) {
  return String(fqcn)
    .replace(/::class$/, '')
    .split('\\')
    .pop();
}

function extractBalancedArray(content, marker) {
  const re = new RegExp(marker);
  const m = content.match(re);
  if (!m) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < content.length && depth > 0) {
    if (content[i] === '[') depth++;
    if (content[i] === ']') depth--;
    i++;
  }
  return content.slice(start, i - 1);
}

/**
 * @param {string} body inner of $listen = [ ... ]
 * @param {string} file
 */
export function parseListenBody(body, file) {
  const rows = [];
  let currentEvent = null;
  const listeners = [];

  const flush = () => {
    if (currentEvent && listeners.length) {
      rows.push({
        event: currentEvent,
        listeners: [...new Set(listeners)],
        file,
      });
    }
    listeners.length = 0;
    currentEvent = null;
  };

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed === '*/'
    ) {
      continue;
    }

    const eventStart = trimmed.match(
      /^([\\\w]+(?:::class)?)\s*=>\s*\[(.*)$/
    );
    if (eventStart) {
      flush();
      currentEvent = shortClass(eventStart[1]);
      const rest = eventStart[2];
      for (const lm of rest.matchAll(/([\\\w]+)::class/g)) {
        const name = shortClass(lm[1]);
        if (name !== currentEvent) listeners.push(name);
      }
      if (rest.trim().endsWith('],') || rest.trim() === '],') {
        flush();
      }
      continue;
    }

    if (currentEvent) {
      for (const lm of trimmed.matchAll(/([\\\w]+)::class/g)) {
        const name = shortClass(lm[1]);
        if (name !== currentEvent) listeners.push(name);
      }
      if (trimmed.includes('],')) {
        flush();
      }
    }
  }
  flush();
  return rows;
}

/**
 * @param {string} content
 * @param {string} file
 */
export function parseEventServiceProvider(content, file) {
  const body = extractBalancedArray(content, /protected\s+\$listen\s*=\s*\[/);
  if (!body) return [];
  return parseListenBody(body, file);
}

/**
 * @param {string} content
 * @param {string} file
 */
export function parseObserversProperty(content, file) {
  const body = extractBalancedArray(content, /public\s+\$observers\s*=\s*\[/);
  if (!body) return [];
  const rows = [];
  const pairRe =
    /([\\\w]+)::class\s*=>\s*([\\\w]+)::class/g;
  let m;
  while ((m = pairRe.exec(body))) {
    rows.push({
      model: shortClass(m[1]),
      observer: shortClass(m[2]),
      file,
    });
  }
  return rows;
}

/**
 * @param {string[]} providerFiles
 * @param {(path: string) => string|null} readSafe
 */
export function buildEventListenerIndex(providerFiles, readSafe) {
  const listen = [];
  const observers = [];

  for (const file of providerFiles) {
    const content = readSafe(file);
    if (!content) continue;
    if (file.includes('EventServiceProvider')) {
      listen.push(...parseEventServiceProvider(content, file));
    }
    observers.push(...parseObserversProperty(content, file));
  }

  return { listen, observers };
}

/**
 * @param {typeof import('../_build-backend-llrd.mjs').PACKAGES} packages
 * @param {(path: string) => string|null} readSafe
 * @param {(dir: string) => string[]} walkDirFn
 */
export function collectPackageEventData(packages, readSafe, walkDirFn) {
  const byPackage = [];
  const shellProviders = [
    ...new Set([
      'api/app/Providers/EventServiceProvider.php',
      ...walkDirFn('api/app/Providers').filter((f) =>
        f.endsWith('ServiceProvider.php')
      ),
    ]),
  ];
  const shellIndex = buildEventListenerIndex(shellProviders, readSafe);

  for (const pkg of packages) {
    const providerFiles = walkDirFn(path.join(pkg.srcRoot, 'Providers')).filter(
      (f) => f.endsWith('ServiceProvider.php')
    );
    const eventProvider = path
      .join(pkg.srcRoot, 'Providers/EventServiceProvider.php')
      .replace(/\\/g, '/');
    if (readSafe(eventProvider) && !providerFiles.includes(eventProvider)) {
      providerFiles.push(eventProvider);
    }
    const index = buildEventListenerIndex(providerFiles, readSafe);
    byPackage.push({
      id: pkg.id,
      label: pkg.label,
      ...index,
    });
  }

  return { byPackage, shell: shellIndex };
}
