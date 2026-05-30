/**
 * Service container bindings from ServiceProviders.
 */

import { walkPhpFiles, parsePhpClassName } from './backend-php-utils.mjs';

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildContainerMap(repoRoot, packages, readSafe) {
  const bindings = [];
  const providers = [];
  const seen = new Set();

  for (const pkg of packages) {
    const providerDir = `${pkg.srcRoot}/Providers`;
    for (const rel of walkPhpFiles(repoRoot, providerDir)) {
      const content = readSafe(rel);
      if (!content) continue;
      const className = parsePhpClassName(content) || rel;
      providers.push({
        class: className,
        package: pkg.label,
        file: rel,
        hasBoot: content.includes('function boot('),
        hasRegister: content.includes('function register('),
      });

      for (const m of content.matchAll(
        /\$this->app->(singleton|bind|scoped)\s*\(\s*([^,]+),\s*([^)]+)\)/g
      )) {
        const scope = m[1];
        const iface = m[2].trim().replace(/::class/g, '').replace(/'/g, '');
        const impl = m[3].trim().slice(0, 120);
        const key = `${iface}|${scope}`;
        if (seen.has(key)) continue;
        seen.add(key);
        bindings.push({
          interface: iface,
          implementation: impl,
          scope,
          provider: className.split('\\').pop(),
          package: pkg.label,
        });
      }

      for (const m of content.matchAll(/app\('([^']+)'\)/g)) {
        bindings.push({
          interface: m[1],
          implementation: '(string binding)',
          scope: 'bind',
          provider: className.split('\\').pop(),
          package: pkg.label,
        });
      }
    }
  }

  const bootOrder = providers
    .filter((p) => p.hasRegister)
    .map((p, i) => ({ order: i + 1, ...p }));

  return {
    bindings: bindings.sort((a, b) => a.interface.localeCompare(b.interface)),
    providers: bootOrder,
    stats: {
      bindings: bindings.length,
      providers: providers.length,
    },
    mermaid: buildContainerMermaid(bindings.slice(0, 20)),
  };
}

function buildContainerMermaid(bindings) {
  const lines = ['flowchart LR'];
  lines.push('  subgraph Providers');
  const provs = [...new Set(bindings.map((b) => b.provider))].slice(0, 6);
  for (const p of provs) lines.push(`    ${p.replace(/[^a-zA-Z0-9]/g, '_')}[${p}]`);
  lines.push('  end');
  for (const b of bindings.slice(0, 8)) {
    const i = b.interface.split('\\').pop().replace(/[^a-zA-Z0-9]/g, '_');
    const impl = b.implementation.includes('function')
      ? 'closure'
      : b.implementation.split('\\').pop()?.replace(/[^a-zA-Z0-9]/g, '_') || 'impl';
    lines.push(`  ${i} --> ${impl}`);
  }
  return lines.join('\n');
}
