/**
 * Continuous architecture snapshots for trend / diff analysis.
 */

import fs from 'node:fs';
import path from 'node:path';

export function loadLatestSnapshot(snapshotsDir) {
  const latestPath = path.join(snapshotsDir, 'latest.json');
  if (!fs.existsSync(latestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} snapshotsDir
 * @param {object} metrics
 */
export function persistSnapshot(snapshotsDir, metrics) {
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
  }

  const payload = {
    generated: new Date().toISOString(),
    metrics,
  };

  const stamp = payload.generated.replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(snapshotsDir, `${stamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(snapshotsDir, 'latest.json'),
    JSON.stringify(payload, null, 2),
    'utf8'
  );

  const files = fs
    .readdirSync(snapshotsDir)
    .filter((f) => f.endsWith('.json') && f !== 'latest.json')
    .sort()
    .reverse();
  for (const old of files.slice(12)) {
    try {
      fs.unlinkSync(path.join(snapshotsDir, old));
    } catch {
      /* ignore */
    }
  }

  return payload;
}

export function diffSnapshots(previous, current) {
  if (!previous?.metrics) return { deltas: {}, trend: 'baseline' };
  const deltas = {};
  for (const [k, v] of Object.entries(current)) {
    const prev = previous.metrics[k];
    if (typeof v === 'number' && typeof prev === 'number') {
      deltas[k] = v - prev;
    }
  }
  return { deltas, trend: 'delta', previousAt: previous.generated };
}
