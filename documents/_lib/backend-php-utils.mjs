/**
 * Shared PHP static analysis helpers for LLRD parsers.
 */

import fs from 'node:fs';
import path from 'node:path';

/** @param {string} content */
export function parsePhpClassName(content) {
  const m = content.match(/namespace\s+([^;]+);\s*[\s\S]*?class\s+(\w+)/);
  if (!m) return null;
  return `${m[1].trim()}\\${m[2]}`;
}

/** @param {string} content */
export function extractFunctionBody(content, name) {
  const re = new RegExp(
    `function\\s+${name}\\s*\\([^)]*\\)(?:\\s*:\\s*[\\w\\\\|?]+)?\\s*\\{`,
    'm'
  );
  const m = content.match(re);
  if (!m) return '';
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < content.length && depth > 0) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') depth--;
    i++;
  }
  return content.slice(start, i - 1);
}

/**
 * @param {string} root
 * @param {string} relDir
 * @param {string} [ext]
 */
export function walkPhpFiles(root, relDir, ext = '.php') {
  const abs = path.join(root, relDir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.name.endsWith(ext)) {
        out.push(path.relative(root, full).replace(/\\/g, '/'));
      }
    }
  }
  walk(abs);
  return out;
}

/** @param {(p: string) => string|null} readSafe */
export function readPhpFiles(root, relPaths, readSafe) {
  return relPaths
    .map((rel) => {
      const content = readSafe(rel);
      if (!content) return null;
      return { relPath: rel, content, className: parsePhpClassName(content) };
    })
    .filter(Boolean);
}
