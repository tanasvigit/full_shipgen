import fs from "fs";
import path from "path";

const root = path.resolve("src");
const importLine = 'import { parseApiError } from "@/lib/errors";';

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(jsx?|tsx?|mjs)$/.test(ent.name)) files.push(p);
  }
  return files;
}

let fixed = 0;
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  const orig = src;

  // Repair import inserted inside another import block (CRLF or LF).
  src = src.replace(
    /import \{\r?\nimport \{ parseApiError \} from "@\/lib\/errors";\r?\n/g,
    `${importLine}\r\nimport {\r\n`,
  );

  // Fix missing closing paren when parseApiError is wrapped in a function call.
  src = src.replace(
    /(toast\.error|setError|setLoadError|setLoadErr|setCartError|throw new Error)\(parseApiError\(([^;]+?)\);/g,
    "$1(parseApiError($2));",
  );

  if (src !== orig) {
    fs.writeFileSync(file, src);
    fixed++;
    console.log("fixed:", path.relative(root, file));
  }
}

console.log(`Repaired ${fixed} files.`);
