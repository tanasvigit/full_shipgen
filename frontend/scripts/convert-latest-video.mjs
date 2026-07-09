// Convert the most recent Playwright .webm recording to .mp4 using ffmpeg-static.
// Usage: node scripts/convert-latest-video.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const root = process.cwd();
const searchDir = path.join(root, "e2e-video-results");
const outDir = path.join(root, "e2e-videos");

function findWebms(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue; // skip temp artifact dirs
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findWebms(full));
    else if (entry.name.endsWith(".webm")) out.push(full);
  }
  return out;
}

if (!fs.existsSync(searchDir)) {
  console.error(`No recordings dir: ${searchDir}`);
  process.exit(1);
}

const webms = findWebms(searchDir).sort(
  (a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs,
);

if (webms.length === 0) {
  console.error("No .webm recordings found.");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const source = webms[0];
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const target = path.join(outDir, `order-lifecycle-${stamp}.mp4`);

console.log(`Source: ${source}`);
console.log(`Target: ${target}`);

execFileSync(
  ffmpegPath,
  [
    "-y",
    "-i", source,
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
    target,
  ],
  { stdio: "inherit" },
);

const sizeMB = (fs.statSync(target).size / (1024 * 1024)).toFixed(2);
console.log(`\nDone: ${target} (${sizeMB} MB)`);
