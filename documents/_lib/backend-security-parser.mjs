/**
 * Security analysis engine (static patterns).
 */

import { walkPhpFiles } from './backend-php-utils.mjs';

const PRIORITY_PATHS = [
  'payment',
  'auth',
  'webhook',
  'Policy',
  'Middleware',
  'broadcast',
  'Order',
  'Credential',
];

/**
 * @param {string} repoRoot
 * @param {object[]} packages
 * @param {(p: string) => string|null} readSafe
 */
export function buildSecurityAnalysis(repoRoot, packages, readSafe) {
  const findings = [];

  for (const pkg of packages) {
    for (const rel of walkPhpFiles(repoRoot, pkg.srcRoot)) {
      if (!PRIORITY_PATHS.some((p) => rel.includes(p))) continue;
      const content = readSafe(rel);
      if (!content) continue;

      if (/DB::raw|whereRaw|selectRaw/.test(content) && rel.includes('Controller')) {
        findings.push({
          severity: 'medium',
          area: 'SQL injection surface',
          finding: 'Raw SQL in controller layer',
          recommendation: 'Move to query builder / parameterized scopes',
          location: rel,
        });
      }

      if (/\$request->all\(\)|\$request->input\(\)/.test(content) && !/validate|FormRequest/.test(content)) {
        findings.push({
          severity: 'medium',
          area: 'Mass assignment',
          finding: 'Bulk request input without visible validation',
          recommendation: 'Use FormRequest or explicit fillable guards',
          location: rel,
        });
      }

      if (/broadcast\(|ShouldBroadcast/.test(content) && !/company|tenant|authorize/i.test(content)) {
        findings.push({
          severity: 'low',
          area: 'Realtime',
          finding: 'Broadcast without obvious tenant guard in file',
          recommendation: 'Verify channel authorization callbacks',
          location: rel,
        });
      }

      if (rel.includes('webhook') && !/signature|validateWebhook|Idempotency/i.test(content)) {
        findings.push({
          severity: 'high',
          area: 'Webhooks',
          finding: 'Webhook handler may lack signature verification',
          recommendation: 'Enforce provider signature + idempotency keys',
          location: rel,
        });
      }

      if (/Log::|logger\(/.test(content) && /password|secret|token|api_key/i.test(content)) {
        findings.push({
          severity: 'high',
          area: 'Sensitive logging',
          finding: 'Potential credential logging',
          recommendation: 'Redact secrets in log context',
          location: rel,
        });
      }

      if (rel.includes('Policy') && content.includes('function viewAny') && content.length < 200) {
        findings.push({
          severity: 'low',
          area: 'Authorization',
          finding: 'Minimal policy — verify permission mapping',
          recommendation: 'Align with Auth Schema permissions',
          location: rel,
        });
      }
    }
  }

  const severityOrder = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    findings: findings.slice(0, 40),
    stats: {
      total: findings.length,
      high: findings.filter((f) => f.severity === 'high').length,
    },
  };
}
