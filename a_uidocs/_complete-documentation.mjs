#!/usr/bin/env node
/**
 * Full documentation completion pipeline.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const run = (script) => {
  console.log(`\n>>> node ${script}`);
  execSync(`node "${path.join(dir, script)}"`, { stdio: 'inherit', cwd: path.join(dir, '..') });
};

const steps = [
  '_generate-behavior-catalog.mjs',
  '_generate-all-masters.mjs',
  '_generate-detail-masters.mjs',
  '_enrich-screen-specs-behavior.mjs',
  '_enrich-components-behavior.mjs',
];

for (const s of steps) run(s);

console.log('\n>>> Documentation completion pipeline finished.');
