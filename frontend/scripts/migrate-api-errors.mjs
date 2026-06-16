import fs from "fs";
import path from "path";

const root = path.resolve("src");
const importLine = 'import { parseApiError } from "@/lib/errors";';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

const patterns = [
  [/toast\.error\(err\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "toast.error(parseApiError(err, $1$2$1))"],
  [/toast\.error\(err\?\.friendlyMessage \|\| (`.*?`)\)/g, "toast.error(parseApiError(err, $1))"],
  [/toast\.error\(error\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "toast.error(parseApiError(error, $1$2$1))"],
  [/setError\(err\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "setError(parseApiError(err, $1$2$1))"],
  [/setLoadErr\(err\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "setLoadErr(parseApiError(err, $1$2$1))"],
  [/setLoadError\(err\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "setLoadError(parseApiError(err, $1$2$1))"],
  [/setCartError\(err\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "setCartError(parseApiError(err, $1$2$1))"],
  [/err\?\.friendlyMessage \|\| err\?\.message \|\| (["'])(.*?)\1/g, "parseApiError(err, $1$2$1"],
  [/err\?\.friendlyMessage \|\| err\?\.message \|\| (`.*?`)/g, "parseApiError(err, $1)"],
  [
    /err\?\.friendlyMessage \|\| err\?\.response\?\.data\?\.errors\?\.\[0\] \|\| err\?\.message \|\| (["'])(.*?)\1/g,
    "parseApiError(err, $1$2$1",
  ],
  [/toast\.error\(err\?\.message \|\| (["'])(.*?)\1\)/g, "toast.error(parseApiError(err, $1$2$1))"],
  [/toast\.error\(error\?\.message \|\| (["'])(.*?)\1\)/g, "toast.error(parseApiError(error, $1$2$1))"],
  [/toast\.error\(inner\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "toast.error(parseApiError(inner, $1$2$1))"],
  [/throw new Error\(err\?\.friendlyMessage \|\| (["'])(.*?)\1\)/g, "throw new Error(parseApiError(err, $1$2$1))"],
  [/const message = err\?\.friendlyMessage \|\| (["'])(.*?)\1;/g, "const message = parseApiError(err, $1$2$1);"],
  [/toast\.error\(parseFleetopsApiError\(err\)\)/g, "toast.error(parseApiError(err))"],
  [/setError\(parseFleetopsApiError\(err\)\)/g, "setError(parseApiError(err))"],
];

function ensureImport(src) {
  if (!src.includes("parseApiError")) return src;
  if (/import\s*\{[^}]*parseApiError[^}]*\}\s*from/.test(src)) return src;
  const lines = src.split("\n");
  let insertAt = 0;
  while (insertAt < lines.length && /^import\s/.test(lines[insertAt])) insertAt++;
  lines.splice(insertAt, 0, importLine);
  return lines.join("\n");
}

let changed = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  const orig = src;
  for (const [re, rep] of patterns) src = src.replace(re, rep);
  if (src === orig) continue;
  src = ensureImport(src);
  fs.writeFileSync(file, src);
  changed++;
}
console.log(`Updated ${changed} files.`);
