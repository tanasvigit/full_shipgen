/**
 * Maps screen filename patterns → MASTER spec files.
 */
import fs from 'fs';
import path from 'path';

export function buildRegistryFromMasters(screensDirs) {
  const registry = [];
  for (const dir of screensDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.startsWith('MASTER__') || !f.endsWith('-detail-complete.md')) continue;
      const master = f;
      const slug = f.replace(/^MASTER__/, '').replace(/-detail-complete\.md$/, '');
      const patternParts = slug.split('-').filter(Boolean);
      registry.push({
        master,
        dir: path.basename(dir),
        slug,
        pattern: new RegExp(patternParts.join('__').replace(/__/g, '__|') + '|' + slug.replace(/-/g, '__')),
      });
    }
  }
  registry.sort((a, b) => b.slug.length - a.slug.length);
  return registry;
}

export function masterForScreenFile(fileName, registry) {
  const base = fileName.replace(/\.md$/, '');
  if (base.startsWith('MASTER__')) return null;
  for (const r of registry) {
    if (base.includes(r.slug.replace(/-/g, '__')) || base.includes(r.slug.replace(/-/g, '_'))) {
      return r.master;
    }
  }
  const rules = [
    [/operations__orders__/, 'MASTER__order-detail-complete.md'],
    [/management__drivers/, 'MASTER__driver-detail-complete.md'],
    [/management__vehicles/, 'MASTER__vehicle-detail-complete.md'],
    [/management__places/, 'MASTER__place-detail-complete.md'],
    [/management__fleets/, 'MASTER__fleet-detail-complete.md'],
    [/management__contacts__customers/, 'MASTER__customer-detail-complete.md'],
    [/management__contacts/, 'MASTER__contact-detail-complete.md'],
    [/management__vendors__integrated/, 'MASTER__integrated-vendor-detail-complete.md'],
    [/management__vendors/, 'MASTER__vendor-detail-complete.md'],
    [/management__issues/, 'MASTER__issue-detail-complete.md'],
    [/management__fuel-reports/, 'MASTER__fuel-report-detail-complete.md'],
    [/maintenance__work-orders/, 'MASTER__work-order-detail-complete.md'],
    [/maintenance__schedules/, 'MASTER__maintenance-schedule-detail-complete.md'],
    [/maintenance__maintenances/, 'MASTER__maintenance-detail-complete.md'],
    [/maintenance__parts/, 'MASTER__part-detail-complete.md'],
    [/maintenance__equipment/, 'MASTER__equipment-detail-complete.md'],
    [/operations__service-rates/, 'MASTER__service-rate-detail-complete.md'],
    [/connectivity__devices/, 'MASTER__device-detail-complete.md'],
    [/connectivity__sensors/, 'MASTER__sensor-detail-complete.md'],
    [/connectivity__telematics/, 'MASTER__telematic-detail-complete.md'],
    [/analytics__reports/, 'MASTER__report-detail-complete.md'],
    [/billing__invoices/, 'MASTER__invoice-detail-complete.md'],
    [/accounting__accounts/, 'MASTER__ledger-account-detail-complete.md'],
    [/accounting__journal/, 'MASTER__journal-entry-detail-complete.md'],
    [/payments__gateways/, 'MASTER__payment-gateway-detail-complete.md'],
    [/payments__wallets/, 'MASTER__wallet-detail-complete.md'],
    [/payments__transactions/, 'MASTER__payment-transaction-detail-complete.md'],
  ];
  for (const [re, master] of rules) {
    if (re.test(base)) return master;
  }
  return null;
}

export function patchMasterLinksInFile(md, fileName, registry, engineDir) {
  const master = masterForScreenFile(fileName, registry);
  if (!master) {
    if (md.includes('MASTER__order-detail-complete') && !fileName.includes('orders')) {
      const alt = masterForScreenFile(fileName, registry) || null;
      if (alt) md = md.replace(/MASTER__order-detail-complete\.md/g, alt);
    }
    return md;
  }
  const link = engineDir ? `./${master}` : master;
  md = md.replace(/> \*\*Full merged spec:\*\* \[MASTER__[^\]]+\]\([^)]+\)\n\n/g, '');
  if (!md.includes(master)) {
    const insert = `\n> **Full merged spec:** [${master}](${link})\n\n`;
    if (md.includes('## Deep specification')) {
      md = md.replace('## Deep specification', `${insert}## Deep specification`);
    } else if (md.includes('## 16.')) {
      md = md.replace(/(## 16\.[\s\S]*?)(\n---\n\n## 17)/, `$1${insert}$2`);
    } else {
      md += insert;
    }
  }
  if (md.includes('MASTER__order-detail-complete') && master !== 'MASTER__order-detail-complete.md') {
    md = md.replace(/MASTER__order-detail-complete\.md/g, master);
  }
  return md;
}
