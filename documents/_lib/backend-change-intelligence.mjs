/**
 * Git / semantic change intelligence (churn, hot modules).
 */

import { execSync } from 'node:child_process';
import path from 'node:path';

/**
 * @param {string} repoRoot
 * @param {number} months
 */
export function buildChangeIntelligence(repoRoot, months = 6) {
  const rows = [];
  let gitAvailable = true;

  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: repoRoot,
      stdio: 'pipe',
    });
  } catch {
    gitAvailable = false;
  }

  if (!gitAvailable) {
    return {
      rows: [],
      hotModules: [],
      stats: { gitAvailable: false },
      export: { version: 1, gitAvailable: false, components: [] },
      mermaid: 'flowchart LR\n  git[Git unavailable] --> skip[Use CI snapshot only]',
    };
  }

  const since = `--since=${months}.months.ago`;
  let logOutput = '';
  try {
    logOutput = execSync(
      `git log ${since} --pretty=format: --name-only -- packages/ api/app`,
      { cwd: repoRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch {
    gitAvailable = false;
  }

  const churn = new Map();
  if (logOutput) {
    for (const line of logOutput.split('\n')) {
      const f = line.trim();
      if (!f || !f.endsWith('.php')) continue;
      const component = inferComponent(f);
      churn.set(component, (churn.get(component) || 0) + 1);
    }
  }

  try {
    const shortlog = execSync(
      `git shortlog -sn ${since} -- packages/`,
      { cwd: repoRoot, encoding: 'utf8' }
    );
    var topContributors = shortlog
      .split('\n')
      .filter(Boolean)
      .slice(0, 5)
      .map((l) => l.trim());
  } catch {
    var topContributors = [];
  }

  for (const [component, count] of [...churn.entries()].sort((a, b) => b[1] - a[1])) {
    const risk = count > 80 ? 'high' : count > 35 ? 'medium' : 'low';
    rows.push({
      component,
      churn: count,
      risk,
      contributors: topContributors.slice(0, 2).join(', ') || '—',
    });
  }

  const hotModules = rows.filter((r) => r.risk !== 'low').slice(0, 20);

  return {
    rows: rows.slice(0, 50),
    hotModules,
    stats: {
      gitAvailable: true,
      componentsTracked: rows.length,
      highChurn: rows.filter((r) => r.risk === 'high').length,
    },
    export: {
      version: 1,
      generated: new Date().toISOString(),
      components: rows,
    },
    mermaid: buildChurnMermaid(rows.slice(0, 8)),
  };
}

function inferComponent(filePath) {
  if (filePath.includes('fleetops')) return 'fleetops';
  if (filePath.includes('core-api')) return 'core-api';
  if (filePath.includes('storefront')) return 'storefront';
  if (filePath.includes('ledger')) return 'ledger';
  if (filePath.includes('migrations')) return `migration:${path.basename(filePath)}`;
  if (filePath.includes('Controllers')) return `controller:${path.basename(filePath, '.php')}`;
  if (filePath.includes('Jobs')) return `job:${path.basename(filePath, '.php')}`;
  if (filePath.includes('Listeners')) return `listener:${path.basename(filePath, '.php')}`;
  if (filePath.includes('Policies')) return `policy:${path.basename(filePath, '.php')}`;
  return path.dirname(filePath).split('/').slice(-2).join('/');
}

function buildChurnMermaid(top) {
  const lines = ['flowchart TD'];
  for (const r of top) {
    const id = r.component.replace(/[^a-zA-Z0-9_]/g, '_');
    lines.push(`  ${id}["${r.component} (${r.churn})"]`);
  }
  return lines.join('\n');
}
