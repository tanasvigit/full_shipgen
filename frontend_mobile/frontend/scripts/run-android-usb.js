const { execSync, spawnSync } = require("child_process");

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

try {
  sh("adb devices");
} catch {
  fail("adb not found. Install Android platform-tools and add them to PATH.");
}

const devices = sh("adb devices")
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.trim())
  .filter((line) => line.endsWith("device"))
  .map((line) => line.split(/\s+/)[0]);

if (!devices.length) {
  fail("No Android device connected. Enable USB debugging and run: adb devices");
}

const serial = devices[0];
let deviceName = serial;
try {
  deviceName = sh(`adb -s ${serial} shell getprop ro.product.model`) || serial;
} catch {
  // keep serial fallback
}

console.log(`Using device ${deviceName} (${serial})`);

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["expo", "run:android", "--device", deviceName],
  { stdio: "inherit", shell: process.platform === "win32" }
);

process.exit(result.status ?? 1);
