import fs from "fs";
import path from "path";

const root = path.resolve("src");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(jsx?|tsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

let fixed = 0;
for (const file of walk(root)) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let changed = false;
  const next = lines.map((line) => {
    if (!line.includes("parseApiError") || !line.includes(")));")) return line;
    const repaired = line.replace(/\)\)\);/g, "));");
    if (repaired !== line) changed = true;
    return repaired;
  });
  if (changed) {
    fs.writeFileSync(file, next.join("\n"));
    fixed++;
  }
}

console.log(`Removed extra parens in ${fixed} files.`);
